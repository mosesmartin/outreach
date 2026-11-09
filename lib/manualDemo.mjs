import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { buildFunnelBEmail, sendColdEmail } from './email.js';
import { verifyEmail, extractCleanEmail } from './verifier.js';
import { generateSlug } from './slug.js';
import { syntheticLeadReason, isPlaceholderEmail } from './leadSafety.mjs';
import { demoServices } from './leadServices.mjs';

export class DemoError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export async function checkPublishedDemo(url) {
  try {
    const expected = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    if (new URL(url).origin !== expected.origin) return false;
    const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return false;
    const html = await response.text();
    return (html.match(/<meta\b[^>]*>/gi) || []).some(tag => /name=["']synergy-demo-version["']/i.test(tag) && /content=["']manual-demo-v1["']/i.test(tag));
  } catch { return false; }
}
export function leadFingerprint(lead) {
  return createHash('sha256').update(JSON.stringify([lead.id, lead.business_name, lead.category, lead.city, lead.email || null, lead.phone || null, lead.services || [], lead.business_slug || null])).digest('hex');
}
export function currentDemoDraft(lead, reports = lead.audit_reports || []) {
  if (syntheticLeadReason(lead)) return null;
  return [...reports].filter((report) => {
    try {
      const url = new URL(report.prototype_url);
      return url.searchParams.get('draft') === report.id && url.searchParams.get('v') === leadFingerprint(lead) && report.email_subject && report.email_body;
    } catch { return false; }
  }).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0] || null;
}
function defaultStore() {
  if (!isSupabaseConfigured) throw new DemoError('Configure Supabase before generating a persistent demo.', 503);
  const db = getSupabaseAdmin();
  const check = (error) => { if (error) throw new DemoError('Could not save or load this demo. Check database access.', 503); };
  return {
    async getLead(id) { const { data, error } = await db.from('leads').select('*,audit_reports(*)').eq('id', id).maybeSingle(); check(error); return data; },
    async saveDraft(record) { const { data, error } = await db.from('audit_reports').insert(record).select().single(); check(error); return data; },
    async claimDraft(id) { const { data, error } = await db.from('audit_reports').update({ sent_at: new Date().toISOString() }).eq('id', id).is('sent_at', null).select('id'); check(error); return Boolean(data?.length); },
    async releaseDraft(id) { const { error } = await db.from('audit_reports').update({ sent_at: null }).eq('id', id); check(error); },
    async markSent(id) { const { error } = await db.from('leads').update({ status: 'SENT', status_reason: 'Reviewed demo invitation accepted by SMTP.' }).eq('id', id); check(error); },
  };
}
export async function generateLeadDemo(leadId, { store, appBaseUrl = process.env.NEXT_PUBLIC_APP_URL } = {}) {
  store ||= defaultStore();
  const lead = await store.getLead(leadId);
  if (!lead) throw new DemoError('Lead not found.', 404);
  const blocked = syntheticLeadReason(lead); if (blocked) throw new DemoError(blocked, 422);
  const id = randomUUID();
  const base = new URL(appBaseUrl || 'http://localhost:3000');
  if (!['https:', 'http:'].includes(base.protocol)) throw new DemoError('Configure a valid app URL.', 503);
  const url = new URL(`/demo/${lead.business_slug || generateSlug(lead.business_name)}`, base);
  url.searchParams.set('draft', id); url.searchParams.set('v', leadFingerprint(lead));
  const { services, suggested } = demoServices(lead);
  const content = buildFunnelBEmail({ ownerName: lead.owner_name, businessName: lead.business_name, category: lead.category, city: lead.city, demoUrl: url.href });
  const draft = await store.saveDraft({ id, lead_id: lead.id, prototype_url: url.href, email_subject: content.subject, email_body: content.body, sent_at: null,
    gemini_hook: suggested ? 'Concept preview: suggested services need review against the real business.' : 'Concept preview: review business services and recipient before sending.' });
  return { success: true, generated: true, emailSent: false, leadId: lead.id, businessName: lead.business_name, draft, services, suggestedServices: suggested };
}
export async function sendReviewedDemo({ leadId, draftId, reviewed, subject, body }, { store, verify = verifyEmail, send = sendColdEmail, checkPreview = checkPublishedDemo } = {}) {
  if (reviewed !== true) throw new DemoError('Review the demo and verify the recipient before sending.', 409);
  store ||= defaultStore();
  const lead = await store.getLead(leadId);
  if (!lead) throw new DemoError('Lead not found.', 404);
  const blocked = syntheticLeadReason(lead); if (blocked) throw new DemoError(blocked, 422);
  const draft = currentDemoDraft(lead);
  if (!draft || draft.id !== draftId) throw new DemoError('Generate and review a current demo first. Lead changes invalidate older drafts.', 409);
  if (draft.sent_at || lead.status === 'SENT') throw new DemoError('This invitation has already been sent. It will not be sent twice.', 409);
  if (subject !== draft.email_subject || body !== draft.email_body) throw new DemoError('Email copy changed. Reload and review the current draft.', 409);
  const email = extractCleanEmail(lead.email);
  if (!email || isPlaceholderEmail(email)) throw new DemoError('No real email contact is available. Do not guess a contact address.', 422);
  if (!await checkPreview(draft.prototype_url)) throw new DemoError('The public demo is not running the reviewed preview version. Deploy the updated app and open the preview before sending.', 409);
  const verification = await verify(email);
  if (!verification.valid) throw new DemoError(verification.reason || 'Email domain check failed.', 422);
  if (!await store.claimDraft(draft.id)) throw new DemoError('This draft is already being sent or has been sent.', 409);
  let result;
  try { result = await send({ to: email, subject: draft.email_subject, body: draft.email_body }); }
  catch { throw new DemoError('SMTP result is uncertain. Check your sent mailbox before retrying; this draft remains locked.', 502); }
  if (result.uncertain) throw new DemoError('SMTP result is uncertain. Check your sent mailbox; this draft remains locked to prevent a duplicate.', 502);
  if (!result.success || result.simulated) { await store.releaseDraft(draft.id); throw new DemoError(result.error || 'SMTP is not configured. No invitation was marked as sent.', 502); }
  await store.markSent(lead.id);
  return { success: true, emailSent: true, status: 'SENT', message: 'SMTP accepted the reviewed invitation. Inbox delivery is not independently confirmed.' };
}
