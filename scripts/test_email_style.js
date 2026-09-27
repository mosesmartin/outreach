const fs = require('fs');
const path = require('path');
const { formatPlainTextToGeorgiaHtml, buildFunnelAEmail, buildFunnelBEmail } = require('../lib/email');

console.log('Testing Email Formatting & Georgia Large Typography...');

const sampleEmail = buildFunnelAEmail({
  ownerName: 'Marcus Vance',
  businessName: 'Apex Austin Plumbing',
  speedScore: 42,
  lcpSeconds: '4.2s',
  pageSizeMb: '3.8',
  seoScore: 45,
  schemaScore: 40,
  conversionScore: 40,
  seoIssues: ['Missing Schema.org LocalBusiness JSON-LD'],
  lagBottlenecks: ['Uncompressed image assets delaying mobile Largest Contentful Paint'],
  aiGaps: ['Missing /llms.txt manifest for ChatGPT & Perplexity discovery'],
  geminiHook: 'Every 1-second delay on mobile reduces inquiries by 7%.',
  city: 'Austin, TX',
  category: 'Plumbing Services'
});

const html = formatPlainTextToGeorgiaHtml(sampleEmail.body);

if (html.includes("Georgia, 'Times New Roman'") && html.includes('17px')) {
  console.log('✅ Email HTML successfully generated with Georgia font and 17px Large typography!');
} else {
  console.log('❌ Email HTML missing Georgia or 17px font style');
}
