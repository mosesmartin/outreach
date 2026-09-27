import nodemailer from 'nodemailer';

/**
 * Builds High-Converting Cold Email for Funnel A (Website Exists)
 */
export function buildFunnelAEmail(params) {
  const {
    ownerName,
    businessName,
    speedScore,
    lcpSeconds,
    pageSizeMb,
    seoScore,
    schemaScore,
    conversionScore,
    seoIssues,
    lagBottlenecks,
    aiGaps,
    geminiHook,
    city,
    category,
  } = params;

  const cleanOwner = ownerName && ownerName !== 'Team' && !ownerName.toLowerCase().includes('leadership')
    ? ownerName.split(' ')[0]
    : null;

  const greeting = cleanOwner ? `Hi ${cleanOwner},` : `Hi there,`;
  const locationContext = city ? ` in ${city}` : '';
  const categoryContext = category ? `${category.toLowerCase()} providers` : 'local businesses';

  const lagCause = (lagBottlenecks && lagBottlenecks[0]) || (seoIssues && seoIssues[0]) || `Mobile render takes ${lcpSeconds}`;
  const aiGap = (aiGaps && aiGaps[0]) || `Site lacks an /llms.txt directory manifest for AI search engine discovery`;

  const subject = cleanOwner
    ? `Quick technical note for ${cleanOwner} on ${businessName}'s mobile speed & AI search readiness`
    : `Technical diagnostic: ${businessName}'s mobile speed & AI search visibility`;

  const body = `${greeting}

I was reviewing ${businessName}'s web presence earlier today while researching top ${categoryContext}${locationContext}.

I ran a quick 4-pillar technical diagnostic on your website and noticed 2 critical friction points affecting your inquiries:

1. Mobile Speed Lag (~${lcpSeconds} render delay):
   ${lagCause} (Google recommends under 1.8s for local service conversion).

2. AI Search Invisibility (ChatGPT, Perplexity & Google AI Overviews):
   ${aiGap}. When prospective clients ask AI engines for recommendations in your area, your site cannot be cited in direct answers.

${geminiHook || `Every 1-second delay on mobile typically reduces customer conversion rates by 7%, while AI search engines are rapidly becoming the primary way clients discover local services.`}

📎 I put together a confidential 1-page Executive Diagnostic Report (PDF attached to this email) breaking down your Core Web Vitals, AI Search readiness, and conversion UX scorecard.

I also outlined 3 quick fixes your web developer can implement in under 15 minutes to resolve the lag and unlock AI search indexing. Would it be alright if I sent those over?

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

  const cleanOwner = ownerName && ownerName !== 'Team' && !ownerName.toLowerCase().includes('leadership')
    ? ownerName.split(' ')[0]
    : null;

  const greeting = cleanOwner ? `Hi ${cleanOwner},` : `Hi there,`;
  const locationContext = city ? ` in ${city}` : 'in your area';
  const categoryContext = category || 'local services';

  const baseUrl = (appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://synergytechsol.com').replace(/\/$/, '');
  const demoUrl = `${baseUrl}/demo/${businessSlug}`;

  const subject = cleanOwner
    ? `${cleanOwner} - Live web prototype built for ${businessName}`
    : `Live web prototype built for ${businessName}`;

  const body = `${greeting}

I came across ${businessName} on Google Maps while looking up top ${categoryContext.toLowerCase()} providers ${locationContext}.

You have great customer feedback, but I noticed you don't have an official fast-loading website linked to capture direct quotes and inquiries from mobile searchers.

To show you what's possible, our engineering team at SynergyTech Solutions built a live, mobile-first prototype specifically for ${businessName}:

👉 Live Prototype: ${demoUrl}

What we built for you:
• Loads in under 0.8 seconds on any mobile device
• Direct 1-tap quote and lead capture form
• Showcase for your 5-star customer reviews and core services

If you like the prototype and want to make it your official live site, let me know and we can connect it to your custom domain this week.

Best,
Moses Martin
Technical Solutions Lead  |  SynergyTech Solutions
synergytechsol.com

PS: If you'd prefer not to hear from me, simply reply with "stop" and I'll remove you immediately.`;

  return { subject, body };
}

/**
 * Converts plain-text email body to an elegant, high-converting HTML layout with Georgia Large font
 */
export function formatPlainTextToGeorgiaHtml(bodyText) {
  const paragraphs = (bodyText || '').split(/\n\n+/);
  const htmlParagraphs = paragraphs
    .map((p) => {
      const lines = p
        .split('\n')
        .map((line) => {
          // Linkify http/https URLs with clean styling
          return line.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" style="color: #2563eb; text-decoration: underline; font-weight: 500;">$1</a>'
          );
        })
        .join('<br>');
      return `<p style="margin: 0 0 16px 0; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 17px; line-height: 1.65; color: #1e293b;">${lines}</p>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body, p, div, span, a, td, li {
      font-family: Georgia, 'Times New Roman', Times, serif !important;
      font-size: 17px !important;
      line-height: 1.65 !important;
      color: #1e293b !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 16px 0; background-color: #ffffff; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 17px; line-height: 1.65; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; padding: 0 14px; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 17px; line-height: 1.65; color: #1e293b;">
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
