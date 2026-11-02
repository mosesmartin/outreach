import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRequestIntent, buildRequestQueries, isFreshRequest, normalizeRequestSource, parsePublicationDate, requestWindow } from '../lib/websiteRequestRules.mjs';
import { extractSourcePost, inspectRequestSource, resolveRequestSource } from '../lib/websiteRequestSources.mjs';
import { discoverWebsiteRequests } from '../lib/websiteRequestSearch.mjs';
import { fetchGoogleRequestResults } from '../lib/dataforseo.js';
import { assessUsClient, hasUsClientEvidence, requesterLocationMetadata } from '../lib/websiteRequestCountry.mjs';

const now = new Date('2026-11-02T06:00:00Z');
const redditUrl = 'https://www.reddit.com/r/forhire/comments/abc123/';
const linkedInUrl = 'https://www.linkedin.com/posts/test_website-activity-1234567890123456789-abcd';
const source = normalizeRequestSource(redditUrl);
const freshPost = { title: '[Hiring] Need a website for my cleaning business', body: 'I need someone to build my website. My business is based in Austin, Texas, USA. Budget: $800.', publishedAt: '2026-11-02T03:00:00.000Z', dateEvidence: 'Original Reddit post created_utc', author: 'test-owner', email: null, phone: null, budget: '$800' };

test('US clients need original requester location evidence, not US search/currency/phone hints', () => {
  for (const body of [
    'I need a website. Budget USD 800. Call +1 416 555 0123.',
    'I need a website. US-based developers only please.',
    'I need a website for US customers.',
    'I need a website. I am based in Toronto, CA.',
  ]) assert.equal(assessUsClient({ title: 'Need a website', body }).accepted, false);
  assert.equal(assessUsClient(freshPost).accepted, true);
  assert.equal(assessUsClient({ body: "We're based in the United States. We need a website." }).accepted, true);
  assert.equal(assessUsClient({ body: 'My business is in Miami, FL. I need a website.' }).accepted, true);
  assert.equal(assessUsClient({ body: 'My business is based in Georgia. I need a website.' }).accepted, false);
  assert.equal(assessUsClient({ body: 'My business is based in Atlanta, Georgia. I need a website.' }).accepted, true);
});

test('Foreign client locations are not overridden by a US target audience', () => {
  for (const body of [
    'I am based in India. Need a website for US clients.',
    'Our company is based in Canada, targeting US customers.',
    "I'm based in London, UK. Looking for a US web designer.",
  ]) assert.equal(assessUsClient({ body }).reason, 'non_us_client');
});

test('Structured client country is accepted; freelancer-location restrictions are ignored', () => {
  const structured = { author: { address: { addressCountry: { name: 'United States' }, addressLocality: 'Austin', addressRegion: 'Texas' } }, applicantLocationRequirements: { addressCountry: 'Canada' } };
  const locations = requesterLocationMetadata(structured);
  assert.equal(assessUsClient({ requesterLocations: locations }).accepted, true);
  assert.equal(requesterLocationMetadata({ applicantLocationRequirements: { addressCountry: 'US' }, jobLocation: { address: { addressCountry: 'US' } } }).length, 0);
  assert.equal(assessUsClient({ ...freshPost, requesterLocations: [{ country: 'Canada', source: 'author_address', evidence: 'Canada' }] }).reason, 'non_us_client');
  assert.equal(hasUsClientEvidence({ country_code: 'US' }), false);
  assert.equal(hasUsClientEvidence({ country_code: 'US', country_evidence: 'Austin, Texas, USA', country_evidence_source: 'post_self_declaration' }), true);
});

test('Today starts at midnight in Pakistan, independently of host time zone', () => {
  assert.equal(requestWindow('today', now).start, '2026-11-01T19:00:00.000Z');
  assert.equal(requestWindow('3days', now).start, '2026-10-30T19:00:00.000Z');
  assert.equal(requestWindow('7days', now).start, '2026-10-26T19:00:00.000Z');
  assert.equal(isFreshRequest({ date_verified: true, published_at: '2026-11-01T19:00:00Z' }, 'today', now), true);
  assert.equal(isFreshRequest({ date_verified: true, published_at: '2026-11-01T18:59:59Z' }, 'today', now), false);
  assert.equal(requestWindow('today', new Date('2026-11-02T19:01:00Z')).start, '2026-11-02T19:00:00.000Z');
});

