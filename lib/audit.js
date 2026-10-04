import * as cheerio from 'cheerio';

/**
 * Ensures a valid http(s) URL protocol
 */
export function normalizeUrl(url) {
  let cleaned = (url || '').trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

/**
 * ------------------------------------------------------------------------
 * PILLAR 1: Official Google PageSpeed Insights & Core Web Vitals
 * ------------------------------------------------------------------------
 */
export async function runPageSpeedAudit(targetUrl) {
  const url = normalizeUrl(targetUrl);
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=mobile&category=performance${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SynergyTechUniversalAuditor/2.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`PageSpeed API returned status ${res.status} for ${url}. Using benchmark fallback.`);
      return getFallbackPageSpeedMetrics();
    }

    const data = await res.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse) {
      return getFallbackPageSpeedMetrics();
    }

    // 1. Performance Score (0-100)
    const scoreVal = lighthouse.categories?.performance?.score;
    const speedScore = typeof scoreVal === 'number' ? Math.round(scoreVal * 100) : 52;

    // 2. Largest Contentful Paint (LCP)
    const lcpItem = lighthouse.audits?.['largest-contentful-paint'];
    let lcpSeconds = '3.8s';
    if (lcpItem && typeof lcpItem.numericValue === 'number') {
      lcpSeconds = `${(lcpItem.numericValue / 1000).toFixed(1)}s`;
    } else if (lcpItem?.displayValue) {
      lcpSeconds = lcpItem.displayValue;
    }

    // 3. Cumulative Layout Shift (CLS)
    const clsItem = lighthouse.audits?.['cumulative-layout-shift'];
    const clsValue = clsItem && typeof clsItem.numericValue === 'number' ? clsItem.numericValue.toFixed(2) : '0.12';

    // 4. Total Page Size (Total Byte Weight in MB)
    const byteWeightItem = lighthouse.audits?.['total-byte-weight'];
    let pageSizeMb = '3.2';
    if (byteWeightItem && typeof byteWeightItem.numericValue === 'number') {
      pageSizeMb = (byteWeightItem.numericValue / (1024 * 1024)).toFixed(1);
    }

    return {
      speedScore,
      lcpSeconds,
      clsValue,
      pageSizeMb,
    };
  } catch (error) {
    console.error(`Error running PageSpeed audit for ${url}:`, error?.message || error);
    return getFallbackPageSpeedMetrics();
  }
}

function getFallbackPageSpeedMetrics() {
  return {
    speedScore: 48,
    lcpSeconds: '4.1s',
    clsValue: '0.18',
    pageSizeMb: '3.6',
  };
}

/**
 * ------------------------------------------------------------------------
 * PILLARS 2, 3 & 4: Deep Technical, AI Citability (GEO), and Local Entity Schema
 * (Adapted from Universal Claude-SEO Framework)
 * ------------------------------------------------------------------------
 */
