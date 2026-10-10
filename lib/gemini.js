import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

let genAI = null;
if (apiKey && apiKey !== 'your-gemini-api-key') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error('Failed to initialize GoogleGenerativeAI:', e);
  }
}

/**
 * Generates a casual, plain-spoken teardown hook for Funnel A (Website Exists)
 * Incorporating 4-Pillar Universal SEO & GEO Intelligence
 * Strict requirement: Under 40 words, casual human tone, no buzzwords, no exclamation marks.
 */
export async function generateFunnelAHook(params) {
  const {
    businessName,
    speedScore = 50,
    lcpSeconds = '3.8s',
    topIssue = '',
    schemaScore = 50,
    geoScore = 50,
    technicalScore = 70,
    localSchemaScore = 50,
    lagBottlenecks = [],
    aiGaps = [],
  } = params;

  const lagContext = Array.isArray(lagBottlenecks) && lagBottlenecks.length > 0 ? lagBottlenecks[0] : `Mobile render lag of ${lcpSeconds}`;
  const aiGapContext = Array.isArray(aiGaps) && aiGaps.length > 0 ? aiGaps[0] : `Missing AI search manifest and structured FAQ markup`;

  if (genAI) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `
You are a pragmatic web performance and search engineer writing a 1-sentence casual observation for a cold email.
Business Name: ${businessName}
Mobile Speed Score: ${speedScore}/100 (Render Delay: ${lcpSeconds})
AI Citability / GEO Score: ${geoScore}/100
Exact Performance Lag Cause: ${lagContext}
AI Search Discovery Gap: ${aiGapContext}
Key Bottleneck: ${topIssue || lagContext}

Rules:
1. Strict word count: MAXIMUM 35 words.
2. Tone: Plain, casual, helpful peer observation.
3. Absolutely NO exclamation marks.
4. NO hype words (e.g., 'revolutionary', 'skyrocket', 'supercharge', 'game-changer').
5. Factual sentence explaining either:
   - Why their website is invisible/unlisted on AI Search (ChatGPT, Perplexity, Google AI Overviews) due to missing /llms.txt or schema.
   - OR what specific technical element is causing their mobile load to lag.

Output ONLY the plain text observation.`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim().replace(/!/g, '.');
        if (text && text.length > 10) {
          return text;
        }
      } catch (error) {
        // try next model
      }
    }
  }

  // Dynamic Context-Aware Fallbacks
  if (geoScore < 60) {
    return `Your website currently isn't indexed by AI Search engines (like ChatGPT and Google AI Overviews) because it lacks an /llms.txt manifest and structured Q&A entity data.`;
  } else if (parseFloat(lcpSeconds) > 3.0) {
    return `Your site is lagging on mobile connections due to ${lagContext.toLowerCase()}, which causes mobile visitors to bounce before your contact details render.`;
  } else if (localSchemaScore < 60 || schemaScore < 60) {
    return `Missing Schema.org LocalBusiness JSON-LD markup is preventing Google Maps and local searchers from seeing your verified service catalogue.`;
  } else {
    return `Resolving ${topIssue ? topIssue.toLowerCase() : 'mobile conversion friction'} will give an instant boost to your local search inquiries.`;
  }
}

/**
 * Generates a casual hook for Funnel B (No Website Found)
 * Strict requirement: Under 40 words, casual human tone, no exclamation marks.
 */
export async function generateFunnelBHook(params) {
  const { businessName, category, city } = params;

  if (genAI) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `
You are writing a 1-sentence friendly observation for a local business with no website.
Business Name: ${businessName}
Category: ${category}
City: ${city}

Rules:
1. Strict word count: MAXIMUM 35 words.
2. Tone: Casual, helpful, conversational.
3. Absolutely NO exclamation marks.
4. NO marketing buzzwords or aggressive sales pitch.
5. Highlight simply how having a dedicated mobile booking page helps capture people searching on Google Maps.

Output ONLY the plain text observation.`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim().replace(/!/g, '.');
        if (text && text.length > 10) {
          return text;
        }
      } catch (error) {
        // try next model
      }
    }
  }

  return `Adding a dedicated mobile booking page will make it much easier for searchers in ${city || 'your area'} to request quotes directly from your Google profile.`;
}
