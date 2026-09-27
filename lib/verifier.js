import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Known disposable domain list
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
]);

// Generic front-desk / role-based email prefixes that should be avoided for decision maker outreach
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
 * Checks if an email is a generic role account vs personal name
 */
export function isGenericEmail(email) {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return GENERIC_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Generates corporate email permutations from a person's name and company domain
 * e.g., Moses Martin + synergytechsol.com -> [moses@..., mosesmartin@..., moses.martin@..., mmartin@...]
 */
export function generateEmailPermutations(firstName, lastName, domain) {
  if (!domain) return [];
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim().toLowerCase();
  const f = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const l = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  if (!f && !l) return [];

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
 * @returns {Promise<{ valid: boolean, isGeneric: boolean, reason?: string, domain?: string, mxHost?: string }>}
 */
export async function verifyEmail(email, rejectGeneric = false) {
  if (!email || typeof email !== 'string') {
    return { valid: false, isGeneric: false, reason: 'Email is empty or invalid type' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. RFC Syntax Regex Check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, isGeneric: false, reason: 'Invalid email syntax format' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, isGeneric: false, reason: 'Malformed email structure' };
  }

  const domain = parts[1];
  const isGeneric = isGenericEmail(cleanEmail);

  if (rejectGeneric && isGeneric) {
    return { valid: false, isGeneric: true, reason: 'Generic role account (info@, contact@) rejected for decision maker mode', domain };
  }

  // 2. Disposable / Burner Email Blacklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, isGeneric, reason: 'Disposable / temporary email domain detected', domain };
  }

  // 3. DNS MX Record Verification (Checks if mail server actually exists)
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, isGeneric, reason: 'No active mail servers (MX records) found for domain', domain };
    }

    // Sort by priority to find primary mail exchange server
    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMx = mxRecords[0].exchange;

    return {
      valid: true,
      isGeneric,
      domain,
      mxHost: primaryMx,
    };
  } catch (err) {
    return {
      valid: false,
      isGeneric,
      reason: `DNS lookup failed for ${domain} (${err.code || 'NO_MX'})`,
      domain,
    };
  }
}
