import * as cheerio from 'cheerio';
import { assessRequestIntent, normalizeRequestSource, parsePublicationDate } from './websiteRequestRules.mjs';
import { requesterLocationMetadata } from './websiteRequestCountry.mjs';

const MAX_SOURCE_BYTES = 1_500_000;

export async function resolveRequestSource(rawUrl, { fetchImpl = fetch } = {}) {
  const direct = normalizeRequestSource(rawUrl);
  if (direct) return direct;
  try {
    const wrapper = new URL(rawUrl);
    if (wrapper.protocol !== 'https:' || wrapper.username || wrapper.password || wrapper.port
      || !['google.com', 'www.google.com'].includes(wrapper.hostname)
      || !/^\/(?:url|goto)\/?$/.test(wrapper.pathname)) return null;
    for (const field of ['url', 'q']) {
      const destination = wrapper.searchParams.get(field);
      const source = destination && normalizeRequestSource(destination);
      if (source) return source;
    }
    // Google sometimes wraps destinations in opaque goto links. Only inspect its
    // redirect header; never follow a redirect until the destination is allowlisted.
    const response = await fetchImpl(wrapper.href, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(3000) });
    const location = response.headers.get('location');
    await response.body?.cancel().catch(() => {});
    return [301, 302, 303, 307, 308].includes(response.status) && location
      ? normalizeRequestSource(new URL(location, wrapper).href) : null;
  } catch { return null; }
}

async function fetchSource(url, fetchImpl) {
  let current = url;
  const identity = normalizeRequestSource(url)?.sourceKey;
  const signal = AbortSignal.timeout(6500);
  for (let hop = 0; hop < 3; hop++) {
    // Only individual posts on supported public platforms. Never fetch arbitrary addresses.
    if (!identity || normalizeRequestSource(current)?.sourceKey !== identity) throw new Error('Source address does not identify the same post.');
    const response = await fetchImpl(current, {
      redirect: 'manual', cache: 'no-store', signal,
      headers: { 'User-Agent': 'SynergyTechRequestChecker/1.0', Accept: 'text/html,application/json' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      current = new URL(response.headers.get('location'), current).href;
      continue;
    }
    if (!response.ok) throw new Error('Source is not publicly accessible.');
    const type = response.headers.get('content-type') || '';
    if (!/text\/html|application\/json/.test(type)) throw new Error('Unsupported source content.');
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_SOURCE_BYTES) throw new Error('Source page is too large.');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return { text: Buffer.concat(chunks).toString('utf8'), json: type.includes('application/json') };
  }
  throw new Error('Source redirects could not be verified.');
}

function structuredPosts(value) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(structuredPosts);
  // Deliberately ignore comment/review objects: their dates are not the request date.
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  const isPost = types.some((type) => /^(?:SocialMediaPosting|DiscussionForumPosting|Article|BlogPosting|JobPosting)$/.test(type || ''));
  return [...(isPost ? [value] : []), ...structuredPosts(value['@graph']), ...structuredPosts(value.mainEntity)];
}

function authorName(author) {
  if (Array.isArray(author)) return authorName(author[0]);
  if (typeof author === 'string') return author.slice(0, 160);
  return author?.name?.slice(0, 160) || null;
}

