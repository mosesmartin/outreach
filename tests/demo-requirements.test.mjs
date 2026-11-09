import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDemoRequirements, missingDemoRequirements, normalizeGeneratedDesign, encodeDemoDesign, readDemoDesign, publicDemoDraft, publicDesignPresentation, partialAssistantReply } from '../lib/demoRequirements.mjs';
import { streamDemoAI } from '../lib/demoAI.mjs';
import { generateLeadDemo, currentDemoDraft, checkPublishedDemo } from '../lib/manualDemo.mjs';
import { getDemoContent, demoBrandVariables } from '../lib/demoContent.mjs';
import { readDemoEvents } from '../lib/demoStreamClient.mjs';
import { demoEventStream } from '../lib/demoEventStream.js';
import { requirementsFor, designFor } from './fixtures/demo-design.mjs';

const lead = { id: '11111111-1111-4111-8111-111111111111', business_name: 'Example Studio', business_slug: 'example-studio', category: 'Hair Salon', city: 'Austin, TX', services: ['Haircuts'], email: 'owner@example.test', status: 'PENDING' };
const brief = requirementsFor(lead);
const design = designFor(brief);

test('Requirements remain incomplete until the actual business, audience and design choices are supplied', () => {
  assert.ok(missingDemoRequirements({}).includes('Website goal'));
  assert.deepEqual(missingDemoRequirements(brief), []);
  const normalized = normalizeDemoRequirements({ ...brief, accent: 'red; background:url(secret)', sections: ['faq', 'script', 'enquiry', 'faq'], features: ['planner', 'execute-code'] });
  assert.equal(normalized.accent, '#425bea');
  assert.deepEqual(normalized.sections, ['faq', 'enquiry']);
  assert.deepEqual(normalized.features, ['planner']);
  assert.throws(() => normalizeGeneratedDesign({ ...design, services: [{ title: 'Invented service', description: 'Not approved' }] }, brief), /outside your brief/);
});

test('Draft metadata survives storage and public presentation excludes private requirements notes', () => {
  const requirements = { ...brief, notes: 'Internal budget discussion. Do not publish.' };
  const report = { id: 'saved-id', gemini_hook: encodeDemoDesign(requirements, design) };
  const decoded = readDemoDesign(JSON.parse(JSON.stringify(report)));
  assert.equal(decoded.requirements.notes, requirements.notes);
  assert.deepEqual(decoded.design.headline, design.headline);
  assert.equal(publicDemoDraft(report).requirements.notes, requirements.notes, 'authenticated admin can reopen the brief');
  assert.equal(JSON.stringify(publicDesignPresentation(decoded)).includes('Internal budget'), false, 'public demo never receives internal brief notes');
  const content = getDemoContent(lead, publicDesignPresentation(decoded));
  assert.deepEqual(content.headline, design.headline);
  assert.equal(content.primaryCta, design.primaryCta);
  assert.equal(content.name, lead.business_name, 'AI does not rename the business');
  assert.deepEqual(content.services.map(service => service.title), brief.services);
  assert.equal(readDemoDesign({ gemini_hook: 'An old non-AI demo' }), null);
});

test('Provider chunks update the assistant reply live; malformed provider responses never become a ready brief', async () => {
  const reply = 'Which colors would you like?';
  const json = JSON.stringify({ reply, requirements: { ...brief, theme: '' } });
  const deltas = [];
  const result = await streamDemoAI({ lead, provider: async function* () { for (let index = 0; index < json.length; index += 9) yield json.slice(index, index + 9); }, onDelta: delta => deltas.push(delta) });
  assert.equal(deltas.join(''), reply);
  assert.ok(deltas.length > 1, 'real chunks are delivered before the final JSON object');
  assert.equal(result.ready, false);
  assert.ok(result.missing.includes('Light or dark theme'));
  await assert.rejects(streamDemoAI({ lead, provider: async function* () { throw new Error('upstream URL?key=secret-value'); } }), error => error.status === 502 && !error.message.includes('secret-value'));
});

