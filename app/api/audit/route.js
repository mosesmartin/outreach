import { NextResponse } from 'next/server';
import { executeDualAudit } from '@/lib/audit.js';
import { generateAuditPdf } from '@/lib/reportPdf.js';
import { generateFunnelAHook } from '@/lib/gemini.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/audit
 * Runs a live 4-Pillar Universal SEO & AI Citability (GEO) Audit on any target URL
 * Body: { url: string, businessName?: string }
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = (body.url || '').trim();
    const businessName = (body.businessName || '').trim() || 'Target Web Property';

    if (!targetUrl || targetUrl.length < 4) {
      return NextResponse.json(
        { error: 'Please provide a valid website URL to audit (e.g. https://example.com)' },
        { status: 400 }
      );
    }

    // Run the 4-Pillar Unified Audit
    const audit = await executeDualAudit(targetUrl);

    // Generate AI hook
    const topIssue = (audit.seoIssues && audit.seoIssues[0]) || 'Mobile render latency and missing LocalBusiness schema';
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

    // Generate PDF report in memory
    let pdfBase64 = null;
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
        ownerName: 'Executive Team',
      });
      pdfBase64 = pdfBuffer.toString('base64');
    } catch (pdfErr) {
      console.warn('PDF generation in /api/audit warning:', pdfErr.message);
    }

    return NextResponse.json({
      success: true,
      url: targetUrl,
      businessName,
      scores: {
        speedScore: audit.speedScore,
        technicalScore: audit.technicalScore,
        geoScore: audit.geoScore,
        localSchemaScore: audit.localSchemaScore,
        compositeSeoScore: audit.seoScore,
      },
      metrics: {
        lcpSeconds: audit.lcpSeconds,
        clsValue: audit.clsValue,
        pageSizeMb: audit.pageSizeMb,
        hasLocalSchema: audit.hasLocalSchema,
        hasClickToCall: audit.hasClickToCall,
        hasForm: audit.hasForm,
        hasOpenGraph: audit.hasOpenGraph,
        hasLlmsTxt: audit.hasLlmsTxt,
        hasFaqStructure: audit.hasFaqStructure,
        hasHttps: audit.hasHttps,
      },
      issues: audit.seoIssues,
      actionableFixes: audit.actionableFixes,
      geminiHook,
      pdfBase64,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API /api/audit execution error:', error);
    return NextResponse.json(
      { error: `Audit execution failed: ${error.message}` },
      { status: 500 }
    );
  }
}