export function extractSourcePost(html, sourceUrl) {
  const $ = cheerio.load(html);
  const posts = [];
  $('script[type="application/ld+json"]').each((_, node) => {
    try { posts.push(...structuredPosts(JSON.parse($(node).text()))); } catch { /* malformed metadata is not evidence */ }
  });
  const source = normalizeRequestSource(sourceUrl);
  const match = posts.find((post) => {
    const candidate = normalizeRequestSource(typeof post.url === 'string' ? post.url : post.mainEntityOfPage?.['@id']);
    return candidate?.sourceKey === source?.sourceKey;
  });
  // Ambiguous collections of articles cannot establish the current post's date.
  const singleUrl = posts.length === 1 ? posts[0].url || posts[0].mainEntityOfPage?.['@id'] : null;
  const singleMatches = !singleUrl || normalizeRequestSource(singleUrl)?.sourceKey === source?.sourceKey;
  const post = match || (posts.length === 1 && singleMatches ? posts[0] : null);
  const structuredDate = parsePublicationDate(post?.datePublished || post?.datePosted);
  const metadataDate = parsePublicationDate($('meta[property="article:published_time"]').attr('content'));
  const useMetadata = metadataDate && (!structuredDate || Date.parse(metadataDate) < Date.parse(structuredDate));
  const publishedAt = useMetadata ? metadataDate : structuredDate;
  const dateEvidence = useMetadata ? 'Original post article:published_time' : structuredDate ? 'Original post structured publication date' : null;
  const article = $('article').first();
  const root = article.length ? article : $('main').first().length ? $('main').first() : $('body');
  root.find('script, style, nav, footer, header, [class*="comment"], [id*="comment"], [class*="reply"]').remove();
  const title = String(post?.headline || post?.title || $('meta[property="og:title"]').attr('content') || $('title').text() || '').trim().slice(0, 350);
  const body = String(post?.articleBody || post?.description || root.text()).replace(/\s+/g, ' ').trim().slice(0, 7000);
  const contactText = [post?.articleBody || post?.description || '', article.length ? root.text() : ''].join(' ');
  const email = contactText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || null;
  const phone = contactText.match(/(?:call|phone|whatsapp|contact|tel)\s*[:\-]?\s*(\+?[\d][\d\s().-]{7,20}\d)/i)?.[1]?.trim() || null;
  const budget = body.match(/\bbudget\s*(?:is|of|:|around|approximately)?\s*((?:USD|GBP|EUR|AUD|CAD|PKR|\$|£|€)\s*[\d,.]+(?:\s*[-–]\s*(?:\$|£|€)?\s*[\d,.]+)?)/i)?.[1] || null;
  return { title, body, publishedAt, dateEvidence, author: authorName(post?.author), email, phone, budget, requesterLocations: requesterLocationMetadata(post) };
}

export async function inspectRequestSource(rawUrl, { fetchImpl = fetch } = {}) {
  const source = normalizeRequestSource(rawUrl);
  if (!source) return { accepted: false, reason: 'unsupported_source' };
  try {
    let post;
    if (source.platform === 'reddit') {
      const response = await fetchSource(`${source.url.replace(/\/$/, '')}.json?raw_json=1&limit=1`, fetchImpl);
      if (response.json) {
        const data = JSON.parse(response.text)?.[0]?.data?.children?.[0]?.data;
        if (!data || data.removed_by_category || data.selftext === '[removed]' || data.selftext === '[deleted]') return { accepted: false, reason: 'unavailable' };
        const title = String(data.title || '').slice(0, 350);
        const body = String(data.selftext || '').slice(0, 7000);
        post = {
          title, body, author: data.author === '[deleted]' ? null : data.author,
          publishedAt: typeof data.created_utc === 'number' ? new Date(data.created_utc * 1000).toISOString() : null,
          dateEvidence: 'Original Reddit post created_utc',
          email: body.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] || null,
          phone: body.match(/(?:call|phone|whatsapp|contact|tel)\s*[:\-]?\s*(\+?[\d][\d\s().-]{7,20}\d)/i)?.[1]?.trim() || null,
          budget: body.match(/\bbudget\s*(?:is|of|:|around)?\s*((?:USD|GBP|EUR|\$|£|€)\s*[\d,.]+)/i)?.[1] || null,
        };
      } else post = extractSourcePost(response.text, source.url);
    } else {
      const response = await fetchSource(source.url, fetchImpl);
      post = extractSourcePost(response.text, source.url);
    }
    const intent = assessRequestIntent(post.title, post.body);
    if (!intent.accepted) return { accepted: false, reason: intent.reason };
    if (!post.publishedAt) return { accepted: false, reason: 'unverified_date' };
    return { accepted: true, source, post };
  } catch { return { accepted: false, reason: 'unavailable' }; }
}