test('Unknown, future and unverified dates never qualify as fresh', () => {
  for (const record of [
    { date_verified: false, published_at: now.toISOString() },
    { date_verified: true, published_at: '2026-11-02T06:00:01Z' },
    { date_verified: true, published_at: null },
    { date_verified: true, published_at: 'invalid' },
  ]) assert.equal(isFreshRequest(record, 'today', now), false);
  assert.throws(() => requestWindow('30days', now));
});

test('Publication evidence requires an absolute timestamp with a time zone', () => {
  for (const value of ['3 hours ago', '2026-11-02', '2026-11-02T12:00', '2026-02-30T12:00:00Z', '2026-11-02T24:00:00Z', '', undefined]) assert.equal(parsePublicationDate(value), null);
  assert.equal(parsePublicationDate('2026-11-02T08:00:00+05:00'), '2026-11-02T03:00:00.000Z');
});

test('Source normalization rejects arbitrary hosts, credentials and unsafe redirects', () => {
  for (const url of ['http://reddit.com/r/forhire/comments/abc123/', 'https://127.0.0.1/', 'https://reddit.com.evil.test/r/x/comments/abc123/', 'https://user:pass@www.reddit.com/r/x/comments/abc123/', 'https://www.linkedin.com/in/person/', 'https://www.reddit.com/r/forhire/']) assert.equal(normalizeRequestSource(url), null);
  const a = normalizeRequestSource('https://old.reddit.com/r/forhire/comments/abc123/title/comment789?utm_source=test');
  const b = normalizeRequestSource(`${redditUrl.replace(/\/$/, '')}.json?raw_json=1`);
  assert.equal(a.sourceKey, source.sourceKey);
  assert.equal(a.url, redditUrl);
  assert.equal(b.sourceKey, source.sourceKey);
});

test('Google result wrappers resolve only to supported public post addresses', async () => {
  const wrapped = `https://www.google.com/url?q=${encodeURIComponent(redditUrl)}`;
  assert.equal((await resolveRequestSource(wrapped)).sourceKey, source.sourceKey);
  let calls = 0;
  const resolved = await resolveRequestSource('https://www.google.com/goto?opaque=token', { fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { Location: redditUrl } }); } });
  assert.equal(resolved.sourceKey, source.sourceKey);
  assert.equal(calls, 1);
  const unsafe = await resolveRequestSource('https://www.google.com/goto?opaque=token', { fetchImpl: async () => new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/private' } }) });
  assert.equal(unsafe, null);
  assert.equal(await resolveRequestSource('https://www.google.com.evil.test/goto?opaque=token'), null);
});

test('Request intent excludes sellers, employment ads and closed requests', () => {
  assert.equal(assessRequestIntent(freshPost.title, freshPost.body).accepted, true);
  assert.equal(assessRequestIntent('Looking for a web designer', 'I need a landing page for my shop.').accepted, true);
  assert.equal(assessRequestIntent('[For Hire] Website designer', 'I build websites for small businesses.').reason, 'seller');
  assert.equal(assessRequestIntent('Looking for a web designer', 'EDIT: Role closed, thanks.').reason, 'closed');
  assert.equal(assessRequestIntent('Looking for a web designer', 'EDIT: Roles closed, thanks.').reason, 'closed');
  assert.equal(assessRequestIntent('Need a website?', 'I can build websites for your business.').reason, 'seller');
  assert.equal(assessRequestIntent('Web designer looking for work', 'Need a website?').reason, 'seller');
  assert.equal(assessRequestIntent('Hiring web developer', 'Full-time employee benefits and annual salary.').reason, 'employment');
  assert.equal(assessRequestIntent('Website design inspiration', 'Here is a list of examples.').accepted, false);
});

test('Source date uses the original post, never dateModified or comment dates', () => {
  const html = `<html><head><script type="application/ld+json">${JSON.stringify({ '@type': 'SocialMediaPosting', headline: freshPost.title, articleBody: freshPost.body, datePublished: '2026-08-01T10:00:00Z', dateModified: now.toISOString(), author: { name: 'Owner' } })}</script></head><body><article>${freshPost.body}<div class="comments">commenter@example.com posted today</div></article></body></html>`;
  const post = extractSourcePost(html, linkedInUrl);
  assert.equal(post.publishedAt, '2026-08-01T10:00:00.000Z');
  assert.equal(post.email, null);
  assert.equal(post.author, 'Owner');
  assert.equal(isFreshRequest({ date_verified: true, published_at: post.publishedAt }, 'today', now), false);
});

