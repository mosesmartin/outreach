import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLeadDemo, sendReviewedDemo, currentDemoDraft } from '../lib/manualDemo.mjs';
import { syntheticLeadReason, leadContactSafety } from '../lib/leadSafety.mjs';
import { getServicesForNiche, demoServices } from '../lib/leadServices.mjs';
import { extractCleanEmail } from '../lib/verifier.js';
import { buildFunnelBEmail } from '../lib/email.js';
import { discoverAndEnrichLeads } from '../lib/discovery.js';

const leadTemplate = { id: '11111111-1111-4111-8111-111111111111', business_name: 'Example Hair Studio', owner_name: 'Alex', business_slug: 'example-hair-studio', category: 'Hair Salon', city: 'Austin, TX', email: 'alex2028@example.com', services: ['Haircuts'], status: 'PENDING' };
const legacy = { business_name: 'Sterling Luxury Hair Salon & Spa 2', owner_name: 'Natalie Miller', email: 'natalie.miller38@gmail.com' };
function memoryStore(lead = { ...leadTemplate }) {
  const reports = [];
  return {
    reports, lead,
    async getLead() { return { ...lead, audit_reports: reports }; },
    async saveDraft(record) { const saved = { ...record, created_at: new Date().toISOString() }; reports.push(saved); return saved; },
    async claimDraft(id) { const draft = reports.find(r => r.id === id); if (!draft || draft.sent_at) return false; draft.sent_at = new Date().toISOString(); return true; },
    async releaseDraft(id) { reports.find(r => r.id === id).sent_at = null; },
    async markSent() { lead.status = 'SENT'; },
  };
}
const verified = async () => ({ valid: true });
const generate = store => generateLeadDemo(store.lead.id, { store, appBaseUrl: 'https://preview.example.test' });
const approved = (store, draft) => ({ leadId: store.lead.id, draftId: draft.id, reviewed: true, subject: draft.email_subject, body: draft.email_body });

