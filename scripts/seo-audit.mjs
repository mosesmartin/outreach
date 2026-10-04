#!/usr/bin/env node

/**
 * Universal SEO & AI Search (GEO) CLI Runner
 * Usage: node scripts/seo-audit.mjs <url> [businessName]
 * Example: node scripts/seo-audit.mjs https://synergytechsol.com "SynergyTech Solutions"
 */

import { executeDualAudit } from '../lib/audit.js';
import { generateAuditPdf } from '../lib/reportPdf.js';
import { generateFunnelAHook } from '../lib/gemini.js';
import fs from 'fs';
import path from 'path';

const targetUrl = process.argv[2] || 'https://synergytechsol.com';
const businessName = process.argv[3] || 'Target Business';

console.log(`\n🔍 [Universal SEO & GEO Audit] Scanning: ${targetUrl} (${businessName})...\n`);

async function run() {
  const startTime = Date.now();
  const audit = await executeDualAudit(targetUrl);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('═'.repeat(65));
  console.log(`  🏛️ 4-PILLAR UNIVERSAL SEO & GEO AUDIT REPORT (${elapsed}s)`);
  console.log('═'.repeat(65));

  console.log('\n📊 BENCHMARK SCORECARDS (0 - 100):');
  console.log(`  1. Mobile Speed (Core Web Vitals): ${audit.speedScore}/100  (LCP: ${audit.lcpSeconds}, Weight: ${audit.pageSizeMb}MB)`);
  console.log(`  2. Technical SEO & Indexability:   ${audit.technicalScore}/100  (HTTPS: ${audit.hasHttps}, OpenGraph: ${audit.hasOpenGraph})`);
  console.log(`  3. AI Citability (GEO / ChatGPT):  ${audit.geoScore}/100  (/llms.txt: ${audit.hasLlmsTxt}, FAQ Q&A: ${audit.hasFaqStructure})`);
  console.log(`  4. Local Schema & Map Pack Entity: ${audit.localSchemaScore}/100  (LocalBusiness: ${audit.hasLocalSchema}, 1-Tap Call: ${audit.hasClickToCall})`);
  console.log(`  ⭐ 4-Pillar Composite Benchmark:   ${audit.compositeScore}/100  (${audit.compositeScore < 50 ? '🔴 QUALIFIED (<50)' : '🟢 PASSED BENCHMARK (>=50)'})`);


  console.log('\n⚠️ DIAGNOSTIC FINDINGS & GAPS:');
  if (audit.seoIssues && audit.seoIssues.length > 0) {
    audit.seoIssues.forEach((issue, idx) => {
      console.log(`  [${idx + 1}] ${issue}`);
    });
  } else {
    console.log('  ✅ No critical bottlenecks discovered.');
  }

  console.log('\n🛠️ TOP 3 HIGH-IMPACT DEVELOPER FIXES:');
  if (audit.actionableFixes && audit.actionableFixes.length > 0) {
    audit.actionableFixes.forEach((fix, idx) => {
      console.log(`  [0${idx + 1}] ${fix}`);
    });
  }

  const topIssue = (audit.seoIssues && audit.seoIssues[0]) || '';
  const geminiHook = await generateFunnelAHook({
    businessName,
    speedScore: audit.speedScore,
    technicalScore: audit.technicalScore,
    geoScore: audit.geoScore,
    localSchemaScore: audit.localSchemaScore,
    seoScore: audit.seoScore,
    schemaScore: audit.localSchemaScore,
    lcpSeconds: audit.lcpSeconds,
    topIssue,
  });

  console.log('\n📧 AI COLD OUTREACH TEARDOWN HOOK:');
  console.log(`  "${geminiHook}"`);

  console.log('\n📄 Compiling 4-Pillar Executive PDF Dossier...');
  try {
    const pdfBuffer = await generateAuditPdf({
      businessName,
      websiteUrl: targetUrl,
      speedScore: audit.speedScore,
      lcpSeconds: audit.lcpSeconds,
      clsValue: audit.clsValue,
      pageSizeMb: audit.pageSizeMb,
      technicalScore: audit.technicalScore,
      geoScore: audit.geoScore,
      localSchemaScore: audit.localSchemaScore,
      seoScore: audit.seoScore,
      schemaScore: audit.localSchemaScore,
      conversionScore: audit.localSchemaScore,
      seoIssues: audit.seoIssues,
      actionableFixes: audit.actionableFixes,
      geminiHook,
      ownerName: 'Executive Leadership',
    });

    const outputFilename = `audit_${businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
    const outputPath = path.join(process.cwd(), 'data', outputFilename);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`  ✅ PDF saved successfully to: ${outputPath} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (pdfErr) {
    console.warn('  ⚠️ PDF compilation notice:', pdfErr.message);
  }

  console.log('\n' + '═'.repeat(65) + '\n');
}

run().catch(err => {
  console.error('\n❌ Audit execution failed:', err.message);
  process.exit(1);
});