test('Partial JSON reply decoding handles escaped text without displaying raw JSON or incomplete escape codes', () => {
  assert.equal(partialAssistantReply('{"reply":"Line one\\nA \\"quoted\\"'), 'Line one\nA "quoted"');
  assert.equal(partialAssistantReply('{"reply":"Hello \\u0'), 'Hello ');
  assert.equal(partialAssistantReply('{"reply":"Hello \\u0627"}'), 'Hello ا');
});

test('Generation requires a confirmed complete brief, stores the AI design and never writes on failure', async () => {
  const rows = [];
  const store = { getLead: async () => lead, saveDraft: async row => { rows.push(row); return { ...row, created_at: new Date().toISOString() }; } };
  await assert.rejects(generateLeadDemo(lead.id, { store }), /Complete the requirements/);
  assert.equal(rows.length, 0);
  await assert.rejects(generateLeadDemo(lead.id, { store, requirements: brief, designGenerator: async () => { throw new Error('AI offline'); } }), /AI offline/);
  assert.equal(rows.length, 0);
  const stages = [];
  const generated = await generateLeadDemo(lead.id, { store, requirements: brief, appBaseUrl: 'https://preview.example.test', designGenerator: async () => ({ design }), onStage: stage => stages.push(stage) });
  assert.deepEqual(stages, ['designing', 'saving']);
  assert.equal(generated.emailSent, false);
  assert.equal(rows.length, 1);
  assert.equal(readDemoDesign(rows[0]).requirements.theme, 'light');
  assert.equal(currentDemoDraft(lead, rows).id, generated.draft.id);
  assert.equal(new URL(generated.draft.prototype_url).searchParams.get('design'), 'requirements-v1');
  const stopped = new AbortController(); stopped.abort();
  await assert.rejects(generateLeadDemo(lead.id, { store, requirements: brief, signal: stopped.signal }), /stopped/);
  assert.equal(rows.length, 1);
});

test('SSE client handles split UTF-8 chunks and never treats a failed or incomplete stream as success', async () => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode('event: delta\ndata: {"delta":"سلام"}\n\nevent: complete\ndata: {"ready":true}\n\n');
  const response = new Response(new ReadableStream({ start(controller) { for (let index = 0; index < bytes.length; index += 3) controller.enqueue(bytes.slice(index, index + 3)); controller.close(); } }), { headers: { 'Content-Type': 'text/event-stream' } });
  const events = [];
  assert.deepEqual(await readDemoEvents(response, (type, data) => events.push([type, data])), { ready: true });
  assert.equal(events[0][1].delta, 'سلام');
  await assert.rejects(readDemoEvents(new Response('event: failure\ndata: {"error":"Save failed"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })), /Save failed/);
  await assert.rejects(readDemoEvents(new Response('event: delta\ndata: {"delta":"Only partial"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })), /before confirmation/);
});

test('SSE server reports a failed save as failure without a complete event', async () => {
  const response = demoEventStream(new Request('http://localhost/test'), async emit => { emit('stage', { stage: 'saving' }); throw new Error('Database unavailable'); });
  const events = await response.text();
  assert.match(events, /event: failure/);
  assert.doesNotMatch(events, /event: complete/);
});

test('New AI drafts require a deployed renderer that supports requirements-based designs', async () => {
  const previousFetch = globalThis.fetch, previousUrl = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = 'https://preview.example.test';
  try {
    globalThis.fetch = async () => new Response('<meta name="synergy-demo-version" content="manual-demo-v1">');
    assert.equal(await checkPublishedDemo('https://preview.example.test/demo/lead?design=requirements-v1'), false);
    globalThis.fetch = async () => new Response('<meta name="synergy-demo-version" content="manual-demo-v1"><meta name="synergy-demo-capabilities" content="requirements-v1">');
    assert.equal(await checkPublishedDemo('https://preview.example.test/demo/lead?design=requirements-v1'), true);
  } finally { globalThis.fetch = previousFetch; if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previousUrl; }
  assert.deepEqual(demoBrandVariables('url(secret)'), {});
});
