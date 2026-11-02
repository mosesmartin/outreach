import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Valid standard TLDs for boundary detection in concatenated strings
export const COMMON_TLDS = [
  // Multi-level first
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.za', 'com.br', 'co.jp',
  // Standard & country codes
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'io', 'co', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'eu', 'ch', 'se', 'no', 'dk', 'be', 'at', 'ie', 'nz', 'in',
  // gTLDs & industry TLDs
  'biz', 'info', 'me', 'tv', 'cc', 'tech', 'online', 'store', 'agency', 'solutions', 'services', 'systems',
  'digital', 'pro', 'cloud', 'design', 'global', 'group', 'dev', 'app', 'live', 'site', 'vip', 'club', 'space',
  'roofing', 'contractors', 'construction', 'homes', 'law', 'legal', 'dental', 'clinic', 'care', 'health'
];

// Expanded known disposable / burner domain blacklist
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'trashmail.net',
  'fakeinbox.com',
  'getairmail.com',
  'dispostable.com',
  'sharklasers.com',
  'meltmail.com',
  'mytemp.email',
  'tempail.com',
  'burnermail.io',
  'inboxkitten.com',
  'nada.ltd',
  'mohmal.com',
  'crazymailing.com',
  'fakemailgenerator.com',
]);

// Generic front-desk / role-based email prefixes
export const GENERIC_PREFIXES = [
  'info@',
  'contact@',
  'contactus@',
  'contact-us@',
  'support@',
  'admin@',
  'office@',
  'hello@',
  'sales@',
  'inquiries@',
  'inquiry@',
  'help@',
  'marketing@',
  'service@',
  'services@',
  'billing@',
  'team@',
  'reception@',
  'frontdesk@',
  'mail@',
  'general@',
  'customercare@',
  'jobs@',
  'careers@',
  'media@',
  'press@',
];

/**
 * Robustly extracts and sanitizes a valid email address from dirty or concatenated text
 * Examples:
 *   "33027954-852-2654info@tsroofingsystems.commonday" -> "info@tsroofingsystems.com"
 *   "Emailinfo@martinezroofingmiami.com" -> "info@martinezroofingmiami.com"
 *   "mailto:info@domain.com?subject=Inquiry" -> "info@domain.com"
 *   "Phone: (305) 555-1234, email: contact@domain.org" -> "contact@domain.org"
 */
export function extractCleanEmail(raw) {
  if (Array.isArray(raw)) return raw.map(extractCleanEmail).find(Boolean) || null;
  if (typeof raw !== 'string') return null;
  const text = raw.trim().replace(/^mailto:/i, '').split('?')[0];
  const pattern = /(?:^|[\s<(:;,"'])([a-z0-9.!#$%&'*+/=^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)(?=$|[\s>):;,"'])/ig;
  for (const match of text.matchAll(pattern)) {
    const email = match[1].toLowerCase();
    const [local, domain] = email.split('@');
    if (local.length <= 64 && email.length <= 254 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && domain.split('.').every(part => part.length <= 63)) return email;
  }
  return null;
}

/**
 * Checks if an email is a generic role account vs personal name
 */
export function isGenericEmail(email) {
  if (!email) return false;
  const clean = extractCleanEmail(email) || email.toLowerCase().trim();
  return GENERIC_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

/**
 * Generates corporate email permutations from a verified person's name and company domain
 * e.g., Moses Martin + synergytechsol.com -> [moses@..., mosesmartin@..., moses.martin@..., mmartin@...]
 */
export function generateEmailPermutations(firstName, lastName, domain) {
  if (!domain) return [];
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
  const f = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const l = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  if (!f && !l) return [];
  if (f.length < 2 && l.length < 2) return [];

  const permutations = new Set();

  if (f && l) {
    permutations.add(`${f}.${l}@${cleanDomain}`);
    permutations.add(`${f}${l}@${cleanDomain}`);
    permutations.add(`${f[0]}${l}@${cleanDomain}`);
    permutations.add(`${f}@${cleanDomain}`);
    permutations.add(`${f}_${l}@${cleanDomain}`);
    permutations.add(`${f}-${l}@${cleanDomain}`);
    permutations.add(`${l}.${f}@${cleanDomain}`);
  } else if (f) {
    permutations.add(`${f}@${cleanDomain}`);
  } else if (l) {
    permutations.add(`${l}@${cleanDomain}`);
  }

  return Array.from(permutations);
}

/**
 * Validates email format, disposable domain, and live DNS MX records
 * @param {string} email
 * @param {boolean} rejectGeneric - If true, rejects info@, contact@, etc.
 * @returns {Promise<{ valid: boolean, isGeneric: boolean, cleanEmail?: string, reason?: string, domain?: string, mxHost?: string }>}
 */
export async function verifyEmail(email, rejectGeneric = false) {
  if (!email || typeof email !== 'string') {
    return { valid: false, isGeneric: false, reason: 'Email is empty or invalid type' };
  }

  // 1. Clean & Sanitize
  const cleanEmail = extractCleanEmail(email);
  if (!cleanEmail) {
    return { valid: false, isGeneric: false, reason: `Malformed or invalid email syntax: "${email}"` };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, isGeneric: false, reason: 'Malformed email structure' };
  }

  const domain = parts[1];
  const isGeneric = isGenericEmail(cleanEmail);

  if (rejectGeneric && isGeneric) {
    return { valid: false, isGeneric: true, cleanEmail, reason: 'Generic role account (info@, contact@) rejected for decision maker mode', domain };
  }

  // 2. Disposable / Burner Email Blacklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, isGeneric, cleanEmail, reason: 'Disposable / temporary email domain detected', domain };
  }

  // 3. DNS MX Record Verification (Checks if mail server actually exists)
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, isGeneric, cleanEmail, reason: `No active MX mail servers found for domain "${domain}"`, domain };
    }

    // Filter out blackhole / invalid 0.0.0.0 hosts
    const validRecords = mxRecords.filter((r) => r.exchange && r.exchange !== '.' && r.exchange !== '0.0.0.0' && r.exchange !== 'localhost');
    if (validRecords.length === 0) {
      return { valid: false, isGeneric, cleanEmail, reason: `Domain "${domain}" has null/blackhole MX records`, domain };
    }

    // Sort by priority to find primary mail exchange server
    validRecords.sort((a, b) => a.priority - b.priority);
    const primaryMx = validRecords[0].exchange;

    return {
      valid: true,
      cleanEmail,
      isGeneric,
      domain,
      mxHost: primaryMx,
    };
  } catch (err) {
    return {
      valid: false,
      isGeneric,
      cleanEmail,
      reason: `DNS MX lookup failed for ${domain} (${err.code || 'NO_MX'})`,
      domain,
    };
  }
}
