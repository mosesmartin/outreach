import { fetchGoogleRequestResults } from './dataforseo.js';
import { buildRequestQueries, isFreshRequest, requestWindow } from './websiteRequestRules.mjs';
import { inspectRequestSource, resolveRequestSource } from './websiteRequestSources.mjs';
import { assessUsClient } from './websiteRequestCountry.mjs';

export async function discoverWebsiteRequests(options, {
  search = fetchGoogleRequestResults, inspect = inspectRequestSource, resolve = resolveRequestSource, now = new Date(),
} = {}) {
  const range = requestWindow(options.window, now);
  // A rolling day/week is only a discovery superset. The exact Karachi calendar
  // range is enforced below using each original post's verified publication date.
  const searchParam = options.window === 'today' ? '&tbs=qdr:d' : '&tbs=qdr:w';
  const queries = buildRequestQueries(options);
  const results = await Promise.allSettled(queries.map((query) => search({ query, searchParam })));
  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  if (!fulfilled.length) throw results[0].reason instanceof Error ? results[0].reason : new Error('Google search failed.');
  const warnings = results.filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || 'One Google search could not complete.');
  warnings.push(...fulfilled.flatMap((result) => result.value.warnings || []));
  const unique = new Map();
  let unsupported = 0;
  const rawItems = fulfilled.flatMap((result) => result.value.items);
  const resolved = await Promise.all(rawItems.map(async (item) => {
    try { return await resolve(item.url); } catch { return null; }
  }));
  for (const source of resolved) {
    if (!source || (options.platform !== 'all' && source.platform !== options.platform)) { unsupported++; continue; }
    if (!unique.has(source.sourceKey)) unique.set(source.sourceKey, source);
  }
  const candidates = [...unique.values()].slice(0, 12);
  const skipped = { unsupported, unavailable: 0, unverified_date: 0, old_or_future: 0, not_a_request: 0, closed: 0, seller: 0, employment: 0, non_us_client: 0, unverified_country: 0 };
  const requests = [];
  // Three bounded batches keep a search within a serverless request's time budget.
  for (let offset = 0; offset < candidates.length; offset += 4) {
    const inspections = await Promise.all(candidates.slice(offset, offset + 4).map(async (source) => {
      try { return await inspect(source.url); } catch { return { accepted: false, reason: 'unavailable' }; }
    }));
    for (const inspection of inspections) {
      if (!inspection.accepted) {
        const reason = Object.hasOwn(skipped, inspection.reason) ? inspection.reason : 'not_a_request';
        skipped[reason]++;
        continue;
      }
      const { source, post } = inspection;
      const country = assessUsClient(post);
      if (!country.accepted) { skipped[country.reason]++; continue; }
      const record = {
        source_key: source.sourceKey, source_url: source.url, platform: source.platform,
        title: post.title, requirement: post.body, author_name: post.author || null,
        published_at: post.publishedAt, date_verified: true, date_evidence: post.dateEvidence,
        public_email: post.email || null, public_phone: post.phone || null, budget: post.budget || null,
        niche: options.niche || null, location: options.location || null,
        country_code: 'US', country_evidence: country.evidence, country_evidence_source: country.source,
        source_state: 'request_detected', last_checked_at: now.toISOString(),
      };
      if (!isFreshRequest(record, options.window, now)) { skipped.old_or_future++; continue; }
      requests.push(record);
    }
  }
  return {
    requests, stats: { searched: fulfilled.reduce((sum, item) => sum + item.value.items.length, 0), checked: candidates.length, matched: requests.length, skipped },
    providerCost: fulfilled.reduce((sum, result) => sum + result.value.cost, 0), warnings: [...new Set(warnings)], range,
  };
}
