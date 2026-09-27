import { executeDualAudit } from '../lib/audit.js';
import { generateAuditPdf } from '../lib/reportPdf.js';
import fs from 'fs';
import path from 'path';

async function testAudit() {
  console.log('Testing 4-Pillar Universal Audit Engine on synergytechsol.com...');
  const audit = await executeDualAudit('https://synergytechsol.com');

  console.log('\n--- 4-PILLAR AUDIT SCORES ---');
  console.log('1. Google Speed Score:', audit.speedScore, '/ 100 (LCP:', audit.lcpSeconds, ')');
  console.log('2. Technical Score:', audit.technicalScore, '/ 100');
  console.log('3. AI Citability (GEO) Score:', audit.geoScore, '/ 100 (llms.txt:', audit.hasLlmsTxt, ')');
  console.log('4. Local Schema Score:', audit.localSchemaScore, '/ 100 (Local Schema:', audit.hasLocalSchema, ')');
  console.log('Composite SEO Score:', audit.seoScore, '/ 100');

  console.log('\n--- DIAGNOSTIC FINDINGS ---');
  console.log('Issues found:', audit.seoIssues.length);
  audit.seoIssues.forEach((iss, i) => console.log(`  [${i+1}] ${iss}`));

  console.log('\n--- ACTIONABLE QUICK FIXES ---');
  audit.actionableFixes.forEach((fix, i) => console.log(`  [${i+1}] ${fix}`));

  console.log('\nTesting 4-Pillar PDF Generation...');
  const pdfBuffer = await generateAuditPdf({
    businessName: 'SynergyTech Enterprise Test',
    websiteUrl: 'https://synergytechsol.com',
    speedScore: audit.speedScore,
    lcpSeconds: audit.lcpSeconds,
    pageSizeMb: audit.pageSizeMb,
    technicalScore: audit.technicalScore,
    geoScore: audit.geoScore,
    localSchemaScore: audit.localSchemaScore,
    seoScore: audit.seoScore,
    seoIssues: audit.seoIssues,
    actionableFixes: audit.actionableFixes,
    geminiHook: 'Your site loads in 0.8s, but adding structured LocalBusiness JSON-LD will unlock Google 5-star rich snippets.',
    ownerName: 'Leadership Team'
  });

  console.log('PDF generated successfully! Buffer size:', pdfBuffer.length, 'bytes');

  const testPdfPath = path.join(process.cwd(), 'data', 'test_4pillar_audit.pdf');
  fs.writeFileSync(testPdfPath, pdfBuffer);
  console.log('Saved test PDF to:', testPdfPath);
}

testAudit().catch(err => {
  console.error('Audit test failed:', err);
  process.exit(1);
});
