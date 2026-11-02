// Source-declared client location, not identity verification. Search region,
// currency, phone prefixes and a preference for US freelancers are not evidence.
const US_COUNTRIES = new Set(['us', 'usa', 'unitedstates', 'unitedstatesofamerica']);
const cleanCountry = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '');
const stateNames = 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming';
const countryStart = /^(?:the\s+)?(?:United States(?: of America)?|USA|US)\b/i;
const stateStart = new RegExp(`^(?:${stateNames})\\b`, 'i');
const cityStateName = new RegExp(`^[a-z][a-z .'-]{1,50},\\s*(?:${stateNames}|Georgia)\\b`, 'i');
// Avoid treating an ambiguous suffix such as Toronto, CA as proof of California.
const cityStatePairs = /^(?:Austin|Dallas|Houston|San Antonio|Fort Worth),\s*TX\b|^(?:Los Angeles|San Diego|San Francisco|Sacramento|San Jose),\s*CA\b|^(?:Miami|Orlando|Tampa|Jacksonville),\s*FL\b|^New York(?: City)?,\s*NY\b|^Chicago,\s*IL\b|^Seattle,\s*WA\b|^Boston,\s*MA\b|^Atlanta,\s*GA\b|^Denver,\s*CO\b|^Phoenix,\s*AZ\b|^Philadelphia,\s*PA\b|^Las Vegas,\s*NV\b|^Washington,\s*DC\b/i;
const foreignPlace = /^(?:the\s+)?(?:Canada|United Kingdom|UK|England|Scotland|Wales|Ireland|Australia|New Zealand|India|Pakistan|Bangladesh|Nepal|Sri Lanka|United Arab Emirates|UAE|Dubai|Saudi Arabia|Germany|France|Netherlands|Spain|Italy|South Africa|Nigeria|Kenya|Philippines|Singapore|Malaysia|Indonesia|China|Japan|Brazil|Mexico)\b|^[a-z][a-z .'-]{1,50},\s*(?:Canada|UK|United Kingdom|Australia|India|Pakistan|UAE|Germany|France|Malaysia|Philippines)\b/i;

export function requesterLocationMetadata(post) {
  const locations = [];
  for (const [kind, actors] of [['author_address', post?.author], ['organization_address', post?.hiringOrganization]]) {
    for (const actor of Array.isArray(actors) ? actors : [actors]) {
      if (!actor || typeof actor !== 'object') continue;
      for (const raw of [actor.address, actor.homeLocation?.address]) {
        for (const address of Array.isArray(raw) ? raw : [raw]) {
          if (!address || typeof address !== 'object') continue;
          const country = typeof address.addressCountry === 'object' ? address.addressCountry?.name : address.addressCountry;
          if (typeof country !== 'string' || !country.trim()) continue;
          const label = [address.addressLocality, address.addressRegion, country].filter((part) => typeof part === 'string').join(', ').slice(0, 240);
          locations.push({ country: country.slice(0, 100), evidence: label, source: kind });
        }
      }
    }
  }
  return locations;
}

export function assessUsClient(post = {}) {
  const matches = [];
  let foreign = false;
  for (const location of post.requesterLocations || []) {
    if (!['author_address', 'organization_address'].includes(location.source) || !location.country) continue;
    if (US_COUNTRIES.has(cleanCountry(location.country))) {
      matches.push({ countryCode: 'US', evidence: String(location.evidence || location.country).slice(0, 240), source: location.source });
    } else foreign = true;
  }
  const normalize = (text) => String(text || '').replace(/\bU\.S\.(?:A\.?)?/gi, 'USA').replace(/\s+/g, ' ');
  const text = normalize(`${post.title || ''}\n${post.body || ''}`);
  const owner = '(?:business|company|shop|store|agency|practice|restaurant|clinic|startup)';
  const prefix = new RegExp(`\\b(?:(?:i am|i['’]m|we are|we['’]re)\\s+(?:currently\\s+)?(?:based|located|living|operating)\\s+in|(?:my|our)\\s+(?:small\\s+)?${owner}\\s+(?:(?:is|are)\\s+)?(?:(?:based|located|operating|registered)\\s+)?in)\\s+([^.!?;]{2,100})`, 'gi');
  for (const match of text.matchAll(prefix)) {
    const claim = match[1].split(/,?\s+\b(?:serving|targeting|seeking|looking|hiring|but|and|with)\b/i)[0].trim();
    if (foreignPlace.test(claim)) foreign = true;
    if (countryStart.test(claim) || stateStart.test(claim) || cityStateName.test(claim) || cityStatePairs.test(claim)) {
      matches.push({ countryCode: 'US', evidence: match[0].slice(0, match[0].length - match[1].length) + claim, source: 'post_self_declaration' });
    }
  }
  const basedOwner = new RegExp(`^(?:\\[hiring\\]\\s*)?(?:(?:i am|i['’]m|we are|we['’]re)\\s+(?:a|an)\\s+)?(?:USA?|United States)[ -]based\\s+${owner}\\b`, 'i');
  if (basedOwner.test(normalize(post.title)) || basedOwner.test(normalize(post.body))) {
    matches.push({ countryCode: 'US', evidence: (normalize(post.title).match(basedOwner) || normalize(post.body).match(basedOwner))[0], source: 'post_self_declaration' });
  }
  if (foreign) return { accepted: false, reason: 'non_us_client' };
  if (!matches.length) return { accepted: false, reason: 'unverified_country' };
  return { accepted: true, ...matches[0] };
}

export function hasUsClientEvidence(record) {
  return record?.country_code === 'US' && typeof record.country_evidence === 'string'
    && record.country_evidence.trim().length > 0
    && ['author_address', 'organization_address', 'post_self_declaration'].includes(record.country_evidence_source);
}
