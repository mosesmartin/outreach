import { requestAccess } from '@/lib/websiteRequestAccess';
import { leadContactSafety, syntheticLeadReason } from '@/lib/leadSafety.mjs';
import { currentDemoDraft } from '@/lib/manualDemo.mjs';
import { publicDemoDraft } from '@/lib/demoRequirements.mjs';
import { persistLeadImports, restoreImportedLead } from '@/lib/leadImport.mjs';
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
 * Normalizes input lead data from CSV (including gosom/google-maps-scraper, Apify, or Google Maps)
 * Strict Focus: Businesses WITHOUT a website ("woh company kya krti ha", phone, stars, address)
 */
function normalizeLeadInput(raw, filterNoWebsite = true) {
  const rawWebsite = raw.website || raw.website_url || raw.link || raw.web_site || raw.url || null;
  const hasWebsite = Boolean(
    rawWebsite && 
    String(rawWebsite).trim().length > 4 && 
    !String(rawWebsite).includes('google.com') && 
    !String(rawWebsite).includes('facebook.com') &&
    !String(rawWebsite).includes('instagram.com')
  );

  if (filterNoWebsite && hasWebsite) {
    return { __skipped: true, reason: 'HAS_WEBSITE', rawWebsite };
  }

  const businessName = raw.business_name || raw.businessName || raw.title || raw.name || 'Unnamed Business';
  const rawOwner = raw.owner_name || raw.ownerName || raw.owner || raw.contact_name || 'Team';
  const ownerName = cleanPersonName(rawOwner);
  const rawEmail = raw.email || raw.emails || raw.contact_email || raw.mail || '';
  const cleanEmail = extractCleanEmail(rawEmail);
  const phone = raw.phone || raw.phone_number || raw.telephone || raw.sanitizedPhone || raw.phoneUnformatted || raw.international_phone_number || extractPhoneFallback(raw.status_reason) || null;
  
  const category = raw.category || raw.categories || raw.industry || raw.type || 'Local Services';
  const city = raw.city || raw.location || raw.address_city || raw.neighborhood || 'Local Area';
  const address = raw.address || raw.street || raw.formatted_address || raw.full_address || raw.fullAddress || (city !== 'Local Area' ? city : '');
  const businessSlug = generateSlug(businessName);

  let services = [];
  if (Array.isArray(raw.services)) {
    services = raw.services;
  } else if (Array.isArray(raw.categories)) {
    services = raw.categories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
  } else if (typeof raw.services === 'string' && raw.services.trim()) {
    services = raw.services.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (typeof raw.categories === 'string' && raw.categories.trim()) {
    services = raw.categories.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (typeof raw.category === 'string' && raw.category.trim()) {
    services = raw.category.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const rating = Number.parseFloat(raw.rating || raw.review_rating || raw.stars || raw.total_score) || null;
  const reviewCount = Number.parseInt(raw.review_count || raw.reviews_count || raw.reviews || raw.user_ratings_total, 10) || null;
  const description = raw.description || raw.about || raw.services_description || '';

  const initialStatus = raw.status || 'PENDING';
  const initialReason = `Imported contact; business/email ownership needs review. Demo not generated.${phone ? ` Phone: ${phone}` : ''}`;

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
  const notes = Array.isArray(raw.notes) ? raw.notes : [
    {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: `Imported Lead (No Website). Services: ${services.slice(0, 3).join(', ')}. Demo not generated.`,
      createdAt: new Date().toISOString(),
      author: 'CRM Importer',
    }
  ];

  return {
    id: raw.id ? (String(raw.id).startsWith('lead-') ? raw.id : `lead-${raw.id}`) : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    business_name: businessName,
    business_slug: businessSlug,
    owner_name: ownerName,
    email: cleanEmail || null,
    phone: phone ? String(phone).trim() : null,
    address,
    website_url: hasWebsite ? rawWebsite : null,
    has_website: hasWebsite,
    category,
    city,
    services,
    description,
    rating,
    review_count: reviewCount,
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
  const access = requestAccess(req, false); if (access.error) return access.error;
  const fallbackList = loadFallbackLeads();

  const enrichWithCrmFields = (lead) => {
    if (!lead) return lead;
    lead = restoreImportedLead(lead);
    const draft = currentDemoDraft(lead);
    const contactSafety = leadContactSafety(lead);
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
      demo: publicDemoDraft(draft),
      audit_reports: (lead.audit_reports || []).map(publicDemoDraft),
      contact_safety: contactSafety,
      email: contactSafety.emailBlocked ? null : lead.email,
      phone: contactSafety.blocked ? null : phone,
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
      configured: false,
      error: 'Lead storage is not configured. Please check the database connection.',
    }, { status: 503 });
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
      console.warn('Lead list database error:', error.code);
      return NextResponse.json({
        error: 'Could not load saved leads from the database. Please refresh or check the database connection.',
      }, { status: 503 });
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
    console.warn('Lead list connection exception:', err.message);
    return NextResponse.json({
      error: 'Could not load saved leads from the database. Please refresh or check the database connection.',
    }, { status: 503 });
  }
}

/**
 * POST /api/leads - Ingest leads (JSON Single / Array / CSV)
 */
export async function POST(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
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

    const urlObj = new URL(req.url);
    const filterNoWebsite = urlObj.searchParams.get('filter_no_website') !== 'false';

    let skippedWithWebsite = 0;
    const validLeads = [];

    for (const raw of rawItems) {
      const parsed = normalizeLeadInput(raw, filterNoWebsite);
      if (parsed.__skipped && parsed.reason === 'HAS_WEBSITE') {
        skippedWithWebsite++;
        continue;
      }
      if (syntheticLeadReason(parsed)) continue;
      if (parsed.business_name && parsed.business_name !== 'Unnamed Business') {
        validLeads.push(parsed);
      }
    }

    if (validLeads.length === 0) {
      return NextResponse.json(
        { 
          error: skippedWithWebsite > 0 
            ? `All ${skippedWithWebsite} businesses in the file already possess active websites. Strict Filter preserved pipeline integrity.`
            : 'No valid lead records provided in payload.',
          skippedWithWebsite,
        },
        { status: 422 }
      );
    }

    const insertedData = await persistLeadImports(isSupabaseConfigured ? getSupabaseAdmin() : null, validLeads);

    return NextResponse.json({
      success: true,
      ingestedCount: insertedData.length,
      skippedWithWebsite,
      leads: insertedData.map((l, idx) => ({
        ...l,
        phone: l.phone || validLeads[idx]?.phone || extractPhoneFallback(l.status_reason),
      })),
    });
  } catch (err) {
    console.error('API /api/leads error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to ingest leads' },
      { status: err.status || 500 }
    );
  }
}

/**
 * PATCH /api/leads - Twenty CRM Update Engine (Stage, Deal Value, Notes, Priority, Follow-Up)
 */
export async function PATCH(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
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
    if (body.address !== undefined) updates.address = body.address;
    if (body.category !== undefined) updates.category = body.category;
    if (body.description !== undefined) updates.description = body.description;
    if (body.services !== undefined) {
      updates.services = Array.isArray(body.services) 
        ? body.services 
        : String(body.services).split(',').map((s) => s.trim()).filter(Boolean);
    }
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
  const access = requestAccess(req, true); if (access.error) return access.error;
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
