import { cleanPersonName, crawlWebsiteForContacts } from './crawler.js';
import { verifyEmail, isGenericEmail, extractCleanEmail } from './verifier.js';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { generateSlug } from './slug.js';
import { isDataForSeoConfigured, fetchDataForSeoGoogleMaps, fetchDataForSeoBusinessListings } from './dataforseo.js';
import fs from 'fs';
import path from 'path';
import { syntheticLeadReason } from './leadSafety.mjs';

const APIFY_BASE_URL = 'https://api.apify.com/v2';
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'fallback_leads.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFallbackLeads() {
  ensureDataDir();
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const content = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(content || '[]');
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveFallbackLeads(leads) {
  ensureDataDir();
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(leads, null, 2));
  } catch (e) {
    console.error('Failed to save fallback leads:', e);
  }
}

export { getServicesForNiche } from './leadServices.mjs';

/**
 * Generates geographic sub-area search strings to ensure Google Maps crawls
 * 100-300+ places across an entire metropolitan area instead of stopping at 15-20
 */
export function generateSearchQueries(niche, location, targetCount) {
  const baseQuery = `${niche} in ${location}`;
  const queries = [baseQuery];

  if (targetCount <= 20) {
    return queries;
  }

  const parts = location.split(',').map((s) => s.trim());
  const city = parts[0] || location;
  const region = parts[1] ? `, ${parts[1]}` : '';

  const subAreas = [
    `Downtown ${city}${region}`,
    `North ${city}${region}`,
    `South ${city}${region}`,
    `East ${city}${region}`,
    `West ${city}${region}`,
    `Greater ${city}${region}`,
    `Metro ${city}${region}`,
  ];

  const maxQueriesNeeded = Math.min(Math.ceil(targetCount / 18), 5);
  for (const area of subAreas) {
    if (queries.length >= maxQueriesNeeded) break;
    queries.push(`${niche} in ${area}`);
  }

  return queries;
}

/**
 * Executes Apify Google Maps & Places Scraper focused on local businesses
 * Deep crawls across multi-district queries with automatic website visiting
 */
