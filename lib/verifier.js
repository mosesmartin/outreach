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
  if (!raw || typeof raw !== 'string') return null;

  let clean = raw.trim().replace(/^mailto:/i, '').split('?')[0].trim();

  // Find '@'
  const atIndex = clean.lastIndexOf('@');
  if (atIndex <= 0) return null;

  let localPart = clean.substring(0, atIndex).trim();
  let domainPart = clean.substring(atIndex + 1).trim();

  // 1. Clean localPart:
  // If there are spaces or colons in localPart, take the last segment
  const spaceOrColonMatch = localPart.match(/[\s:,]+([a-zA-Z0-9._%+-]+)$/);
  if (spaceOrColonMatch) {
    localPart = spaceOrColonMatch[1];
  }

  // Strip leading phone numbers/digits (3+ digits, e.g. "33027954-852-2654info" -> "info", "7120emailinfo" -> "emailinfo")
  localPart = localPart.replace(/^[\d\s()+-]{3,}/, '');

  // Strip concatenated prefix keywords (e.g. "emailinfo" -> "info", "e-mailinfo" -> "info")
  if (/^e-?mail[a-zA-Z]/i.test(localPart) && !localPart.toLowerCase().startsWith('email@')) {
    localPart = localPart.replace(/^e-?mail/i, '');
  }

  // Strip leading invalid symbols
  localPart = localPart.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9._%+-]/g, '');

  if (!localPart || localPart.length < 1) return null;

  // 2. Clean domainPart:
  // Strip anything after space, comma, semicolon, quotes, angle brackets, parentheses, slashes
  domainPart = domainPart.split(/[\s,;:()\/\\<>"'{}[\]|]/)[0].toLowerCase().trim();

  // Fix domain if trailing words were appended to TLD (e.g. "tsroofingsystems.commonday" -> "tsroofingsystems.com")
  const lastDotIndex = domainPart.lastIndexOf('.');
  if (lastDotIndex > 0) {
    for (const tld of COMMON_TLDS) {
      const dotTld = `.${tld}`;
      const tldPos = domainPart.indexOf(dotTld);
      if (tldPos > 0) {
        domainPart = domainPart.substring(0, tldPos + dotTld.length);
        break;
      }
    }
  }

  const candidate = `${localPart}@${domainPart}`.toLowerCase().trim();

  // Strict RFC-compliant regex with TLD format
  const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (validEmailRegex.test(candidate)) {
    const parts = candidate.split('@')[1].split('.');
    const tld = parts[parts.length - 1];
    if (tld && tld.length >= 2 && /^[a-z]+$/.test(tld)) {
      return candidate;
    }
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