test('Modified-only metadata and unrelated comment timestamps do not prove freshness', () => {
  const html = `<html><head><title>Need a website</title><meta property="article:modified_time" content="${now.toISOString()}"><script type="application/ld+json">${JSON.stringify({ '@type': 'Comment', datePublished: now.toISOString() })}</script></head><body><article>I need a website.</article></body></html>`;
  assert.equal(extractSourcePost(html, linkedInUrl).publishedAt, null);
});

test('Reddit verification reads only the submission, excluding comments and their contacts', async () => {
  const inspect = await inspectRequestSource(redditUrl, {
    fetchImpl: async () => new Response(JSON.stringify([
      { data: { children: [{ data: { title: freshPost.title, selftext: freshPost.body, author: 'owner', created_utc: Date.parse(freshPost.publishedAt) / 1000 } }] } },
      { data: { children: [{ data: { body: 'Contact spam@example.com', created_utc: now.getTime() / 1000 } }] } },
    ]), { headers: { 'Content-Type': 'application/json' } }),
  });
  assert.equal(inspect.accepted, true);
  assert.equal(inspect.post.publishedAt, freshPost.publishedAt);
  assert.equal(inspect.post.email, null);
});

test('Redirect to a private/unsupported host is never followed', async () => {
  let calls = 0;
  const result = await inspectRequestSource(linkedInUrl, { fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/secrets' } }); } });
  assert.equal(calls, 1);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'unavailable');
});

test('Redirect to a different public post cannot supply a newer date for an old source', async () => {
  let calls = 0;
  const result = await inspectRequestSource(linkedInUrl, { fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { Location: redditUrl } }); } });
  assert.equal(calls, 1);
  assert.equal(result.accepted, false);
});

test('Conflicting publication metadata conservatively keeps the earlier original date', () => {
  const html = `<head><meta property="article:published_time" content="2026-08-01T10:00:00Z"><script type="application/ld+json">${JSON.stringify({ '@type': 'SocialMediaPosting', headline: freshPost.title, articleBody: freshPost.body, datePublished: freshPost.publishedAt })}</script></head><body></body>`;
  assert.equal(extractSourcePost(html, linkedInUrl).publishedAt, '2026-08-01T10:00:00.000Z');
});

test('Discovery deduplicates sources and checks original publication rather than Google timestamp', async () => {
  let inspections = 0;
  const result = await discoverWebsiteRequests({ window: 'today', platform: 'all' }, {
    now,
    search: async () => ({ items: [{ url: redditUrl, timestamp: now.toISOString() }, { url: `${redditUrl}title/comment` }], cost: 0 }),
    inspect: async () => { inspections++; return { accepted: true, source, post: { ...freshPost, publishedAt: '2026-08-01T12:00:00Z' } }; },
  });
  assert.equal(inspections, 1);
  assert.equal(result.requests.length, 0);
  assert.equal(result.stats.skipped.old_or_future, 1);
});

test('Verified fresh requests retain their source/contact evidence without invented data', async () => {
  const result = await discoverWebsiteRequests({ window: 'today', platform: 'reddit' }, {
    now, search: async () => ({ items: [{ url: redditUrl }], cost: 0.001 }),
    inspect: async () => ({ accepted: true, source, post: freshPost }),
  });
  assert.equal(result.requests.length, 1);
  assert.equal(result.requests[0].source_url, redditUrl);
  assert.equal(result.requests[0].public_phone, null);
  assert.equal(result.requests[0].date_verified, true);
  assert.equal(result.requests[0].country_code, 'US');
  assert.match(result.requests[0].country_evidence, /Austin/);
  assert.equal(result.providerCost, 0.002);
  assert.equal(Object.hasOwn(result.requests[0], 'status'), false, 'discovery cannot reset outreach status');
});

test('Fresh requests with non-US or unknown client locations are excluded before storage', async () => {
  for (const [body, reason] of [['I need a website. My business is based in Canada.', 'non_us_client'], ['I need a website. Budget $800.', 'unverified_country']]) {
    const result = await discoverWebsiteRequests({ window: 'today', platform: 'all' }, {
      now, search: async () => ({ items: [{ url: redditUrl }], cost: 0 }),
      inspect: async () => ({ accepted: true, source, post: { ...freshPost, body } }),
    });
    assert.equal(result.requests.length, 0);
    assert.equal(result.stats.skipped[reason], 1);
  }
});