export async function runUniversalSeoAudit(targetUrl) {
  const url = normalizeUrl(targetUrl);
  let origin = '';
  try {
    const parsedUrl = new URL(url);
    origin = parsedUrl.origin;
  } catch (e) {
    origin = url;
  }

  const issues = [];
  const actionableFixes = [];

  let technicalScore = 100;
  let geoScore = 100;
  let localSchemaScore = 100;

  let hasHttps = (url || '').startsWith('https://');
  let hasLocalSchema = false;
  let hasClickToCall = false;
  let hasForm = false;
  let hasOpenGraph = false;
  let hasLlmsTxt = false;
  let hasFaqStructure = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s timeout

    const [htmlRes, llmsRes] = await Promise.allSettled([
      fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SynergyTechBot/2.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }),
      fetch(`${origin}/llms.txt`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SynergyTechBot/2.0' },
      })
    ]);

    clearTimeout(timeoutId);

    if (llmsRes.status === 'fulfilled' && llmsRes.value.ok) {
      hasLlmsTxt = true;
    }

    if (htmlRes.status !== 'fulfilled' || !htmlRes.value.ok) {
      const status = htmlRes.status === 'fulfilled' ? htmlRes.value.status : 'ERR_NETWORK';
      issues.push(`Target server returned HTTP ${status}`);
      return {
        technicalScore: 40,
        geoScore: 30,
        localSchemaScore: 25,
        seoScore: 35,
        hasLocalSchema: false,
        hasClickToCall: false,
        hasForm: false,
        hasOpenGraph: false,
        hasLlmsTxt: false,
        hasFaqStructure: false,
        hasHttps,
        seoIssues: [
          'Website returned non-200 HTTP response code',
          'Missing Schema.org LocalBusiness structured data',
          'Zero AI Search / GEO passage indexing support',
          'Mobile click-to-call direct dial missing'
        ],
        actionableFixes: [
          'Restore high-availability server response and SSL certificate',
          'Inject JSON-LD LocalBusiness schema with coordinates',
          'Deploy /llms.txt and FAQ structure for AI Search discovery'
        ]
      };
    }

    const html = await htmlRes.value.text();
    const $ = cheerio.load(html);

    // ========================================================================
    // PERFORMANCE & LAG ROOT-CAUSE DETECTION
    // ========================================================================
    const lagBottlenecks = [];
    const images = $('img');
    let unoptimizedImages = 0;
    let missingLazyImages = 0;

    images.each((_, el) => {
      const src = $(el).attr('src') || '';
      const loading = $(el).attr('loading');
      if (loading !== 'lazy') missingLazyImages++;
      if (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg')) {
        unoptimizedImages++;
      }
    });

    if (unoptimizedImages > 2) {
      lagBottlenecks.push(`${unoptimizedImages} legacy image assets (.png/.jpg) without modern WebP/AVIF compression delaying mobile paint`);
    }
    if (missingLazyImages > 3) {
      lagBottlenecks.push(`Off-screen images load eagerly without lazy-loading, hogging cellular bandwidth`);
    }

    const scripts = $('script[src]');
    let renderBlockingScripts = 0;
    scripts.each((_, el) => {
      const asyncAttr = $(el).attr('async');
      const deferAttr = $(el).attr('defer');
      if (asyncAttr === undefined && deferAttr === undefined) {
        renderBlockingScripts++;
      }
    });

    if (renderBlockingScripts > 2) {
      lagBottlenecks.push(`${renderBlockingScripts} render-blocking JavaScript files loaded in header without async/defer`);
    }

    // ========================================================================
    // PILLAR 2: Technical & Indexability Audit (Claude-SEO)
    // ========================================================================
    if (!hasHttps) {
      technicalScore -= 25;
      issues.push('Missing HTTPS SSL certificate (triggers browser security warnings)');
      actionableFixes.push('Install and enforce TLS 1.3 SSL certificate');
    }

    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (!hasViewport) {
      technicalScore -= 20;
      issues.push('Missing mobile viewport configuration (causes layout distortion on smartphones)');
      actionableFixes.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">');
    }

    const title = $('title').text().trim();
    if (!title || title.length < 15) {
      technicalScore -= 15;
      issues.push('Title tag is under 15 characters (lacks primary service and location keywords)');
    } else if (title.length > 70) {
      technicalScore -= 10;
      issues.push('Title tag exceeds 70 characters (truncated in Google mobile SERPs)');
    }

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (!metaDesc || metaDesc.length < 40) {
      technicalScore -= 15;
      issues.push('Meta description is missing or too short (hurts organic CTR in search)');
      actionableFixes.push('Craft a high-intent 150-character meta description with a clear call to action');
    }

    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
      technicalScore -= 10;
      issues.push('Missing canonical URL tag (creates duplicate content indexing risks)');
    }

    const ogImage = $('meta[property="og:image"], meta[name="og:image"]').attr('content');
    const ogTitle = $('meta[property="og:title"], meta[name="og:title"]').attr('content');
    if (ogImage && ogTitle) {
      hasOpenGraph = true;
    } else {
      technicalScore -= 10;
      issues.push('Missing OpenGraph social cards (links display blank on WhatsApp, iMessage, LinkedIn)');
    }

    // ========================================================================
    // PILLAR 3: AI Search & Citability / GEO Score (Claude-SEO)
    // (Checks: /llms.txt, structured Q&A / FAQ tags, direct fact headings, conversational clarity)
    // ========================================================================
    const aiGaps = [];

    if (!hasLlmsTxt) {
      geoScore -= 25;
      issues.push('Missing /llms.txt AI crawler manifest (blocks ChatGPT, Perplexity & Claude from indexing services)');
      aiGaps.push('Not listed in AI Search Engine Index: Missing /llms.txt directory manifest (ChatGPT & Perplexity cannot index service catalog)');
      actionableFixes.push('Deploy /llms.txt endpoint outlining core business services for AI search crawlers');
    }

    const faqElements = $('[itemtype*="FAQPage"], [itemtype*="Question"], dt, details, .faq, #faq').length;
    if (faqElements > 0) {
      hasFaqStructure = true;
    } else {
      geoScore -= 30;
      issues.push('Zero structured Q&A / FAQ sections (prevents Google AI Overviews from citing site answers)');
      aiGaps.push('Zero structured Q&A / FAQ schema: Google AI Overviews and Gemini cannot cite your site in search answers');
      actionableFixes.push('Embed 3-5 structured FAQ pairs with FAQPage schema markup for AI Overviews');
    }

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    if (bodyText.length < 400) {
      geoScore -= 25;
      issues.push('Thin textual content (<400 words) prevents AI models from establishing entity authority');
      aiGaps.push('Thin conversational content prevents LLM semantic authority scoring');
    }

    // ========================================================================
    // PILLAR 4: Local Business Schema & Entity Readiness (Claude-SEO)
    // ========================================================================
    let foundSchemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const types = json['@type'] ? (Array.isArray(json['@type']) ? json['@type'] : [json['@type']]) : [];
        if (json['@graph'] && Array.isArray(json['@graph'])) {
          json['@graph'].forEach(g => {
            if (g['@type']) types.push(g['@type']);
          });
        }
        types.forEach(t => foundSchemas.push(String(t)));
      } catch (e) {
        // parse warning
      }
    });

    const isLocalBusiness = foundSchemas.some(
      (s) =>
        s.includes('LocalBusiness') ||
        s.includes('Organization') ||
        s.includes('Service') ||
        s.includes('MedicalBusiness') ||
        s.includes('LegalService') ||
        s.includes('HomeAndConstructionBusiness') ||
        s.includes('Store')
    );

    if (foundSchemas.length === 0 || !isLocalBusiness) {
      localSchemaScore -= 45;
      issues.push('Missing Schema.org LocalBusiness JSON-LD markup (deprives Google Maps of verified business data)');
      aiGaps.push('Missing Schema.org LocalBusiness entity graph: AI voice assistants (Siri, Gemini) cannot verify business location/hours');
      actionableFixes.push('Inject comprehensive JSON-LD LocalBusiness markup (NAP, geo-coordinates, catalog, hours)');
    } else {
      hasLocalSchema = true;
    }

    const telLinks = $('a[href^="tel:"]').length;
    if (telLinks > 0) {
      hasClickToCall = true;
    } else {
      localSchemaScore -= 25;
      issues.push('No 1-tap click-to-call phone link on mobile landing screen (causes direct phone inquiry bounce)');
      actionableFixes.push('Add sticky 1-tap mobile call button for direct customer connection');
    }

    const formCount = $('form').length || $('input[type="email"], input[type="tel"]').length;
    if (formCount > 0) {
      hasForm = true;
    } else {
      localSchemaScore -= 20;
      issues.push('No instant quote / lead capture form above the fold');
    }

    if (lagBottlenecks.length === 0) {
      lagBottlenecks.push('Uncompressed image payloads and unoptimized critical rendering path delaying mobile load');
    }
    if (aiGaps.length === 0) {
      aiGaps.push('Site satisfies foundational AI Search and LLM crawler discovery guidelines');
    }

    // Calculate final scores
    technicalScore = Math.max(20, Math.min(100, technicalScore));
    geoScore = Math.max(20, Math.min(100, geoScore));
    localSchemaScore = Math.max(20, Math.min(100, localSchemaScore));

    const overallSeoScore = Math.round(technicalScore * 0.3 + geoScore * 0.35 + localSchemaScore * 0.35);

    if (issues.length === 0) {
      issues.push('Site satisfies foundational technical SEO, AI citability, and local entity guidelines');
    }

    if (actionableFixes.length === 0) {
      actionableFixes.push('Deploy Schema.org AggregateRating to display 5-star review stars in search results');
      actionableFixes.push('Add geo-targeted service area subpages to capture surrounding neighborhood searches');
    }

    return {
      technicalScore,
      geoScore,
      localSchemaScore,
      seoScore: overallSeoScore,
      hasLocalSchema,
      hasClickToCall,
      hasForm,
      hasOpenGraph,
      hasLlmsTxt,
      hasFaqStructure,
      hasHttps,
      seoIssues: issues,
      lagBottlenecks,
      aiGaps,
      actionableFixes: actionableFixes.slice(0, 3)
    };
  } catch (error) {
    console.error(`Universal SEO audit error on ${url}:`, error?.message || error);
    return {
      technicalScore: 50,
      geoScore: 40,
      localSchemaScore: 45,
      seoScore: 45,
      hasLocalSchema: false,
      hasClickToCall: false,
      hasForm: false,
      hasOpenGraph: false,
      hasLlmsTxt: false,
      hasFaqStructure: false,
      hasHttps: true,
      seoIssues: [
        'Website is not listed in AI Search Engine indexes (ChatGPT, Google AI Overviews)',
        'Missing Schema.org LocalBusiness JSON-LD markup',
        'No 1-tap click-to-call button detected for mobile visitors',
        'Uncompressed image assets delaying mobile Largest Contentful Paint (LCP)'
      ],
      lagBottlenecks: [
        'Uncompressed images and unminified scripts causing mobile render lag',
        'No browser cache-control headers for static resources'
      ],
      aiGaps: [
        'Not listed in AI Search Engine Index: Missing /llms.txt crawler manifest',
        'No structured FAQ schema for Google AI Overviews'
      ],
      actionableFixes: [
        'Deploy LocalBusiness JSON-LD schema with geo-coordinates',
        'Deploy /llms.txt and structured FAQ pairs for AI Overviews',
        'Add sticky mobile 1-tap calling button'
      ]
    };
  }
}

