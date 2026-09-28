import * as cheerio from 'cheerio';
import { generateEmailPermutations, isGenericEmail, extractCleanEmail } from './verifier.js';

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.pdf', '.css', '.js'];
const IGNORED_EMAILS = [
  'support@sentry.io',
  'example@example.com',
  'name@domain.com',
  'user@domain.com',
  'wixpress@',
  'domain@',
  'test@',
];

const BANNED_NAME_WORDS = new Set([
  'roofing', 'contractor', 'contractors', 'contracting', 'construction', 'service', 'services', 'repair',
  'repairs', 'solution', 'solutions', 'guarantee', 'trust', 'covered', 'best', 'built', 'estimate', 'estimates',
  'free', 'call', 'expert', 'experts', 'team', 'leadership', 'commercial', 'residential', 'premier', 'quality',
  'miami', 'florida', 'texas', 'angie', 'yelp', 'google', 'review', 'reviews', 'rating', 'emergency',
  'shingle', 'metal', 'tile', 'install', 'warranty', 'licensed', 'insured', 'inc', 'corp', 'llc', 'ltd',
  'company', 'co', 'associates', 'group', 'brothers', 'pros', 'builders', 'enterprises', 'way', 'got', 'weve',
  'years', 'experience', 'serving', 'specialists', 'award', 'winning', 'welcome', 'home', 'about', 'contact'
]);

/**
 * Normalizes URL with protocol
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Cleans raw person/founder string into a pristine human name
 * Rejects marketing slogans, corporate taglines, and non-human strings
 */
export function cleanPersonName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Team';

  let cleaned = rawName
    .replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '')
    .replace(/,\s*(ceo|founder|owner|md|president|principal|partner|lead|director).*$/i, '')
    .replace(/-\s*(ceo|founder|owner|md|president|principal|partner|lead|director).*$/i, '')
    .replace(/\s+(ceo|founder|owner|president|director|partner)$/i, '')
    .replace(/["'“”‘’]/g, '')
    .trim();

  // If contains invalid characters for human name (digits, colons, exclamation, hashtags, urls, emails)
  if (/[\d:!?;#\/\\+&()@\[\]{}<>=*~^$]/.test(cleaned)) {
    return 'Team';
  }

  // Split into words
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) {
    return 'Team';
  }

  // Check against banned keywords / slogans
  const hasBannedWord = words.some((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    return BANNED_NAME_WORDS.has(cleanWord);
  });

  if (hasBannedWord) {
    return 'Team';
  }

  // Format in proper Title Case
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Crawls a single page and extracts text, emails, and owner clues
 */
async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    const html = await response.text();
    return html;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts emails and owner names from website HTML
 */
export async function crawlWebsiteForContacts(websiteUrl, businessName = '') {
  const base = normalizeUrl(websiteUrl);
  if (!base) {
    return { emails: [], ownerName: 'Team', primaryEmail: null };
  }

  const domain = base.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();

  const pagesToScan = [
    base,
    `${base.replace(/\/$/, '')}/contact`,
    `${base.replace(/\/$/, '')}/contact-us`,
    `${base.replace(/\/$/, '')}/about`,
    `${base.replace(/\/$/, '')}/about-us`,
    `${base.replace(/\/$/, '')}/team`,
    `${base.replace(/\/$/, '')}/our-team`,
    `${base.replace(/\/$/, '')}/leadership`,
  ];

  const foundRealEmails = new Set();
  let identifiedOwner = null;

  for (const pageUrl of pagesToScan) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const $ = cheerio.load(html);

    // 1. Extract raw emails from mailto: links (highest confidence)
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = extractCleanEmail(href);
      if (email && !IGNORED_EMAILS.some((ignored) => email.includes(ignored))) {
        foundRealEmails.add(email);
      }
    });

    // 2. Extract emails from DOM text nodes cleanly (preventing tag concatenation)
    $('p, span, div, a, li, td, footer, header, address').each((_, el) => {
      const text = $(el).text();
      if (text && text.includes('@')) {
        const tokens = text.split(/[\s,;()\/\\<>"'{}[\]|]+/);
        for (const token of tokens) {
          if (token.includes('@')) {
            const cleaned = extractCleanEmail(token);
            if (cleaned && !IGNORED_EMAILS.some((ignored) => cleaned.includes(ignored))) {
              const hasBadExt = IGNORED_EXTENSIONS.some((ext) => cleaned.endsWith(ext));
              if (!hasBadExt && cleaned.length < 50) {
                foundRealEmails.add(cleaned);
              }
            }
          }
        }
      }
    });

    // 3. Look for Schema.org JSON-LD Person / Founder / Email
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json.email) {
          const cleaned = extractCleanEmail(json.email);
          if (cleaned) foundRealEmails.add(cleaned);
        }
        if (!identifiedOwner) {
          if (json.founder && typeof json.founder === 'object' && json.founder.name) {
            identifiedOwner = json.founder.name;
          } else if (json.author && typeof json.author === 'object' && json.author.name) {
            identifiedOwner = json.author.name;
          } else if (json.employee && Array.isArray(json.employee) && json.employee[0]?.name) {
            identifiedOwner = json.employee[0].name;
          }
        }
      } catch (e) {
        // ignore malformed JSON
      }
    });

    // 4. Scan team / bio headings for verified Owner / Founder / CEO
    if (!identifiedOwner) {
      $('.team-member, .person-name, .bio-name, .leadership-name').each((_, el) => {
        const text = $(el).text().trim();
        const cleaned = cleanPersonName(text);
        if (cleaned !== 'Team') {
          identifiedOwner = cleaned;
          return false;
        }
      });
    }

    // If we already found verified emails and owner, we can stop early
    if (foundRealEmails.size > 0 && identifiedOwner) {
      break;
    }
  }

  const cleanOwner = identifiedOwner ? cleanPersonName(identifiedOwner) : 'Team';

  // Sort real emails: prioritize personal/named emails, then info@, sales@, etc.
  const emailList = Array.from(foundRealEmails);
  emailList.sort((a, b) => {
    const isGenericA = isGenericEmail(a);
    const isGenericB = isGenericEmail(b);
    if (!isGenericA && isGenericB) return -1;
    if (isGenericA && !isGenericB) return 1;
    return 0;
  });

  return {
    emails: emailList,
    primaryEmail: emailList[0] || null,
    ownerName: cleanOwner,
  };
}
