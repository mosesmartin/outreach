// Shared by the API, UI and tests. Discovery time never counts as publication time.
export const REQUEST_TIME_ZONE = 'Asia/Karachi';
export const REQUEST_STATUSES = ['NEW', 'CONTACTED', 'REPLIED', 'DEMO_SENT', 'WON', 'CLOSED', 'DISMISSED'];
export const REQUEST_WINDOWS = ['today', '3days', '7days'];
export const REQUEST_PLATFORMS = ['all', 'reddit', 'linkedin', 'facebook', 'x', 'upwork', 'freelancer'];

export function requestWindow(window = 'today', now = new Date()) {
  if (!REQUEST_WINDOWS.includes(window)) throw new Error('Choose Today, 3 days or 7 days.');
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: REQUEST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const days = window === 'today' ? 1 : window === '3days' ? 3 : 7;
  // Pakistan standard time is UTC+05:00; all filters use calendar days in Karachi.
  const start = new Date(`${day}T00:00:00+05:00`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { start: start.toISOString(), end: now.toISOString(), timeZone: REQUEST_TIME_ZONE, days };
}

export function isFreshRequest(record, window = 'today', now = new Date()) {
  const range = requestWindow(window, now);
  const published = Date.parse(record.published_at);
  return record.date_verified === true && Number.isFinite(published)
    && published >= Date.parse(range.start) && published <= Date.parse(range.end);
}

export function parsePublicationDate(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  // A day-only date cannot prove which calendar day it was in Pakistan.
  // A timezone is mandatory; modified dates and relative search labels are never used.
  const parts = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i);
  if (!parts) return null;
  const [, year, month, day, hour, minute, second = '0'] = parts;
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1
    || Number(day) > new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeRequestSource(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    const host = url.hostname.toLowerCase().replace(/^(?:www|m|old)\./, '');
    let platform;
    let key;
    if (host === 'reddit.com') {
      url.pathname = url.pathname.replace(/\.json$/, '');
      const match = url.pathname.match(/^\/r\/([a-z0-9_]+)\/comments\/([a-z0-9]+)(?:\/|$)/i);
      if (!match) return null;
      platform = 'reddit'; key = match[2].toLowerCase();
      url.hostname = 'www.reddit.com'; url.pathname = `/r/${match[1]}/comments/${key}/`;
      url.search = '';
    } else if (host === 'linkedin.com') {
      const match = url.pathname.match(/(?:activity-|urn:li:activity:)(\d{10,})/);
      if (!match || !/^\/(?:posts|feed\/update)\//.test(url.pathname)) return null;
      platform = 'linkedin'; key = match[1]; url.hostname = 'www.linkedin.com'; url.search = '';
    } else if (host === 'x.com' || host === 'twitter.com') {
      const match = url.pathname.match(/^\/([a-z0-9_]+)\/status\/(\d+)/i);
      if (!match) return null;
      platform = 'x'; key = match[2]; url.hostname = 'x.com'; url.pathname = `/${match[1]}/status/${key}`; url.search = '';
    } else if (host === 'facebook.com') {
      const match = url.pathname.match(/\/(?:posts|permalink)\/([a-z0-9]+)/i);
      if (!match) return null;
      platform = 'facebook'; key = match[1]; url.hostname = 'www.facebook.com'; url.search = '';
    } else if (host === 'upwork.com' && /^\/jobs\//.test(url.pathname)) {
      platform = 'upwork'; key = url.pathname.replace(/\/$/, ''); url.hostname = 'www.upwork.com'; url.search = '';
    } else if (host === 'freelancer.com' && /^\/projects\//.test(url.pathname)) {
      platform = 'freelancer'; key = url.pathname.replace(/\/$/, ''); url.hostname = 'www.freelancer.com'; url.search = '';
    } else return null;
    url.hash = '';
    return { url: url.href, platform, sourceKey: `${platform}:${key}` };
  } catch { return null; }
}

export function assessRequestIntent(title = '', body = '') {
  const text = `${title}\n${body}`.replace(/\s+/g, ' ').trim();
  const closed = /\b(?:positions?|roles?|projects?)\s+(?:(?:is|are)\s+)?(?:closed|filled)|\b(?:no longer (?:hiring|looking|needed)|found (?:someone|a developer|a designer)|hired someone|hiring closed|project awarded)\b/i;
  if (closed.test(text)) return { accepted: false, reason: 'closed' };
  const seller = /\[\s*for\s*hire\s*\]|\b(?:i|we)\s+(?:(?:can|will)\s+)?(?:build|design|create|offer)\s+(?:\w+\s+){0,3}(?:websites?|web design)|\b(?:looking for (?:clients|work|projects)|seeking (?:work|clients|projects)|available for hire|my web design services|how to (?:find|get) (?:web design )?clients)\b/i;
  if (seller.test(title) || seller.test(body.slice(0, 550))) return { accepted: false, reason: 'seller' };
  if (/\b(?:full[- ]time|annual salary|per annum|employee benefits|job description)\b/i.test(text)) return { accepted: false, reason: 'employment' };
  const website = /\b(?:website|web\s*(?:site|designer|developer|design|development)|landing page|wordpress|shopify)\b/i;
  const buying = /\b(?:looking for|seeking|need|want|recommend|recommendations for|hiring|hire|in search of)\b|banwani|chahiye|chahye/i;
  return website.test(text) && buying.test(text)
    ? { accepted: true, reason: 'buyer_request' }
    : { accepted: false, reason: 'not_a_request' };
}

export function buildRequestQueries({ niche = '', location = '', platform = 'all' } = {}) {
  const quote = (value) => value ? `"${value.replace(/["\\\r\n]/g, ' ').trim()}"` : '';
  const sites = { reddit: 'reddit.com', linkedin: 'linkedin.com/posts', facebook: 'facebook.com', x: 'x.com', upwork: 'upwork.com/jobs', freelancer: 'freelancer.com/projects' };
  const scope = platform === 'all' ? '' : `site:${sites[platform]}`;
  const context = [quote(niche), quote(location), '(USA OR "United States" OR "US-based")', scope].filter(Boolean).join(' ');
  return [
    `"looking for a web designer" ${context}`,
    `"need a website" ${context}`,
  ].map((query) => query.trim());
}

export function displayRequestDate(value) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: REQUEST_TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
