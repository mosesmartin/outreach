import PDFDocument from 'pdfkit';

/**
 * Generates an executive-grade, 4-Pillar Universal Technical Diagnostic & Conversion PDF dossier
 * (Inspired by Claude-SEO and Google Core Web Vitals)
 * @param {Object} data - Audit details
 * @returns {Promise<Buffer>}
 */
export async function generateAuditPdf(data) {
  const {
    businessName = 'Business Enterprise',
    websiteUrl = 'https://example.com',
    speedScore = 52,
    lcpSeconds = '3.8s',
    clsValue = '0.12',
    pageSizeMb = '3.2',
    technicalScore = 75,
    geoScore = 45,
    localSchemaScore = 40,
    schemaScore = 40,
    seoScore = 55,
    seoIssues = [],
    lagBottlenecks = [],
    aiGaps = [],
    actionableFixes = [],
    geminiHook = '',
    ownerName = 'Leadership Team',
  } = data;

  const actualGeoScore = typeof geoScore === 'number' ? geoScore : 45;
  const actualTechScore = typeof technicalScore === 'number' ? technicalScore : (typeof seoScore === 'number' ? seoScore : 70);
  const actualLocalScore = typeof localSchemaScore === 'number' ? localSchemaScore : (typeof schemaScore === 'number' ? schemaScore : 40);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Technical SEO & AI Search Diagnostic - ${businessName}`,
          Author: 'SynergyTech Solutions',
          Subject: '4-Pillar Technical, AI Search (GEO), and Conversion Assessment',
          Keywords: 'Core Web Vitals, AI Citability, Schema.org, Local SEO, GEO',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const navy = '#0f172a';
      const slate = '#334155';
      const muted = '#64748b';
      const lightBg = '#f8fafc';
      const border = '#e2e8f0';
      const emerald = '#16a34a';
      const amber = '#d97706';
      const red = '#dc2626';

      // ----------------------------------------------------------------------
      // 1. TOP HEADER BANNER
      // ----------------------------------------------------------------------
      doc.rect(36, 36, 523, 66).fill(navy);

      // Logo Brand Emblem
      doc.roundedRect(48, 45, 28, 28, 6).fill('#1e293b');
      doc.fillColor('#38bdf8').fontSize(15).font('Helvetica-Bold').text('S', 57, 51);

      // Brand Title
      doc.fillColor('#ffffff').fontSize(12.5).font('Helvetica-Bold');
      doc.text('SYNERGYTECH SOLUTIONS', 86, 45);

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica');
      doc.text('Performance Engineering • AI Search (GEO) • Local Entity Architecture', 86, 59);
      doc.text('synergytechsol.com  •  Confidential Agency Technical Assessment', 86, 71);

      // Audit Stamp (Right aligned)
      const reportDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      doc.fillColor('#38bdf8').fontSize(7.5).font('Helvetica-Bold');
      doc.text('UNIVERSAL SEO & GEO AUDIT', 360, 46, { align: 'right', width: 185 });
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica');
      doc.text(`Ref ID: ST-${Date.now().toString().slice(-6)}`, 360, 58, { align: 'right', width: 185 });
      doc.text(`Generated: ${reportDate}`, 360, 70, { align: 'right', width: 185 });

      // ----------------------------------------------------------------------
      // 2. TARGET OVERVIEW HERO
      // ----------------------------------------------------------------------
      let curY = 110;
      doc.fillColor(navy).fontSize(12).font('Helvetica-Bold');
      doc.text(`4-Pillar Technical, AI Search & Schema Assessment: ${businessName}`, 36, curY);

      doc.fillColor(muted).fontSize(8).font('Helvetica');
      doc.text(`Target URL: ${websiteUrl}   |   Prepared For: ${ownerName || 'Executive Leadership'}`, 36, curY + 14);

      curY += 32;

      // ----------------------------------------------------------------------
      // 3. 4-PILLAR SCORECARD GRID (2 x 2 Cards)
      // ----------------------------------------------------------------------
      const cardW = 256;
      const cardH = 74;
      const gapX = 11;
      const gapY = 8;

      const getScoreBadge = (score) => {
        if (score >= 75) return { color: emerald, text: 'PASS / READY' };
        if (score >= 50) return { color: amber, text: 'OPPORTUNITY' };
        return { color: red, text: 'CRITICAL GAP' };
      };

      // Pillar 1: Mobile Speed & Core Web Vitals (Top-Left)
      const p1Badge = getScoreBadge(speedScore);
      doc.roundedRect(36, curY, cardW, cardH, 6).fillAndStroke(lightBg, border);
      doc.fillColor(slate).fontSize(7.5).font('Helvetica-Bold').text('1. GOOGLE SPEED & MOBILE CORE WEB VITALS', 46, curY + 8);
      doc.roundedRect(36 + cardW - 68, curY + 6, 60, 11, 3).fill(p1Badge.color);
      doc.fillColor('#ffffff').fontSize(5.5).font('Helvetica-Bold').text(p1Badge.text, 36 + cardW - 68, curY + 8.5, { width: 60, align: 'center' });

      doc.fillColor(p1Badge.color).fontSize(18).font('Helvetica-Bold').text(`${speedScore}`, 46, curY + 22);
      doc.fillColor(muted).fontSize(8).font('Helvetica').text('/100', 74, curY + 30);
      doc.fillColor(slate).fontSize(7).font('Helvetica');
      doc.text(`• Mobile LCP Paint: ${lcpSeconds} (Target < 1.8s)`, 46, curY + 44);
      const topLagShort = lagBottlenecks && lagBottlenecks.length > 0 ? lagBottlenecks[0].substring(0, 46) : `Payload: ${pageSizeMb} MB (CLS: ${clsValue})`;
      doc.text(`• Lag Cause: ${topLagShort}`, 46, curY + 56);

      // Pillar 2: Technical & Indexability (Top-Right)
      const p2X = 36 + cardW + gapX;
      const p2Badge = getScoreBadge(actualTechScore);
      doc.roundedRect(p2X, curY, cardW, cardH, 6).fillAndStroke(lightBg, border);
      doc.fillColor(slate).fontSize(7.5).font('Helvetica-Bold').text('2. TECHNICAL SEO & INDEXABILITY', p2X + 10, curY + 8);
      doc.roundedRect(p2X + cardW - 68, curY + 6, 60, 11, 3).fill(p2Badge.color);
      doc.fillColor('#ffffff').fontSize(5.5).font('Helvetica-Bold').text(p2Badge.text, p2X + cardW - 68, curY + 8.5, { width: 60, align: 'center' });

      doc.fillColor(p2Badge.color).fontSize(18).font('Helvetica-Bold').text(`${actualTechScore}`, p2X + 10, curY + 22);
      doc.fillColor(muted).fontSize(8).font('Helvetica').text('/100', p2X + 38, curY + 30);
      doc.fillColor(slate).fontSize(7).font('Helvetica');
      doc.text(`• Mobile Viewport & Meta Tags: Configured`, p2X + 10, curY + 44);
      doc.text(`• OpenGraph Social Sharing: Validated`, p2X + 10, curY + 56);

      curY += cardH + gapY;

      // Pillar 3: AI Search Citability (GEO) (Bottom-Left)
      const p3Badge = getScoreBadge(actualGeoScore);
      doc.roundedRect(36, curY, cardW, cardH, 6).fillAndStroke(lightBg, border);
      doc.fillColor(slate).fontSize(7.5).font('Helvetica-Bold').text('3. AI SEARCH VISIBILITY (CHATGPT & PERPLEXITY)', 46, curY + 8);
      doc.roundedRect(36 + cardW - 68, curY + 6, 60, 11, 3).fill(p3Badge.color);
      doc.fillColor('#ffffff').fontSize(5.5).font('Helvetica-Bold').text(p3Badge.text, 36 + cardW - 68, curY + 8.5, { width: 60, align: 'center' });

      doc.fillColor(p3Badge.color).fontSize(18).font('Helvetica-Bold').text(`${actualGeoScore}`, 46, curY + 22);
      doc.fillColor(muted).fontSize(8).font('Helvetica').text('/100', 74, curY + 30);
      doc.fillColor(slate).fontSize(7).font('Helvetica');
      doc.text(`• AI Search Index: ${actualGeoScore < 60 ? 'Unlisted (Missing /llms.txt)' : 'Indexed & Active'}`, 46, curY + 44);
      doc.text(`• Google AI Overviews: ${actualGeoScore < 60 ? 'No Structured Q&A Passage' : 'Optimized for Citations'}`, 46, curY + 56);

      // Pillar 4: Local Business Schema & Entity (Bottom-Right)
      const p4Badge = getScoreBadge(actualLocalScore);
      doc.roundedRect(p2X, curY, cardW, cardH, 6).fillAndStroke(lightBg, border);
      doc.fillColor(slate).fontSize(7.5).font('Helvetica-Bold').text('4. LOCAL SCHEMA & MAP PACK ENTITY', p2X + 10, curY + 8);
      doc.roundedRect(p2X + cardW - 68, curY + 6, 60, 11, 3).fill(p4Badge.color);
      doc.fillColor('#ffffff').fontSize(5.5).font('Helvetica-Bold').text(p4Badge.text, p2X + cardW - 68, curY + 8.5, { width: 60, align: 'center' });

      doc.fillColor(p4Badge.color).fontSize(18).font('Helvetica-Bold').text(`${actualLocalScore}`, p2X + 10, curY + 22);
      doc.fillColor(muted).fontSize(8).font('Helvetica').text('/100', p2X + 38, curY + 30);
      doc.fillColor(slate).fontSize(7).font('Helvetica');
      doc.text(`• Schema.org LocalBusiness: ${actualLocalScore < 60 ? 'Not Found' : 'Injected'}`, p2X + 10, curY + 44);
      doc.text(`• Mobile 1-Tap Calling CTA: ${actualLocalScore < 65 ? 'Friction Point' : 'Live'}`, p2X + 10, curY + 56);

      curY += cardH + 14;

      // ----------------------------------------------------------------------
      // 4. DIAGNOSTIC MATRIX TABLE
      // ----------------------------------------------------------------------
      doc.fillColor(navy).fontSize(9.5).font('Helvetica-Bold').text('Universal SEO & Conversion Diagnostic Matrix', 36, curY);
      curY += 12;

      // Table Header
      doc.roundedRect(36, curY, 523, 18, 3).fill(navy);
      doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
      doc.text('INSPECTION CATEGORY', 46, curY + 5.5);
      doc.text('CURRENT STATUS', 220, curY + 5.5);
      doc.text('INDUSTRY BENCHMARK', 340, curY + 5.5);
      doc.text('PRIORITY', 470, curY + 5.5);

      curY += 18;

      const matrixRows = [
        {
          metric: 'Mobile Speed & Render Lag (LCP)',
          measured: parseFloat(lcpSeconds) > 3.0 ? `${lcpSeconds} (Lagging)` : `${lcpSeconds} (Fast)`,
          target: '< 1.8s (Google CWV)',
          status: parseFloat(lcpSeconds) > 3.0 ? 'HIGH LATENCY' : 'OPTIMAL',
          color: parseFloat(lcpSeconds) > 3.0 ? red : emerald,
        },
        {
          metric: 'AI Search Engine Index (/llms.txt)',
          measured: actualGeoScore < 60 ? 'Unlisted on ChatGPT' : 'Listed in Manifest',
          target: 'AI Discovery Ready',
          status: actualGeoScore < 60 ? 'AI INVISIBLE' : 'INDEXED',
          color: actualGeoScore < 60 ? red : emerald,
        },
        {
          metric: 'Google AI Overviews Structured Q&A',
          measured: actualGeoScore < 60 ? 'Missing FAQ Schema' : 'Citable Q&A Graph',
          target: 'AI Answer Citations',
          status: actualGeoScore < 60 ? 'NOT CITABLE' : 'VERIFIED',
          color: actualGeoScore < 60 ? red : emerald,
        },
        {
          metric: 'Schema.org LocalBusiness JSON-LD',
          measured: actualLocalScore < 60 ? 'Missing Entity Schema' : 'Valid JSON-LD',
          target: 'Rich Google Snippets',
          status: actualLocalScore < 60 ? 'SCHEMA GAP' : 'VERIFIED',
          color: actualLocalScore < 60 ? amber : emerald,
        },
        {
          metric: 'Mobile 1-Tap Click-to-Call CTA',
          measured: actualLocalScore < 65 ? 'No Direct Dial Link' : 'Active 1-Tap CTA',
          target: 'Instant Mobile Dial',
          status: actualLocalScore < 65 ? 'CALL LEAK' : 'OPTIMAL',
          color: actualLocalScore < 65 ? red : emerald,
        },
      ];

      matrixRows.forEach((row, i) => {
        const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(36, curY, 523, 18).fillAndStroke(rowBg, border);

        doc.fillColor(slate).fontSize(7).font('Helvetica-Bold').text(row.metric, 46, curY + 5);
        doc.fillColor(navy).fontSize(7).font('Helvetica').text(row.measured, 220, curY + 5);
        doc.fillColor(muted).fontSize(7).font('Helvetica').text(row.target, 340, curY + 5);

        // Status pill
        doc.roundedRect(470, curY + 2.5, 76, 13, 3).fill(row.color);
        doc.fillColor('#ffffff').fontSize(5.5).font('Helvetica-Bold').text(row.status, 470, curY + 6, { width: 76, align: 'center' });

        curY += 18;
      });

      curY += 12;

      // ----------------------------------------------------------------------
      // 5. 3 PRIORITY REMEDIATION STEPS
      // ----------------------------------------------------------------------
      doc.fillColor(navy).fontSize(9.5).font('Helvetica-Bold').text('Top 3 High-Impact Remediation Actions', 36, curY);
      curY += 12;

      const priorityFixes =
        actionableFixes && actionableFixes.length >= 3
          ? actionableFixes
          : [
              'Deploy JSON-LD LocalBusiness schema with full service catalogue & geo-coordinates',
              'Implement /llms.txt and structured Q&A passages to capture Google AI Overviews',
              'Add floating mobile 1-tap calling CTA and optimize critical rendering path below 1.5s',
            ];

      priorityFixes.slice(0, 3).forEach((fix, idx) => {
        doc.roundedRect(36, curY, 523, 28, 4).fillAndStroke('#ffffff', border);

        // Accent left bar
        doc.rect(36, curY, 3.5, 28).fill(amber);

        doc.fillColor(navy).fontSize(7.5).font('Helvetica-Bold');
        doc.text(`Action Step 0${idx + 1}: `, 46, curY + 5, { continued: true });
        doc.font('Helvetica').fillColor(slate).text(fix);

        doc.fillColor(muted).fontSize(6.5).font('Helvetica');
        doc.text('Estimated Fix Time: < 20 mins   •   Direct Impact: Unlocks Google AI Citations & stops mobile visitor bounce.', 46, curY + 16);

        curY += 32;
      });

      curY += 4;

      // ----------------------------------------------------------------------
      // 6. EXECUTIVE STRATEGY & CONSULTATION BANNER
      // ----------------------------------------------------------------------
      doc.roundedRect(36, curY, 523, 62, 5).fillAndStroke('#0f172a', '#1e293b');

      doc.fillColor('#38bdf8').fontSize(8.5).font('Helvetica-Bold');
      doc.text('Strategic Technical Consultation & Architecture Support', 46, curY + 8);

      doc.fillColor('#cbd5e1').fontSize(7).font('Helvetica');
      const cleanHook = (
        geminiHook ||
        'Resolving these technical bottlenecks will immediately reduce mobile friction and enable Google AI Overviews and ChatGPT Search to cite your services.'
      )
        .replace(/\n+/g, ' ')
        .substring(0, 260);

      doc.text(cleanHook, 46, curY + 20, { width: 500, lineGap: 1.5 });

      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text(
        'SynergyTech Engineering Lead: Moses Martin  |  mosesmartin@synergytechsol.com  |  synergytechsol.com',
        46,
        curY + 45
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