async function fetchApifyGooglePlaces({ niche, location, maxLeads, apifyToken }) {
  const targetCount = parseInt(maxLeads, 10) || 50;
  const searchQueries = generateSearchQueries(niche, location, targetCount);
  const crawlDepthPerQuery = Math.min(Math.max(Math.ceil((targetCount * 2) / searchQueries.length), 30), 100);

  console.log(`[Google Places Deep Scraper] Queries (${searchQueries.length}): ${searchQueries.join(' | ')} | Target Leads: ${targetCount}`);

  const actorId = 'compass~crawler-google-places';
  const url = `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}&timeout=180`;

  const inputPayload = {
    searchStringsArray: searchQueries,
    maxCrawledPlacesPerSearch: crawlDepthPerQuery,
    language: 'en',
    extractEmailsAndContacts: true,
    scrapeWebsites: true, // Visit websites to extract emails, forms, and social profiles
    skipClosedPlaces: true,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Apify run failed (${response.status}): ${errText}`);
    }

    const items = await response.json();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn(`[Google Places] Apify notice: ${err.message}. No substitute contacts will be created.`);
    return [];
  }
}

/**
 * Master Hybrid 360° Lead Discovery Engine:
 * - Scrapes Google Maps across multiple district queries
 * - Supports HYBRID (Emails + Phones), NO_WEBSITE_ONLY (Phones), and WEBSITE_REDESIGN (Emails)
 * - Automatically crawls websites to extract verified company emails and owner names
 * - Returns only sourced records; missing results and contact fields remain missing.
 */
export async function discoverAndEnrichLeads(params, { fetchMaps = fetchDataForSeoGoogleMaps, fetchPlaces = fetchApifyGooglePlaces, configured = isDataForSeoConfigured, loadLocal = loadFallbackLeads, saveLocal = saveFallbackLeads, database = isSupabaseConfigured ? getSupabaseAdmin() : null } = {}) {
  const {
    niche,
    location,
    maxLeads = 50,
    filterMode = 'NO_WEBSITE_ONLY', // Strict Filter: Drops every business that has an active website
    apifyToken = process.env.APIFY_API_TOKEN,
  } = params;

  if (!niche || !location) {
    throw new Error('Niche and location are required for discovery.');
  }

  const targetLimit = parseInt(maxLeads, 10) || 50;
  const supabase = database;
  let rawPlaces = [];


  // 1. Fetch leads via DataForSEO if configured (Ultra-fast direct Google Maps data)
  if (configured()) {
    try {
      console.log(`[Discovery] Querying DataForSEO Google Maps API for "${niche}" in "${location}"...`);
      rawPlaces = await fetchMaps({ niche, location, maxLeads: targetLimit });
    } catch (dfErr) {
      console.warn(`[Discovery] DataForSEO notice: ${dfErr.message}`);
    }
  }

  // 2. Fetch leads via Apify Google Places if DataForSEO is not configured or returned empty
  if ((!rawPlaces || rawPlaces.length === 0) && apifyToken && apifyToken.trim().length > 10 && !apifyToken.includes('your_apify_token')) {
    try {
      rawPlaces = await fetchPlaces({ niche, location, maxLeads: targetLimit, apifyToken });
    } catch (apifyErr) {
      console.warn(`[Discovery] Apify live notice: ${apifyErr.message}. Returning only sourced targets.`);
    }
  }

  // Empty provider results remain empty. Never invent businesses or contacts.
  const insertedLeads = [];
  let duplicateCount = 0;
  let skippedWithWebsite = 0;
  let skippedNoWebsite = 0;
  const fallbackList = loadLocal();
  const existingSlugs = new Set(fallbackList.map((l) => l.business_slug));

  // Process a single candidate place
  const processPlaceCandidate = async (place) => {
    if (insertedLeads.length >= targetLimit) return false;

    const businessName = place.title || place.name || 'Local Enterprise';
    const rawWebsite = place.website || place.url || place.link || null;

    const hasExistingWeb = Boolean(
      rawWebsite &&
      String(rawWebsite).trim().length > 4 &&
      !String(rawWebsite).includes('google.com') &&
      !String(rawWebsite).includes('facebook.com') &&
      !String(rawWebsite).includes('instagram.com')
    );

    // Check filterMode
    if (filterMode === 'NO_WEBSITE_ONLY' && hasExistingWeb) {
      skippedWithWebsite++;
      return false;
    }
    if (filterMode === 'WEBSITE_REDESIGN' && !hasExistingWeb) {
      skippedNoWebsite++;
      return false;
    }

    const category = place.categoryName || niche;
    const city = location;
    const rating = parseFloat(place.totalScore ?? place.rating ?? place.review_rating);
    const reviewCount = parseInt(place.reviewsCount ?? place.userRatingsTotal ?? place.review_count, 10);
    const businessSlug = generateSlug(businessName);

    // Duplicate check
    if (existingSlugs.has(businessSlug)) {
      duplicateCount++;
      return false;
    }

    // Capture Phone Number
    const rawPhone = place.phone || place.phoneUnformatted || place.internationalPhoneNumber || place.sanitizedPhone || place.phone_number || null;
    const phone = rawPhone ? String(rawPhone).trim() : null;

    const rawEmails = Array.isArray(place.emails) ? place.emails : [place.email || place.emails];
    let extractedEmail = rawEmails.map(extractCleanEmail).find(Boolean) || null;
    let ownerName = place.ownerName ? cleanPersonName(place.ownerName) : 'Team';

    // If business HAS a website and email wasn't provided directly, crawl the website for inboxes & founder name
    if (hasExistingWeb && !extractedEmail) {
      try {
        const crawlResult = await crawlWebsiteForContacts(rawWebsite, businessName);
        if (crawlResult.primaryEmail) {
          extractedEmail = crawlResult.primaryEmail;
        }
        if (crawlResult.ownerName && crawlResult.ownerName !== 'Team') {
          ownerName = crawlResult.ownerName;
        }
      } catch (crawlErr) {
        // Continue gracefully
      }
    }

    const finalEmail = extractedEmail || null;

    // Outreach Requirement: Must have a verified Phone OR an Email to be actionable
    if (!phone && !extractedEmail) {
      return false;
    }

    // Extract What Company Does ("Company kya krti ha" / Services)
    let extractedServices = [];
    if (Array.isArray(place.categories) && place.categories.length > 0) {
      extractedServices = place.categories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    } else if (Array.isArray(place.additionalCategories) && place.additionalCategories.length > 0) {
      extractedServices = place.additionalCategories.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean);
    } else if (typeof place.category === 'string' && place.category.trim()) {
      extractedServices = place.category.split(',').map((s) => s.trim()).filter(Boolean);
    }


    // Extract Full Address
    const address = place.address || place.street || place.formatted_address || `${city}`;

    const sourceUrl = place.source_url || place.placeUrl || place.googleMapsUrl || place.url || (place.placeId ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}&query_place_id=${encodeURIComponent(place.placeId)}` : null);
    const statusReason = `Imported from live provider. Demo not generated. Email ownership not verified.${phone ? ` Phone: ${phone}` : ''}${sourceUrl ? ` Source: ${sourceUrl}` : ''}`;

    const leadRecord = {
      source_url: sourceUrl,
      business_name: businessName,
      business_slug: businessSlug,
      owner_name: ownerName,
      email: finalEmail || '',
      phone: phone || null,
      address,
      website_url: hasExistingWeb ? rawWebsite : null,
      has_website: hasExistingWeb,
      category,
      city,
      services: extractedServices,
      rating: isNaN(rating) ? null : rating,
      review_count: isNaN(reviewCount) ? null : reviewCount,
      status: 'PENDING',
      stage: 'NEW_LEAD',
      deal_value: 0,
      retainer_value: 0,
      priority: 'MEDIUM',
      notes: [
        {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: hasExistingWeb
            ? `Target Discovered via Google Maps: Active website detected (${rawWebsite}). Inboxes crawled. Demo not generated. Services: ${extractedServices.slice(0, 3).join(', ')}.`
            : `Target Discovered via Google Maps: No website detected. Demo not generated. Services: ${extractedServices.slice(0, 3).join(', ')}.`,
          createdAt: new Date().toISOString(),
          author: 'System Scraper',
        }
      ],
      status_reason: statusReason,
      created_at: new Date().toISOString(),
    };

    if (syntheticLeadReason(leadRecord)) return false;
    let inserted = null;

    // Guaranteed Supabase DB insertion
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('business_slug', businessSlug)
          .limit(1);

        if (existing && existing.length > 0) {
          duplicateCount++;
          return false;
        }

        const supabasePayload = {
          business_name: businessName,
          business_slug: businessSlug,
          owner_name: ownerName,
          email: finalEmail || '',
          website_url: hasExistingWeb ? rawWebsite : null,
          has_website: hasExistingWeb,
          category,
          city,
          services: extractedServices,
          rating: isNaN(rating) ? null : rating,
          review_count: isNaN(reviewCount) ? null : reviewCount,
          status: 'PENDING',
          status_reason: statusReason,
        };

        const { data: directInsert, error: insertErr } = await supabase
          .from('leads')
          .insert(supabasePayload)
          .select()
          .single();

        if (directInsert) {
          inserted = {
            ...leadRecord,
            id: directInsert.id,
          };
        } else if (insertErr) {
          console.warn('[Discovery Supabase Notice]:', insertErr.message);
        }
      } catch (dbErr) {
        console.warn('[Discovery DB Error, saving resiliently to fallback]:', dbErr.message);
      }
    }

    const finalRecord = inserted || {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...leadRecord,
    };

    existingSlugs.add(businessSlug);
    fallbackList.unshift(finalRecord);
    insertedLeads.push(finalRecord);
    return true;
  };

  // Process live raw places
  for (const place of rawPlaces) {
    if (insertedLeads.length >= targetLimit) break;
    await processPlaceCandidate(place);
  }

  // Persist updated fallback list
  if (insertedLeads.length) saveLocal(fallbackList);

  const withEmailCount = insertedLeads.filter((l) => Boolean(l.email && !l.email.includes('@leads.synergytechsol.com'))).length;
  const withPhoneCount = insertedLeads.filter((l) => Boolean(l.phone || (l.status_reason && l.status_reason.includes('Phone:')))).length;

  return {
    success: true,
    filterMode,
    totalDiscovered: rawPlaces.length,
    totalSaved: insertedLeads.length,
    withEmailCount,
    withPhoneCount,
    skippedWithWebsite,
    skippedNoWebsite,
    skippedDuplicates: duplicateCount,
    isSimulated: false,
    requestedCount: targetLimit,
    shortfall: Math.max(0, targetLimit - insertedLeads.length),
    leads: insertedLeads,
  };
}


// Contact enrichment only: never creates guessed email addresses or demo pages.
export async function enrichSingleDomainLead(domainOrUrl, businessName = '') {
  const websiteUrl = /^https?:\/\//i.test(domainOrUrl) ? domainOrUrl : `https://${domainOrUrl}`;
  const result = await crawlWebsiteForContacts(websiteUrl, businessName);
  return { businessName: businessName || new URL(websiteUrl).hostname, websiteUrl, ownerName: result.ownerName, email: result.primaryEmail || null, emails: result.emails || [] };
}
