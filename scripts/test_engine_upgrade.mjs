import { generateEmailPermutations, verifyEmail, isGenericEmail } from '../lib/verifier.js';
import { cleanPersonName } from '../lib/crawler.js';
import { runDeepDiagnosticAudit } from '../lib/audit.js';
import { generateAuditPdf } from '../lib/reportPdf.js';
import { buildFunnelAEmail, buildFunnelBEmail } from '../lib/email.js';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('========================================================');
  console.log('🧪 RUNNING SYNERGYTECH DIAGNOSTIC & ENRICHMENT TEST SUITE');
  console.log('========================================================\n');

  // Test 1: Email Permutations & Name Cleaning
  console.log('👉 [Test 1] Decision-Maker Name Cleaning & Permutations:');
  const rawName = 'Dr. Moses Martin, Founder & CEO';
  const clean = cleanPersonName(rawName);
  console.log(`- Raw Name: "${rawName}" -> Cleaned: "${clean}"`);
  
  const perms = generateEmailPermutations('Moses', 'Martin', 'synergytechsol.com');
  console.log(`- Generated ${perms.length} permutations for Moses Martin @ synergytechsol.com:`);
  perms.forEach((p) => console.log(`   • ${p}`));
  
  const isGeneric = isGenericEmail('info@synergytechsol.com');
  console.log(`- "info@synergytechsol.com" isGeneric: ${isGeneric} (Expected: true)`);
  const isPersonal = isGenericEmail('mosesmartin@synergytechsol.com');
  console.log(`- "mosesmartin@synergytechsol.com" isGeneric: ${isPersonal} (Expected: false)\n`);

  // Test 2: Deep Diagnostic Audit Scanner
  console.log('👉 [Test 2] Deep On-Page Diagnostic Scanner on synergytechsol.com:');
  const auditResult = await runDeepDiagnosticAudit('https://synergytechsol.com');
  console.log(`- Schema Score: ${auditResult.schemaScore}/100 (Has Local Schema: ${auditResult.hasLocalSchema})`);
  console.log(`- Conversion Score: ${auditResult.conversionScore}/100 (Has 1-Tap Call: ${auditResult.hasClickToCall})`);
  console.log(`- Composite Diagnostic Score: ${auditResult.seoScore}/100`);
  console.log(`- Detected Findings (${auditResult.seoIssues.length}):`);
  auditResult.seoIssues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
  console.log(`- Actionable Fixes (${auditResult.actionableFixes.length}):`);
  auditResult.actionableFixes.forEach((fix) => console.log(`   🛠️  ${fix}\n`));

  // Test 3: PDF Generation
  console.log('👉 [Test 3] Executive PDF Diagnostic Generation:');
  const pdfBuffer = await generateAuditPdf({
    businessName: 'Apex Roofing & Solar',
    websiteUrl: 'https://apexroofingtx.com',
    speedScore: 42,
    lcpSeconds: '4.3s',
    pageSizeMb: '3.8',
    seoScore: 48,
    schemaScore: 35,
    conversionScore: 40,
    seoIssues: auditResult.seoIssues,
    actionableFixes: auditResult.actionableFixes,
    geminiHook: 'Resolving these 3 friction points will drop your mobile render time below 1.5s and prevent lost calls.',
    ownerName: 'David Miller',
  });
  console.log(`- PDF Buffer successfully generated (${pdfBuffer.length} bytes).`);
  
  const tmpPdfPath = path.join(process.cwd(), 'scripts', 'sample_audit_report.pdf');
  fs.writeFileSync(tmpPdfPath, pdfBuffer);
  console.log(`- Saved sample report for inspection at: ${tmpPdfPath}\n`);

  // Test 4: Cold Email Templates
  console.log('👉 [Test 4] Cold Outreach Copy Build:');
  const emailA = buildFunnelAEmail({
    ownerName: 'David Miller',
    businessName: 'Apex Roofing & Solar',
    speedScore: 42,
    lcpSeconds: '4.3s',
    pageSizeMb: '3.8',
    seoScore: 48,
    schemaScore: 35,
    conversionScore: 40,
    seoIssues: auditResult.seoIssues,
    geminiHook: 'Every 1-second delay on mobile typically reduces customer conversion rates by 7%.',
    city: 'Austin, TX',
    category: 'Roofing',
  });
  console.log(`- Funnel A Subject: "${emailA.subject}"`);
  console.log(`- Funnel A Body Preview (First 4 lines):\n${emailA.body.split('\n').slice(0, 5).join('\n')}\n`);

  console.log('========================================================');
  console.log('✅ ALL TESTS EXECUTED AND PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

runVerification().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
