import nodemailer from 'nodemailer';

/**
 * Converts text string to proper Title Case
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  // Handle camelCase or concatenated names like ghaithtraveltourism -> Ghaith Travel Tourism if spaceless
  const withSpaces = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return withSpaces
    .split(' ')
    .map((word) => {
      if (word.length <= 1) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Builds High-Converting Cold Email for Funnel A (Website Exists)
 * Dynamically adapts to the exact 4-pillar audit report findings
 */
export function buildFunnelAEmail(params) {
  const {
    ownerName,
    businessName,
    speedScore = 50,
    lcpSeconds = '3.8s',
    pageSizeMb = '3.2',
    technicalScore = 70,
    geoScore = 50,
    localSchemaScore = 50,
    schemaScore = 50,
    conversionScore = 50,
    seoScore = 55,
    seoIssues = [],
    lagBottlenecks = [],
    aiGaps = [],
    geminiHook,
    city,
    category,
  } = params;

  const actualGeo = typeof geoScore === 'number' ? geoScore : 45;
  const actualTech = typeof technicalScore === 'number' ? technicalScore : (typeof seoScore === 'number' ? seoScore : 70);
  const actualLocal = typeof localSchemaScore === 'number' ? localSchemaScore : (typeof schemaScore === 'number' ? schemaScore : 50);
  const actualSpeed = typeof speedScore === 'number' ? speedScore : 50;

  const rawOwner = ownerName && ownerName !== 'Team' && !ownerName.toLowerCase().includes('leadership')
    ? ownerName.split(' ')[0]
    : null;

  const cleanOwner = rawOwner ? toTitleCase(rawOwner) : null;
  const cleanBusiness = toTitleCase(businessName || 'Your Business');

  const greeting = cleanOwner ? `Hi ${cleanOwner},` : `Hi there,`;
  const locationContext = city ? ` in ${toTitleCase(city)}` : '';
  const categoryContext = category ? `${category.toLowerCase()} providers` : 'local businesses';

  const rawLag = (lagBottlenecks && lagBottlenecks[0]) || (seoIssues && seoIssues[0]) || `Mobile render takes ${lcpSeconds}`;
  const cleanLag = rawLag
    .replace(/\s*\(Google benchmark.*?\)/gi, '')
    .replace(/\s*\(Google recommends.*?\)/gi, '')
    .trim();

  const rawAiGap = (aiGaps && aiGaps[0]) || `Site lacks an /llms.txt directory manifest for AI search engine discovery`;
  const cleanAiGap = rawAiGap
    .replace(/\s*\(ChatGPT & Perplexity.*?\)/gi, '')
    .trim();

  // Define 4 Universal Diagnostic Pillars
  const pillars = [
    {
      id: 'speed',
      name: 'Mobile Speed',
      score: actualSpeed,
      headline: `Mobile Speed Lag (~${lcpSeconds} render delay)`,
      desc: `${cleanLag} (Google recommends under 1.8s for local mobile conversion).`,
    },
    {
      id: 'geo',
      name: 'AI Search Citability',
      score: actualGeo,
      headline: `AI Search Invisibility (ChatGPT, Perplexity & Google AI Overviews)`,
      desc: `${cleanAiGap}. When prospective clients ask AI engines for recommendations in your area, your site cannot be cited in direct answers.`,
    },
    {
      id: 'local',
      name: 'Local Entity Schema',
      score: actualLocal,
      headline: `Local Schema & Map Entity Gap (${actualLocal}/100)`,
      desc: `Missing Schema.org LocalBusiness JSON-LD markup and mobile 1-tap dial action, depriving Google Maps of verified business data and rich snippets.`,
    },
    {
      id: 'tech',
      name: 'Technical SEO',
      score: actualTech,
      headline: `Technical SEO & Indexing (${actualTech}/100)`,
      desc: `Meta viewport directives or OpenGraph social graph tags are incomplete, causing indexing friction on mobile search engines.`,
    },
  ];

  // Rank pillars from lowest score (worst) to highest score (best)
  pillars.sort((a, b) => a.score - b.score);

  const weakest = pillars.slice(0, 2);
  const strongest = pillars[pillars.length - 1];
  const hasStrongCompliment = strongest.score >= 75 && strongest.id !== weakest[0].id && strongest.id !== weakest[1].id;

  const introText = hasStrongCompliment
    ? `I was reviewing **${cleanBusiness}**'s web presence earlier today while researching top ${categoryContext}${locationContext}.\n\nWhile your ${strongest.name} foundation is strong (${strongest.score}/100), our 4-pillar technical diagnostic identified 2 high-priority friction points affecting your inbound inquiries:`
    : `I was reviewing **${cleanBusiness}**'s web presence earlier today while researching top ${categoryContext}${locationContext}.\n\nI ran a quick 4-pillar technical diagnostic on your website and identified 2 critical friction points affecting your inbound inquiries:`;

  const point1 = `**1. ${weakest[0].headline}:**\n${weakest[0].desc}`;
  const point2 = `**2. ${weakest[1].headline}:**\n${weakest[1].desc}`;

  // Subject line tailored to the top weakest area
  const topIssueLabel = weakest[0].name.toLowerCase();
  const subject = cleanOwner
    ? `Quick technical note for ${cleanOwner} on ${cleanBusiness}'s ${topIssueLabel} & conversion readiness`
    : `Technical diagnostic: ${cleanBusiness}'s ${topIssueLabel} & conversion readiness`;

  const body = `${greeting}

${introText}

${point1}

${point2}

Every 1-second delay on mobile and missing AI search citations directly reduces quote inquiries from local searchers.

📎 I put together a confidential **1-page Executive Diagnostic Report (PDF attached to this email)** breaking down your Core Web Vitals, AI Search readiness, and conversion UX scorecard.

I also outlined **3 quick fixes** your web developer can implement in under 15 minutes to resolve these gaps. Would it be alright if I sent those over?

Best,
Moses Martin
Technical Solutions Lead  |  SynergyTech Solutions
synergytechsol.com

PS: If you'd prefer not to hear from me, simply reply with "stop" and I'll remove you immediately.`;

  return { subject, body };
}

