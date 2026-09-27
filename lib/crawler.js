import * as cheerio from 'cheerio';
import { generateEmailPermutations, isGenericEmail } from './verifier.js';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.pdf', '.css', '.js'];
const IGNORED_EMAILS = [
  'support@sentry.io',
  'example@example.com',
  'name@domain.com',
  'user@domain.com',
  'wixpress@',
  'domain@',
];

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
 */
export function cleanPersonName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Team';
  let cleaned = rawName
    .replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '')
    .replace(/,\s*(ceo|founder|owner|md|president|principal|partner|lead).*$/i, '')
    .replace(/-\s*(ceo|founder|owner|md|president|principal|partner|lead).*$/i, '')
    .replace(/\s+(ceo|founder|owner|president)$/i, '')
    .trim();

  // If too long or contains symbols, fallback
  if (cleaned.length < 2 || cleaned.length > 40 || cleaned.includes('http') || cleaned.includes('@')) {
    return 'Team';
  }

  return cleaned;
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
 * Extracts emails and owner names from website HTML + Generates smart permutations
 */
export async function crawlWebsiteForContacts(websiteUrl, businessName = '') {
  const base = normalizeUrl(websiteUrl);
  if (!base) {
    return { emails: [], ownerName: 'Team', primaryEmail: null };
  }

  const domain = base.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();

  const pagesToScan = [
    base,
    `${base.replace(/\/$/, '')}/about`,
    `${base.replace(/\/$/, '')}/about-us`,
    `${base.replace(/\/$/, '')}/contact`,
    `${base.replace(/\/$/, '')}/contact-us`,
    `${base.replace(/\/$/, '')}/team`,
    `${base.replace(/\/$/, '')}/our-team`,
    `${base.replace(/\/$/, '')}/leadership`,
  ];

  const foundEmails = new Set();
  let identifiedOwner = null;

  for (const pageUrl of pagesToScan) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const $ = cheerio.load(html);

    // 1. Extract raw emails from text and mailto: links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
      if (email && !IGNORED_EMAILS.some((ignored) => email.includes(ignored))) {
        foundEmails.add(email);
      }
    });

    const pageText = $('body').text();
    const matches = pageText.match(EMAIL_REGEX) || [];
    for (const match of matches) {
      const lower = match.toLowerCase();
      const hasBadExt = IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext));
      const isIgnored = IGNORED_EMAILS.some((ignored) => lower.includes(ignored));
      if (!hasBadExt && !isIgnored && lower.length < 50) {
        foundEmails.add(lower);
      }
    }

    // 2. Look for Schema.org JSON-LD Person / Founder
    if (!identifiedOwner) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '{}');
          if (json.founder && typeof json.founder === 'object' && json.founder.name) {
            identifiedOwner = json.founder.name;
          } else if (json.author && typeof json.author === 'object' && json.author.name) {
            identifiedOwner = json.author.name;
          } else if (json.employee && Array.isArray(json.employee) && json.employee[0]?.name) {
            identifiedOwner = json.employee[0].name;
          }
        } catch (e) {
          // ignore malformed JSON
        }
      });
    }

    // 3. Scan team / bio headings for Owner / Founder / CEO
    if (!identifiedOwner) {
      $('h1, h2, h3, h4, strong, .team-member, .person-name').each((_, el) => {
        const text = $(el).text().trim();
        const parentText = $(el).parent().text();
        const keywords = ['owner', 'founder', 'ceo', 'president', 'managing partner', 'director', 'principal'];

        if (keywords.some((kw) => parentText.toLowerCase().includes(kw)) && text.length > 3 && text.length < 35) {
          // Exclude business name or page navigation titles
          if (
            !text.toLowerCase().includes('about') &&
            !text.toLowerCase().includes('contact') &&
            !text.toLowerCase().includes('team') &&
            !text.toLowerCase().includes('services')
          ) {
            identifiedOwner = text;
            return false; // Break loop
          }
        }
      });
    }

    // If we found a personal email and owner, we have high confidence
    if (foundEmails.size > 0 && identifiedOwner) {
      break;
    }
  }

  const cleanOwner = identifiedOwner ? cleanPersonName(identifiedOwner) : 'Team';

  // 4. If owner found, add generated permutations to candidate list
  if (cleanOwner !== 'Team' && domain) {
    const names = cleanOwner.split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    const permutations = generateEmailPermutations(firstName, lastName, domain);
    
    // Add primary permutations if no personal email was found on page
    permutations.forEach((p) => foundEmails.add(p));
  }

  // Sort emails: prioritize personal/named emails over generic info@
  const emailList = Array.from(foundEmails);
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