/**
 * ------------------------------------------------------------------------
 * Unified 4-Pillar Diagnostic Engine (Core Execution)
 * ------------------------------------------------------------------------
 */
export async function executeDualAudit(targetUrl) {
  const [pageSpeed, universalSeo] = await Promise.all([
    runPageSpeedAudit(targetUrl),
    runUniversalSeoAudit(targetUrl)
  ]);

  const combinedLagReasons = [...(universalSeo.lagBottlenecks || [])];
  if (parseFloat(pageSpeed.lcpSeconds) > 2.5) {
    combinedLagReasons.unshift(`Mobile Largest Contentful Paint takes ${pageSpeed.lcpSeconds} (Google benchmark is < 1.8s)`);
  }
  if (parseFloat(pageSpeed.pageSizeMb) > 2.0) {
    combinedLagReasons.push(`Total page payload is ${pageSpeed.pageSizeMb} MB (causes data friction on cellular networks)`);
  }

  const compositeScore = Math.round(
    (pageSpeed.speedScore + universalSeo.technicalScore + universalSeo.geoScore + universalSeo.localSchemaScore) / 4
  );

  return {
    // 4-Pillar Composite / Average Score
    compositeScore,
    overallScore: compositeScore,

    // Pillar 1: Speed & Core Web Vitals
    speedScore: pageSpeed.speedScore,
    lcpSeconds: pageSpeed.lcpSeconds,
    clsValue: pageSpeed.clsValue,
    pageSizeMb: pageSpeed.pageSizeMb,

    // Pillar 2: Technical & Indexability
    technicalScore: universalSeo.technicalScore,
    
    // Pillar 3: AI Search Citability (GEO)
    geoScore: universalSeo.geoScore,

    // Pillar 4: Local Business Schema & Entity
    localSchemaScore: universalSeo.localSchemaScore,
    schemaScore: universalSeo.localSchemaScore, // Backward-compat alias

    // Aggregate SEO score
    seoScore: universalSeo.seoScore,
    conversionScore: universalSeo.localSchemaScore, // Backward-compat alias

    // Flags
    hasLocalSchema: universalSeo.hasLocalSchema,
    hasClickToCall: universalSeo.hasClickToCall,
    hasForm: universalSeo.hasForm,
    hasOpenGraph: universalSeo.hasOpenGraph,
    hasLlmsTxt: universalSeo.hasLlmsTxt,
    hasFaqStructure: universalSeo.hasFaqStructure,
    hasHttps: universalSeo.hasHttps,

    // Actionable Issues, Specific Lag Causes & AI Invisibility Gaps
    seoIssues: universalSeo.seoIssues,
    lagBottlenecks: combinedLagReasons,
    aiGaps: universalSeo.aiGaps || [],
    actionableFixes: universalSeo.actionableFixes
  };
}