/**
 * Builds High-Converting Cold Email for Funnel B (No Website Found)
 */
export function buildFunnelBEmail(params) {
  const { ownerName, businessName, category, city, businessSlug, appBaseUrl } = params;

  const rawOwner = ownerName && ownerName !== 'Team' && !ownerName.toLowerCase().includes('leadership')
    ? ownerName.split(' ')[0]
    : null;

  const cleanOwner = rawOwner ? toTitleCase(rawOwner) : null;
  const cleanBusiness = toTitleCase(businessName || 'Your Business');

  const greeting = cleanOwner ? `Hi ${cleanOwner},` : `Hi there,`;
  const locationContext = city ? ` in ${toTitleCase(city)}` : 'in your area';
  const categoryContext = category || 'local services';

  const baseUrl = (appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://synergytechsol.com').replace(/\/$/, '');
  const demoUrl = `${baseUrl}/demo/${businessSlug}`;

  const subject = cleanOwner
    ? `${cleanOwner} - Live web prototype built for ${cleanBusiness}`
    : `Live web prototype built for ${cleanBusiness}`;

  const body = `${greeting}

I came across **${cleanBusiness}** on Google Maps while looking up top ${categoryContext.toLowerCase()} providers ${locationContext}.

You have great customer feedback, but I noticed you don't have an official fast-loading website linked to capture direct quotes and inquiries from mobile searchers.

To show you what's possible, our engineering team at SynergyTech Solutions built a live, mobile-first prototype specifically for **${cleanBusiness}**:

👉 **Live Prototype:** ${demoUrl}

**What we built for you:**
• **Loads in under 0.8 seconds** on any mobile device
• **Direct 1-tap quote and lead capture form**
• **Showcase for your 5-star customer reviews** and core services

If you like the prototype and want to make it your official live site, let me know and we can connect it to your custom domain this week.

Best,
Moses Martin
Technical Solutions Lead  |  SynergyTech Solutions
synergytechsol.com

PS: If you'd prefer not to hear from me, simply reply with "stop" and I'll remove you immediately.`;

  return { subject, body };
}

/**
 * Converts plain-text email body to an elegant, high-converting HTML layout with Georgia font & bold formatting
 */
export function formatPlainTextToGeorgiaHtml(bodyText) {
  const paragraphs = (bodyText || '').split(/\n\n+/);
  const htmlParagraphs = paragraphs
    .map((p) => {
      const lines = p
        .split('\n')
        .map((line) => {
          let formatted = line;

          // Format markdown bold **text**
          formatted = formatted.replace(
            /\*\*(.*?)\*\*/g,
            '<strong style="color: #0f172a; font-weight: 700;">$1</strong>'
          );

          // Format bullet points
          if (formatted.trim().startsWith('•')) {
            formatted = formatted.replace(
              /^(\s*•\s*)(.*)$/,
              '<span style="display: inline-block; width: 14px; color: #2563eb; font-weight: bold;">•</span>$2'
            );
          }

          // Linkify http/https URLs with clean styling
          formatted = formatted.replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a href="$1" style="color: #2563eb; text-decoration: underline; font-weight: 600;">$1</a>'
          );

          return formatted;
        })
        .join('<br>');

      return `<p style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 16.5px; line-height: 1.7; color: #1e293b;">${lines}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, p, div, span, a, td, li, strong {
      font-family: Georgia, 'Times New Roman', Times, serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 18px 0; background-color: #ffffff; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 16.5px; line-height: 1.7; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; padding: 0 16px; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 16.5px; line-height: 1.7; color: #1e293b;">
    ${htmlParagraphs}
  </div>
</body>
</html>`;
}


/**
 * Creates Nodemailer transporter for Google Workspace / custom SMTP
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  if (pass) {
    pass = pass.replace(/^["']|["']$/g, '');
  }

  if (!user || !pass || pass === 'your-google-app-password') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Safely dispatches the cold email with optional attachments
 */
export async function sendColdEmail(params) {
  const { to, subject, body, attachments } = params;
  const user = process.env.SMTP_USER || 'mosesmartin@synergytechsol.com';
  let from = process.env.EMAIL_FROM;

  // Ensure from is never malformed or has empty < >
  if (!from || !from.includes('@') || from.includes('< >') || from.includes('<>')) {
    from = `"Moses Martin" <${user}>`;
  } else {
    from = from.replace(/^["']|["']$/g, '');
  }


  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[SMTP SIMULATED] Recipient: ${to} | Subject: ${subject} | Attachments: ${attachments?.length || 0}`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const mailOptions = {
      from,
      to,
      subject,
      text: body,
      html: formatPlainTextToGeorgiaHtml(body),
      replyTo: process.env.SMTP_USER || 'mosesmartin@synergytechsol.com',
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error('Error sending cold email via Nodemailer:', error);
    return {
      success: false,
      error: error?.message || 'SMTP dispatch failed',
    };
  }
}