test('Failed or undated original sources never become fresh Google leads', async () => {
  for (const reason of ['unavailable', 'unverified_date', 'closed', 'seller']) {
    const result = await discoverWebsiteRequests({ window: 'today', platform: 'all' }, {
      now, search: async () => ({ items: [{ url: redditUrl, timestamp: now.toISOString() }], cost: 0 }),
      inspect: async () => ({ accepted: false, reason }),
    });
    assert.equal(result.requests.length, 0);
    assert.equal(result.stats.skipped[reason], 1);
  }
});

test('Partial provider failure is visible and total failure is not disguised as zero results', async () => {
  let count = 0;
  const partial = await discoverWebsiteRequests({ window: 'today', platform: 'all' }, {
    now, search: async () => { if (count++ === 0) throw new Error('Provider timeout'); return { items: [], cost: 0 }; },
  });
  assert.deepEqual(partial.warnings, ['Provider timeout']);
  await assert.rejects(discoverWebsiteRequests({ window: 'today', platform: 'all' }, { now, search: async () => { throw new Error('Provider failed'); } }), /Provider failed/);
});

test('Google discovery uses broad recent filters; final freshness remains the exact Pakistan range', async () => {
  const captured = [];
  await discoverWebsiteRequests({ window: 'today', platform: 'linkedin', niche: 'cleaning', location: 'London' }, { now, search: async (input) => { captured.push(input); return { items: [], cost: 0 }; } });
  assert.equal(captured.length, 2);
  assert.match(captured[0].query, /site:linkedin.com\/posts/);
  assert.match(captured[0].query, /"cleaning" "London"/);
  assert.match(captured[0].query, /USA OR "United States"/);
  assert.equal(captured[0].searchParam, '&tbs=qdr:d');
  const threeDayInputs = [];
  await discoverWebsiteRequests({ window: '3days', platform: 'all' }, { now, search: async (input) => { threeDayInputs.push(input); return { items: [], cost: 0 }; } });
  assert.equal(threeDayInputs[0].searchParam, '&tbs=qdr:w');
  assert.equal(buildRequestQueries().length, 2);
});

test('Provider payload is bounded and API-level errors are not treated as success', async () => {
  const previous = { login: process.env.DATAFORSEO_LOGIN, password: process.env.DATAFORSEO_PASSWORD };
  process.env.DATAFORSEO_LOGIN = 'test-user'; process.env.DATAFORSEO_PASSWORD = 'test-password';
  try {
    const result = await fetchGoogleRequestResults({ query: 'need a website', searchParam: '&tbs=qdr:d', fetchImpl: async (_, options) => {
      const [task] = JSON.parse(options.body);
      assert.equal(task.depth, 10); assert.equal(task.max_crawl_pages, 1);
      assert.equal(task.search_param, '&tbs=qdr:d');
      return Response.json({ status_code: 20000, cost: 0.001, tasks: [{ status_code: 20000, result: [{ items: [{ type: 'organic', url: redditUrl }, { type: 'paid', url: 'https://example.com' }] }] }] });
    } });
    assert.equal(result.items.length, 1);
    const empty = await fetchGoogleRequestResults({ query: 'test', fetchImpl: async () => Response.json({ status_code: 20000, tasks: [{ status_code: 40102 }] }) });
    assert.deepEqual(empty.items, [], 'provider no-results code is a successful empty search');
    const partial = await fetchGoogleRequestResults({ query: 'test', fetchImpl: async () => Response.json({ status_code: 20000, tasks: [{ status_code: 40106, result: [{ items: [{ type: 'organic', url: redditUrl }] }] }] }) });
    assert.equal(partial.items.length, 1); assert.equal(partial.warnings.length, 1);
    await assert.rejects(fetchGoogleRequestResults({ query: 'test', fetchImpl: async () => Response.json({ status_code: 20000, tasks: [{ status_code: 40200 }] }) }), /credit/);
  } finally {
    if (previous.login === undefined) delete process.env.DATAFORSEO_LOGIN; else process.env.DATAFORSEO_LOGIN = previous.login;
    if (previous.password === undefined) delete process.env.DATAFORSEO_PASSWORD; else process.env.DATAFORSEO_PASSWORD = previous.password;
  }
});