test('Legacy simulated contacts are blocked without rejecting ordinary numeric mailboxes', () => {
  assert.match(syntheticLeadReason(legacy), /simulated/);
  assert.ok(syntheticLeadReason({ business_name: 'Velocity Luxury Hair Salon & Spa 2', owner_name: 'Gabriel Jenkins', email: 'gabriel.jenkins39@gmail.com' }));
  assert.equal(syntheticLeadReason({ ...leadTemplate, email: 'alex12345678901234567890@gmail.com' }), null);
  assert.equal(extractCleanEmail('alex12345678901234567890@gmail.com'), 'alex12345678901234567890@gmail.com');
  assert.equal(extractCleanEmail('1234@example.co.uk'), '1234@example.co.uk');
  assert.equal(extractCleanEmail('mailto:hello@company.com.au?subject=Hello'), 'hello@company.com.au');
  assert.equal(extractCleanEmail('broken@@example.com'), null);
});
test('Hair salon cannot match HVAC through the substring air', () => {
  assert.ok(getServicesForNiche('Luxury Hair Salon & Spa').includes('Salon appointments'));
  assert.ok(getServicesForNiche('Air conditioning').includes('AC maintenance'));
  const result = demoServices({ category: 'Hair Salon', services: ['Emergency AC Repair & Recharge', 'Heat Pump & Furnace Replacement'] });
  assert.equal(result.suggested, true);
  assert.equal(result.services.some(service => /AC|Furnace/.test(service)), false);
});
test('No saved draft exists on ingestion; generation writes only a preview and sends nothing', async () => {
  const store = memoryStore();
  assert.equal(currentDemoDraft(store.lead), null);
  const result = await generate(store);
  assert.equal(result.emailSent, false);
  assert.equal(store.lead.status, 'PENDING');
  assert.equal(store.reports.length, 1);
  assert.equal(result.draft.sent_at, null);
  assert.match(result.draft.prototype_url, /\?draft=.+&v=/);
  assert.equal(currentDemoDraft({ ...store.lead, audit_reports: store.reports }).id, result.draft.id);
});
test('Synthetic records cannot generate previews or send even with an approval flag', async () => {
  const store = memoryStore({ ...leadTemplate, ...legacy });
  await assert.rejects(generate(store), /simulated/);
  await assert.rejects(sendReviewedDemo({ leadId: store.lead.id, reviewed: true }, { store }), /simulated/);
  assert.equal(store.reports.length, 0);
});
test('Old slug-only demo records are not treated as generated drafts', () => {
  assert.equal(currentDemoDraft({ ...leadTemplate, audit_reports: [{ id: 'old', prototype_url: 'https://preview.example.test/demo/example-hair-studio', email_subject: 'old', email_body: 'old' }] }), null);
});
test('Sending without explicit review, without a draft, or with changed copy is blocked before SMTP', async () => {
  const store = memoryStore(); let sends = 0;
  const dependencies = { store, checkPreview: async () => true, verify: verified, send: async () => { sends++; return { success: true }; } };
  await assert.rejects(sendReviewedDemo({ leadId: store.lead.id }, dependencies), /Review/);
  await assert.rejects(sendReviewedDemo({ leadId: store.lead.id, reviewed: true }, dependencies), /Generate/);
  const { draft } = await generate(store);
  await assert.rejects(sendReviewedDemo({ ...approved(store, draft), body: 'unreviewed copy' }, dependencies), /copy changed/);
  assert.equal(sends, 0);
});
test('Changing services invalidates the previous preview and prevents stale invitations', async () => {
  const store = memoryStore(); const { draft } = await generate(store);
  store.lead.services = ['New business service'];
  assert.equal(currentDemoDraft({ ...store.lead, audit_reports: store.reports }), null);
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, checkPreview: async () => true, verify: verified }), /current demo/);
});
test('Concurrent send clicks result in one SMTP call; already sent drafts cannot be resent', async () => {
  const store = memoryStore(); const { draft } = await generate(store); let sends = 0;
  const dependencies = { store, checkPreview: async () => true, verify: verified, send: async () => { sends++; return { success: true, simulated: false }; } };
  const results = await Promise.allSettled([sendReviewedDemo(approved(store, draft), dependencies), sendReviewedDemo(approved(store, draft), dependencies)]);
  assert.equal(sends, 1);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(store.lead.status, 'SENT');
});
test('Missing SMTP and failed MX checks do not mark a lead SENT', async () => {
  const store = memoryStore(); const { draft } = await generate(store);
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, checkPreview: async () => true, verify: async () => ({ valid: false, reason: 'No MX' }) }), /No MX/);
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, checkPreview: async () => true, verify: verified, send: async () => ({ success: false, error: 'SMTP missing' }) }), /SMTP missing/);
  assert.equal(store.lead.status, 'PENDING');
  assert.equal(draft.sent_at, null);
});
test('An unknown placeholder email does not block a real business preview but cannot receive mail', async () => {
  const lead = { ...leadTemplate, email: 'example-studio@leads.synergytechsol.com' };
  assert.equal(syntheticLeadReason(lead), null);
  assert.equal(leadContactSafety(lead).emailBlocked, true);
  const store = memoryStore(lead); const { draft } = await generate(store);
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, checkPreview: async () => true, verify: verified }), /No real email/);
});
test('An uncertain SMTP outcome remains locked instead of permitting duplicate retries', async () => {
  const store = memoryStore(); const { draft } = await generate(store);
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, checkPreview: async () => true, verify: verified, send: async () => ({ success: false, uncertain: true }) }), /uncertain/);
  assert.ok(draft.sent_at);
  assert.equal(store.lead.status, 'PENDING');
});
test('Email wording follows salon appointments without invented speed or review claims', () => {
  const { body } = buildFunnelBEmail({ ownerName: 'Alex', businessName: 'Example Studio', category: 'Hair Salon', demoUrl: 'https://preview.example.test/demo/id?draft=1&v=abc' });
  assert.match(body, /appointment options/);
  assert.doesNotMatch(body, /0\.8|5-star|Google Maps|engineering team/);
  assert.throws(() => buildFunnelBEmail({ businessName: 'Missing preview' }), /saved demo/);
});
test('Discovery with zero live results never generates substitute leads or writes fallback data', async () => {
  let writes = 0;
  const result = await discoverAndEnrichLeads({ niche: 'Hair Salon', location: 'Miami, FL', maxLeads: 50, apifyToken: null }, { configured: () => true, fetchMaps: async () => [], loadLocal: () => [], saveLocal: () => { writes++; }, database: null });
  assert.equal(result.totalSaved, 0);
  assert.equal(result.shortfall, 50);
  assert.equal(result.isSimulated, false);
  assert.equal(writes, 0);
});
test('A partial live batch leaves missing emails/services/ratings missing rather than filling a quota', async () => {
  const result = await discoverAndEnrichLeads({ niche: 'Hair Salon', location: 'Miami, FL', maxLeads: 50, apifyToken: null }, {
    configured: () => true, fetchMaps: async () => [{ title: 'Example Studio', phone: '+1 305 555 0100', categoryName: 'Hair Salon', placeId: 'fixture-place' }],
    loadLocal: () => [], saveLocal: () => {}, database: null,
  });
  assert.equal(result.totalSaved, 1);
  assert.equal(result.shortfall, 49);
  assert.equal(result.leads[0].email, '');
  assert.equal(result.leads[0].rating, null);
  assert.deepEqual(result.leads[0].services, []);
  assert.equal(result.leads[0].prototype_url, undefined);
  assert.match(result.leads[0].status_reason, /Demo not generated/);
});

test('An old or inaccessible public preview blocks SMTP even after manual review', async () => {
  const store = memoryStore(); const { draft } = await generate(store); let sends = 0;
  await assert.rejects(sendReviewedDemo(approved(store, draft), { store, verify: verified, checkPreview: async () => false, send: async () => { sends++; return { success: true }; } }), /public demo/);
  assert.equal(sends, 0);
  assert.equal(draft.sent_at, null);
});
