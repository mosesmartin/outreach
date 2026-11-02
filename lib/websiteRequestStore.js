import { getSupabaseAdmin } from './supabase';
import { requestWindow } from './websiteRequestRules.mjs';
import { hasUsClientEvidence } from './websiteRequestCountry.mjs';

export class RequestStoreError extends Error {
  constructor(message, status = 503, code = 'REQUEST_STORE_ERROR') {
    super(message); this.status = status; this.code = code;
  }
}

function client() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new RequestStoreError('Configure the Supabase service role key to save website requests.', 503, 'SETUP_REQUIRED');
  return getSupabaseAdmin();
}

function check(error) {
  if (!error) return;
  if (['42P01', '42703', 'PGRST204', 'PGRST205', 'PGRST202'].includes(error.code)) {
    throw new RequestStoreError('Website Requests needs its database setup. Run supabase/website_requests.sql in your Supabase SQL Editor.', 503, 'SETUP_REQUIRED');
  }
  throw new RequestStoreError('Website request storage is unavailable. Nothing was marked as saved.');
}

export async function listWebsiteRequests({ window = 'today', platform = 'all', status = 'ALL' } = {}) {
  const db = client();
  const range = requestWindow(window);
  let query = db.from('website_requests').select('*')
    .gte('published_at', range.start).lte('published_at', range.end).eq('date_verified', true)
    .eq('country_code', 'US').not('country_evidence', 'is', null)
    .eq('source_state', 'request_detected').order('published_at', { ascending: false }).limit(200);
  if (platform !== 'all') query = query.eq('platform', platform);
  if (status !== 'ALL') query = query.eq('status', status);
  else query = query.not('status', 'in', '(CLOSED,DISMISSED)');
  const { data, error } = await query;
  check(error);
  const { data: runs, error: runError } = await db.from('website_request_search_runs')
    .select('created_at,completed_at,outcome,stats').order('created_at', { ascending: false }).limit(1);
  check(runError);
  return { requests: (data || []).filter(hasUsClientEvidence), range, lastSearch: runs?.[0] || null };
}

export async function getWebsiteRequest(id) {
  const { data, error } = await client().from('website_requests').select('*').eq('id', id).maybeSingle();
  check(error);
  return data;
}

export async function saveWebsiteRequests(records) {
  if (!records.length) return [];
  if (!records.every(hasUsClientEvidence)) throw new RequestStoreError('Only requests with source-declared US client location can be saved.', 400, 'US_CLIENT_REQUIRED');
  // Omit status/notes/id so discovery cannot reset a user's outreach progress.
  const { data, error } = await client().from('website_requests')
    .upsert(records, { onConflict: 'source_key', defaultToNull: false }).select('*');
  check(error);
  return data || [];
}

export async function updateWebsiteRequest(id, updates) {
  const { data, error } = await client().from('website_requests').update(updates).eq('id', id).select('*').maybeSingle();
  check(error);
  return data;
}

export async function claimRequestSearch(actor) {
  const db = client();
  // Check storage before starting any paid provider requests.
  const { error: schemaError } = await db.from('website_requests').select('id,country_code,country_evidence,country_evidence_source').limit(0);
  check(schemaError);
  const { data, error } = await db.rpc('claim_website_request_search', { p_actor: actor });
  check(error);
  if (!data) throw new RequestStoreError('Please wait 60 seconds between Google searches.', 429, 'SEARCH_COOLDOWN');
  return data;
}

export async function finishRequestSearch(id, outcome, stats) {
  const { error } = await client().from('website_request_search_runs')
    .update({ outcome, stats, completed_at: new Date().toISOString() }).eq('id', id);
  check(error);
}
