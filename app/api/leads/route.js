import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { generateSlug } from '@/lib/slug';
import { extractCleanEmail } from '@/lib/verifier';
import { cleanPersonName } from '@/lib/crawler';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BACKUP_FILE = path.join(process.cwd(), 'data', 'fallback_leads.json');


function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadFallbackLeads() {
  ensureDataDir();
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const content = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(content || '[]');
    } catch (e) {
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

/**
 * Normalizes input lead data from CSV, Apify, or Direct JSON
 */
function normalizeLeadInput(raw) {
  const businessName = raw.business_name || raw.businessName || raw.title || raw.name || 'Unnamed Business';
  const rawOwner = raw.owner_name || raw.ownerName || raw.owner || raw.contact_name || 'Team';
  const ownerName = cleanPersonName(rawOwner);
  const rawEmail = raw.email || raw.contact_email || raw.mail || '';
  const cleanEmail = extractCleanEmail(rawEmail);
  const websiteUrl = raw.website_url || raw.website || raw.url || raw.site || null;
  const hasWebsite = raw.has_website !== undefined 
    ? Boolean(raw.has_website && raw.has_website !== 'false' && raw.has_website !== '0' && raw.has_website !== false)
    : (raw.hasWebsite !== undefined ? Boolean(raw.hasWebsite) : Boolean(websiteUrl && websiteUrl.trim().length > 3));
  
  const category = raw.category || raw.industry || raw.type || 'Local Business';
  const city = raw.city || raw.location || raw.address_city || raw.fullAddress || 'Metro Area';
  const businessSlug = generateSlug(businessName);
  const phone = raw.phone || raw.telephone || raw.sanitizedPhone || null;

  const hasValidEmail = Boolean(cleanEmail);
  const email = cleanEmail || null;

  let services = [];
  if (Array.isArray(raw.services)) {
    services = raw.services;
  } else if (typeof raw.services === 'string' && raw.services.trim()) {
    services = raw.services.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const initialStatus = raw.status || (hasValidEmail ? 'PENDING' : 'SKIPPED');
  const initialReason = raw.status_reason || (
    !hasValidEmail 
      ? `Prototype live at /demo/${businessSlug} • Direct Phone: ${phone || 'N/A'}`
      : (hasWebsite ? 'Queued for Funnel A Audit' : 'Queued for Funnel B Prototype')
  );

  return {
    id: raw.id ? (String(raw.id).startsWith('lead-') ? raw.id : `lead-${raw.id}`) : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    business_name: businessName,
    business_slug: businessSlug,
    owner_name: ownerName,
    email: email,
    website_url: hasWebsite && websiteUrl ? websiteUrl.trim() : null,
    has_website: hasWebsite,
    category,
    city,
    services: services.length > 0 ? services : ['Rapid Response', 'Estimates', 'Certified Work'],
    rating: parseFloat(raw.rating || raw.stars || '4.9') || 4.9,
    review_count: parseInt(raw.review_count || raw.reviewsCount || raw.reviews || '45', 10) || 45,
    status: initialStatus,
    status_reason: initialReason,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

/**
 * GET /api/leads - Fetch leads list
 */
export async function GET(req) {
  const fallbackList = loadFallbackLeads();

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      configured: true,
      message: 'Running in resilient storage mode',
      leads: fallbackList,
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = supabase
      .from('leads')
      .select('*, audit_reports(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase query error, serving fallback store:', error.message);
      return NextResponse.json({
        configured: true,
        leads: fallbackList,
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
      leads: merged,
    });
  } catch (err) {
    console.warn('Supabase connection exception, returning fallback list:', err.message);
    return NextResponse.json({
      configured: true,
      leads: fallbackList,
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
      .filter((l) => l.business_name && l.business_name !== 'Unnamed Business' && l.status !== 'SKIPPED');

    if (validLeads.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid lead records provided in payload.',
        },
        { status: 422 }
      );
    }

    let insertedData = null;

    // Try inserting into Supabase
    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('leads')
          .insert(validLeads.map((l) => {
            const { id, ...rest } = l; // let supabase gen uuid if needed
            return rest;
          }))
          .select();

        if (!error && data) {
          insertedData = data;
        } else {
          console.warn('Supabase insert notice (saving to resilient fallback):', error?.message);
        }
      } catch (dbErr) {
        console.warn('Supabase connect timeout/error (saving to resilient fallback):', dbErr.message);
      }
    }

    // Always maintain local persistent fallback store
    const existingFallback = loadFallbackLeads();
    const existingEmails = new Set(existingFallback.map((l) => l.email));
    const toAppend = validLeads.filter((l) => !existingEmails.has(l.email));
    saveFallbackLeads([...toAppend, ...existingFallback]);

    return NextResponse.json({
      success: true,
      ingestedCount: insertedData?.length || validLeads.length,
      leads: insertedData || validLeads,
    });
  } catch (err) {
    console.error('API /api/leads error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to ingest leads' },
      { status: 500 }
    );
  }
}
