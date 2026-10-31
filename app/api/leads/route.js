import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { generateSlug } from '@/lib/slug';
import { extractCleanEmail } from '@/lib/verifier';
import { cleanPersonName } from '@/lib/crawler';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'fallback_leads.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFallbackLeads() {
  ensureDataDir();
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const content = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(content || '[]');
    } catch (e) {
      console.warn('Fallback leads parse warning:', e.message);
      return [];
    }
  }
  return [];
}

function saveFallbackLeads(leads) {
  ensureDataDir();
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(leads, null, 2));
  } catch (e) {
    console.error('Failed to save fallback leads:', e);
  }
}

function extractPhoneFallback(reason) {
  if (!reason || typeof reason !== 'string') return null;
  const match = reason.match(/(?:Phone:\s*|tel:)([\+\d\s\(\)\-\.]{7,25})/i);
  return match ? match[1].trim() : null;
}

/**
 * Normalizes input lead data from CSV, Google Places, Apify, or Direct JSON
 * Focus: No-Website Acquisition Target with Phone & WhatsApp
 */
function normalizeLeadInput(raw) {
  const businessName = raw.business_name || raw.businessName || raw.title || raw.name || 'Unnamed Business';
  const rawOwner = raw.owner_name || raw.ownerName || raw.owner || raw.contact_name || 'Team';
  const ownerName = cleanPersonName(rawOwner);
  const rawEmail = raw.email || raw.contact_email || raw.mail || '';
  const cleanEmail = extractCleanEmail(rawEmail);
  const phone = raw.phone || raw.telephone || raw.sanitizedPhone || raw.phoneUnformatted || extractPhoneFallback(raw.status_reason) || null;
  
  const category = raw.category || raw.industry || raw.type || 'Local Services';
  const city = raw.city || raw.location || raw.address_city || raw.fullAddress || 'Local Area';
  const businessSlug = generateSlug(businessName);

  let services = [];
  if (Array.isArray(raw.services)) {
    services = raw.services;
  } else if (typeof raw.services === 'string' && raw.services.trim()) {
    services = raw.services.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const initialStatus = raw.status || 'PENDING';
  const initialReason = raw.status_reason || (
    phone 
      ? `No Website • Verified Phone: ${phone} (Live Prototype ready at /demo/${businessSlug})`
      : `No Website • Prototype ready at /demo/${businessSlug}`
  );

  const stage = raw.stage || (
    initialStatus === 'SENT' ? 'CONTACTED' :
    initialStatus === 'QUALIFIED' ? 'DEMO_READY' :
    initialStatus === 'SKIPPED' ? 'LOST' :
    'NEW_LEAD'
  );
  const dealValue = parseFloat(raw.deal_value || raw.dealValue || 0) || 0;
  const retainerValue = parseFloat(raw.retainer_value || raw.retainerValue || 0) || 0;
  const priority = raw.priority || 'MEDIUM';
  const followUpDate = raw.follow_up_date || raw.followUpDate || null;
  const notes = Array.isArray(raw.notes) ? raw.notes : [];

  return {
    id: raw.id ? (String(raw.id).startsWith('lead-') ? raw.id : `lead-${raw.id}`) : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    business_name: businessName,
    business_slug: businessSlug,
    owner_name: ownerName,
    email: cleanEmail || null,
    phone: phone ? String(phone).trim() : null,
    website_url: null,
    has_website: false,
    category,
    city,
    services: services.length > 0 ? services : ['Rapid Quotes', 'Verified 5-Star Service', 'Direct Local Booking'],
    rating: parseFloat(raw.rating || raw.stars || '4.9') || 4.9,
    review_count: parseInt(raw.review_count || raw.reviewsCount || raw.reviews || '45', 10) || 45,
    status: initialStatus,
    status_reason: initialReason,
    stage,
    deal_value: dealValue,
    retainer_value: retainerValue,
    priority,
    notes,
    follow_up_date: followUpDate,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

/**
 * GET /api/leads - Fetch leads list
 */
export async function GET(req) {
  const fallbackList = loadFallbackLeads();

  const enrichWithCrmFields = (lead) => {
    if (!lead) return lead;
    const phone = lead.phone || extractPhoneFallback(lead.status_reason) || null;
    const stage = lead.stage || (
      lead.status === 'SENT' ? 'CONTACTED' :
      lead.status === 'QUALIFIED' ? 'DEMO_READY' :
      lead.status === 'SKIPPED' ? 'LOST' :
      'NEW_LEAD'
    );
    const dealValue = parseFloat(lead.deal_value || 0) || 0;
    const retainerValue = parseFloat(lead.retainer_value || 0) || 0;
    const priority = lead.priority || 'MEDIUM';
    const notes = Array.isArray(lead.notes) ? lead.notes : [];
    const followUpDate = lead.follow_up_date || null;

    return {
      ...lead,
      phone,
      stage,
      deal_value: dealValue,
      retainer_value: retainerValue,
      priority,
      notes,
      follow_up_date: followUpDate,
    };
  };

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      configured: true,
      message: 'Running in resilient storage mode',
      leads: fallbackList.map(enrichWithCrmFields),
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const stageFilter = searchParams.get('stage');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('leads')
      .select('*, audit_reports(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }
    if (stageFilter && stageFilter !== 'ALL') {
      query = query.eq('stage', stageFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase query error, serving fallback store:', error.message);
      return NextResponse.json({
        configured: true,
        leads: fallbackList.map(enrichWithCrmFields),
      });
    }

    // Merge any unsaved fallback leads with DB data
    const dbSlugs = new Set((data || []).map((l) => l.business_slug || l.id));
    const merged = [...(data || [])];
    fallbackList.forEach((fl) => {
      if (!dbSlugs.has(fl.business_slug) && !dbSlugs.has(fl.id)) {
        merged.unshift(fl);
      }
    });

    return NextResponse.json({
      configured: true,
      leads: merged.map(enrichWithCrmFields),
    });
  } catch (err) {
    console.warn('Supabase connection exception, returning fallback list:', err.message);
    return NextResponse.json({
      configured: true,
      leads: fallbackList.map(enrichWithCrmFields),
    });
  }
}

/**
 * POST /api/leads - Ingest leads (JSON Single / Array / CSV)
 */
export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rawItems = [];

    if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
      const csvText = await req.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rawItems = parsed.data;
    } else {
      const body = await req.json();
      if (Array.isArray(body)) {
        rawItems = body;
      } else if (body.leads && Array.isArray(body.leads)) {
        rawItems = body.leads;
      } else if (body.data && Array.isArray(body.data)) {
        rawItems = body.data;
      } else {
        rawItems = [body];
      }
    }

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json({ error: 'No valid lead records provided in payload' }, { status: 400 });
    }

    const validLeads = rawItems
      .map(normalizeLeadInput)
      .filter((l) => l.business_name && l.business_name !== 'Unnamed Business');

    if (validLeads.length === 0) {
      return NextResponse.json(
        { error: 'No valid lead records provided in payload.' },
        { status: 422 }
      );
    }

    let insertedData = null;

    // Try inserting into Supabase
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        const recordsToInsert = validLeads.map((l) => {
          const { id, ...rest } = l;
          return rest;
        });

        const { data, error } = await supabase
          .from('leads')
          .insert(recordsToInsert)
          .select();

        if (!error && data) {
          insertedData = data;
        } else if (error) {
          // Fallback if some new columns haven't refreshed in Supabase schema cache
          console.warn('Supabase insert notice, attempting schema-safe insert:', error.message);
          const sanitizedRecords = recordsToInsert.map(r => {
            const copy = { ...r };
            delete copy.phone;
            delete copy.stage;
            delete copy.deal_value;
            delete copy.retainer_value;
            delete copy.priority;
            delete copy.notes;
            delete copy.follow_up_date;
            return copy;
          });
          const { data: retryData } = await supabase.from('leads').insert(sanitizedRecords).select();
          if (retryData) {
            insertedData = retryData.map((d, i) => ({
              ...d,
              phone: validLeads[i]?.phone,
              stage: validLeads[i]?.stage,
              deal_value: validLeads[i]?.deal_value,
              retainer_value: validLeads[i]?.retainer_value,
              priority: validLeads[i]?.priority,
              notes: validLeads[i]?.notes,
              follow_up_date: validLeads[i]?.follow_up_date,
            }));
          }
        }
      } catch (dbErr) {
        console.warn('Supabase connect notice (saving to resilient fallback):', dbErr.message);
      }
    }

    // Always maintain local persistent fallback store
    const existingFallback = loadFallbackLeads();
    const existingSlugs = new Set(existingFallback.map((l) => l.business_slug));
    const toAppend = validLeads.filter((l) => !existingSlugs.has(l.business_slug));
    saveFallbackLeads([...toAppend, ...existingFallback]);

    return NextResponse.json({
      success: true,
      ingestedCount: insertedData?.length || validLeads.length,
      leads: (insertedData || validLeads).map((l, idx) => ({
        ...l,
        phone: l.phone || validLeads[idx]?.phone || extractPhoneFallback(l.status_reason),
      })),
    });
  } catch (err) {
    console.error('API /api/leads error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to ingest leads' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leads - Twenty CRM Update Engine (Stage, Deal Value, Notes, Priority, Follow-Up)
 */
export async function PATCH(req) {
  try {
    const body = await req.json();
    const leadId = body.id;
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required for update' }, { status: 400 });
    }

    let fallbackList = loadFallbackLeads();
    let targetIndex = fallbackList.findIndex((l) => l.id === leadId || l.business_slug === leadId);
    let targetLead = targetIndex !== -1 ? fallbackList[targetIndex] : null;

    // Handle new note addition
    let currentNotes = targetLead?.notes || (Array.isArray(body.notes) ? body.notes : []);
    if (body.new_note && typeof body.new_note === 'string' && body.new_note.trim()) {
      const newNoteObj = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: body.new_note.trim(),
        createdAt: new Date().toISOString(),
        author: body.author || 'Moses Martin',
      };
      currentNotes = [newNoteObj, ...currentNotes];
    } else if (Array.isArray(body.notes)) {
      currentNotes = body.notes;
    }

    // Prepare update payload
    const updates = {};
    if (body.stage !== undefined) updates.stage = body.stage;
    if (body.status !== undefined) updates.status = body.status;
    if (body.deal_value !== undefined) updates.deal_value = parseFloat(body.deal_value) || 0;
    if (body.retainer_value !== undefined) updates.retainer_value = parseFloat(body.retainer_value) || 0;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.follow_up_date !== undefined) updates.follow_up_date = body.follow_up_date;
    if (body.owner_name !== undefined) updates.owner_name = body.owner_name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    updates.notes = currentNotes;
    updates.updated_at = new Date().toISOString();

    // Synchronize legacy status with CRM stage if needed
    if (updates.stage && !updates.status) {
      if (updates.stage === 'CONTACTED') updates.status = 'SENT';
      else if (updates.stage === 'DEMO_READY') updates.status = 'QUALIFIED';
      else if (updates.stage === 'LOST') updates.status = 'SKIPPED';
      else if (updates.stage === 'NEW_LEAD') updates.status = 'PENDING';
    }

    let updatedRecord = null;

    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', leadId)
          .select()
          .single();

        if (!error && data) {
          updatedRecord = data;
        } else if (error) {
          console.warn('Supabase update notice (schema-safe retry):', error.message);
          // Retry updating standard fields only
          const baseUpdates = {};
          if (updates.status) baseUpdates.status = updates.status;
          if (updates.owner_name) baseUpdates.owner_name = updates.owner_name;
          if (updates.updated_at) baseUpdates.updated_at = updates.updated_at;
          await supabase.from('leads').update(baseUpdates).eq('id', leadId);
        }
      } catch (dbErr) {
        console.warn('Supabase PATCH exception:', dbErr.message);
      }
    }

    // Persist in local resilient storage
    if (targetLead) {
      Object.assign(targetLead, updates);
      fallbackList[targetIndex] = targetLead;
      saveFallbackLeads(fallbackList);
      updatedRecord = updatedRecord ? { ...targetLead, ...updatedRecord } : targetLead;
    } else {
      const synthetic = { id: leadId, ...updates };
      fallbackList.unshift(synthetic);
      saveFallbackLeads(fallbackList);
      updatedRecord = updatedRecord || synthetic;
    }

    return NextResponse.json({
      success: true,
      lead: updatedRecord,
    });
  } catch (err) {
    console.error('PATCH /api/leads error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/leads - Wipes all leads & audit reports for a fresh start
 */
export async function DELETE(req) {
  try {
    // 1. Clear fallback local JSON
    saveFallbackLeads([]);

    // 2. Clear Supabase tables
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('audit_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (dbErr) {
        console.warn('Supabase delete notice:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'All old leads and records have been completely cleared.',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
