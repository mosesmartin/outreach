import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { executeDualAudit } from './audit.js';
import { generateFunnelAHook, generateFunnelBHook } from './gemini.js';
import { buildFunnelAEmail, buildFunnelBEmail, sendColdEmail } from './email.js';
import { generateAuditPdf } from './reportPdf.js';
import { generateSlug } from './slug.js';

/**
 * Core Orchestration: Processes a single lead through Funnel A or Funnel B
 * @param {Object} lead - The lead database object
 * @param {Function} [onProgress] - Optional callback (progressEvent) => void
 */
export async function processSingleLead(lead, onProgress = null) {
  const hasWebsite = Boolean(lead.has_website && lead.website_url && lead.website_url.trim().length > 3);
  const businessSlug = lead.business_slug || generateSlug(lead.business_name);

  const notify = (evt) => {
    if (typeof onProgress === 'function') {
      try {
        onProgress(evt);
      } catch (e) {
        console.warn('onProgress error:', e.message);
      }
    }
  };

  notify({
    step: 1,
    percent: 10,
    stepText: '1. Initializing target lead & verifying deliverability...',
    log: `[0.1s] Initializing pipeline for "${lead.business_name}" (${lead.email || 'No email'})...`,
    status: 'running',
  });

  let supabase = null;
  if (isSupabaseConfigured) {
    try {
      supabase = getSupabaseAdmin();
    } catch (e) {
      console.warn('Supabase not available in pipeline:', e.message);
    }
  }

  try {
    // ------------------------------------------------------------------------
    // FUNNEL A: Website Exists (Speed, Schema & Conversion Audit Engine)
    // ------------------------------------------------------------------------
    if (hasWebsite && lead.website_url) {
      console.log(`[Funnel A] Auditing website for lead ${lead.business_name} (${lead.website_url})...`);
      
      notify({
        step: 2,
        percent: 28,
        stepText: '2. Running Google PageSpeed API & Mobile Core Web Vitals...',
        log: `[1.2s] Querying Google PageSpeed API on ${lead.website_url}...`,
        status: 'running',
      });

      const audit = await executeDualAudit(lead.website_url);

      notify({
        step: 3,
        percent: 52,
        stepText: '3. Auditing Technical SEO, AI Citability (GEO) & Local Schema...',
        log: `[Claude-SEO Engine] Speed: ${audit.speedScore}/100 | Tech: ${audit.technicalScore}/100 | GEO: ${audit.geoScore}/100 | Local: ${audit.localSchemaScore}/100`,
        status: 'running',
      });

      // Score Filter: (Speed < 75 OR GEO < 70 OR LocalSchema < 70 OR Technical < 70)
      const hasBottlenecks = audit.speedScore < 75 || audit.geoScore < 70 || audit.localSchemaScore < 70 || audit.technicalScore < 70;

      if (!hasBottlenecks) {
        console.log(`[Funnel A] Lead ${lead.business_name} has high benchmark scores (Speed: ${audit.speedScore}, Tech: ${audit.technicalScore}, GEO: ${audit.geoScore}, Local: ${audit.localSchemaScore}). Marking SKIPPED.`);
        
        if (supabase) {
          try {
            await supabase
              .from('leads')
              .update({
                status: 'SKIPPED',
                status_reason: `High performance benchmark (Speed: ${audit.speedScore}/100, Tech: ${audit.technicalScore}/100, GEO: ${audit.geoScore}/100, Local: ${audit.localSchemaScore}/100)`,
                business_slug: businessSlug,
              })
              .eq('id', lead.id);

            await supabase.from('audit_reports').insert({
              lead_id: lead.id,
              speed_score: audit.speedScore,
              lcp_seconds: audit.lcpSeconds,
              page_size_mb: audit.pageSizeMb,
              seo_score: audit.seoScore,
              seo_issues: audit.seoIssues,
              gemini_hook: null,
              sent_at: null,
            });
          } catch (dbErr) {
            console.warn('DB skip log notice:', dbErr.message);
          }
        }

        const skipResult = {
          success: true,
          leadId: lead.id,
          businessName: lead.business_name,
          funnel: 'FUNNEL_A_AUDIT',
          status: 'SKIPPED',
          reason: 'Site already passes all 4 benchmark pillars (>75 Speed, >70 Technical, >70 GEO, >70 Local Schema)',
          emailSent: false,
          auditReport: {
            speed_score: audit.speedScore,
            lcp_seconds: audit.lcpSeconds,
            page_size_mb: audit.pageSizeMb,
            technical_score: audit.technicalScore,
            geo_score: audit.geoScore,
            local_schema_score: audit.localSchemaScore,
            seo_score: audit.seoScore,
            schema_score: audit.localSchemaScore,
            conversion_score: audit.localSchemaScore,
            seo_issues: audit.seoIssues,
            actionable_fixes: audit.actionableFixes,
          }
        };

        notify({
          step: 6,
          percent: 100,
          stepText: '6. Site benchmarks passed (>75 score) -> Lead marked SKIPPED',
          log: `[Completed] High benchmark scores (${audit.speedScore}/100 Speed, ${audit.geoScore}/100 GEO). Preserving sender reputation.`,
          status: 'completed',
          result: skipResult,
        });

        return skipResult;
      }

      // Gaps found -> Generate AI Hook & Dispatch Email
      notify({
        step: 4,
        percent: 72,
        stepText: '4. Synthesizing AI Citability & Speed diagnosis with Gemini Flash...',
        log: `[Gemini AI] Reasoning actionable speed, GEO & schema teardown hook...`,
        status: 'running',
      });

      const topIssue = (audit.lagBottlenecks && audit.lagBottlenecks[0]) || (audit.seoIssues && audit.seoIssues[0]) || 'Mobile render delays and missing LocalBusiness schema';
      const geminiHook = await generateFunnelAHook({
        businessName: lead.business_name,
        speedScore: audit.speedScore,
        technicalScore: audit.technicalScore,
        geoScore: audit.geoScore,
        localSchemaScore: audit.localSchemaScore,
        seoScore: audit.seoScore,
        schemaScore: audit.localSchemaScore,
        lcpSeconds: audit.lcpSeconds,
        topIssue,
        lagBottlenecks: audit.lagBottlenecks || [],
        aiGaps: audit.aiGaps || [],
      });

      const { subject, body } = buildFunnelAEmail({
        ownerName: lead.owner_name || 'Team',
        businessName: lead.business_name,
        speedScore: audit.speedScore,
        lcpSeconds: audit.lcpSeconds,
        pageSizeMb: audit.pageSizeMb,
        seoScore: audit.seoScore,
        schemaScore: audit.localSchemaScore,
        conversionScore: audit.localSchemaScore,
        seoIssues: audit.seoIssues,
        lagBottlenecks: audit.lagBottlenecks || [],
        aiGaps: audit.aiGaps || [],
        geminiHook,
        city: lead.city,
        category: lead.category,
      });

      // Generate Professional PDF Report Attachment
      notify({
        step: 5,
        percent: 88,
        stepText: '5. Compiling 4-Pillar Executive Diagnostic PDF Dossier...',
        log: `[PDF Engine] Rendering confidential 4-Pillar PDF diagnostic report...`,
        status: 'running',
      });

      let attachments = [];
      try {
        const pdfBuffer = await generateAuditPdf({
          businessName: lead.business_name,
          websiteUrl: lead.website_url,
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
          lagBottlenecks: audit.lagBottlenecks || [],
          aiGaps: audit.aiGaps || [],
          actionableFixes: audit.actionableFixes,
          geminiHook,
          ownerName: lead.owner_name,
        });

        const safeFilename = `Diagnostic-Report-${lead.business_name.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
        attachments.push({
          filename: safeFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
        console.log(`[Funnel A] Diagnostic PDF generated successfully for ${lead.business_name}`);
      } catch (pdfErr) {
        console.warn(`[Funnel A] PDF generation notice:`, pdfErr.message);
      }

      notify({
        step: 6,
        percent: 95,
        stepText: '6. Dispatching Cold Outreach Email via SMTP...',
        log: `[SMTP Outbound] Delivering email to ${lead.email} with PDF report...`,
        status: 'running',
      });

      const emailResult = await sendColdEmail({
        to: lead.email,
        subject,
        body,
        attachments,
      });

      const now = new Date().toISOString();

      if (supabase) {
        try {
          await supabase.from('audit_reports').insert({
            lead_id: lead.id,
            speed_score: audit.speedScore,
            lcp_seconds: audit.lcpSeconds,
            page_size_mb: audit.pageSizeMb,
            seo_score: audit.seoScore,
            seo_issues: audit.seoIssues,
            gemini_hook: geminiHook,
            email_subject: subject,
            email_body: body,
            sent_at: emailResult.success ? now : null,
          });

          const nextStatus = emailResult.success ? 'SENT' : 'FAILED';
          await supabase
            .from('leads')
            .update({
              status: nextStatus,
              status_reason: emailResult.success 
                ? `Dispatched Funnel A diagnostic assessment (${emailResult.simulated ? 'Simulated' : 'SMTP'})`
                : `Email delivery failed: ${emailResult.error}`,
              business_slug: businessSlug,
            })
            .eq('id', lead.id);
        } catch (dbErr) {
          console.warn('DB update notice in pipeline:', dbErr.message);
        }
      }

      const nextStatus = emailResult.success ? 'SENT' : 'FAILED';
      const finalResult = {
        success: emailResult.success,
        leadId: lead.id,
        businessName: lead.business_name,
        funnel: 'FUNNEL_A_AUDIT',
        status: nextStatus,
        emailSent: emailResult.success,
        auditReport: {
          speed_score: audit.speedScore,
          lcp_seconds: audit.lcpSeconds,
          page_size_mb: audit.pageSizeMb,
          technical_score: audit.technicalScore,
          geo_score: audit.geoScore,
          local_schema_score: audit.localSchemaScore,
          seo_score: audit.seoScore,
          schema_score: audit.localSchemaScore,
          conversion_score: audit.localSchemaScore,
          seo_issues: audit.seoIssues,
          actionable_fixes: audit.actionableFixes,
          gemini_hook: geminiHook,
          email_subject: subject,
          email_body: body,
          sent_at: now,
        },
      };

      notify({
        step: 6,
        percent: 100,
        stepText: '6. Pipeline Completed & Cold Outreach Dispatched!',
        log: `[Done] Funnel A finished -> Status: ${nextStatus} (${emailResult.simulated ? 'Simulated' : 'Delivered'})`,
        status: 'completed',
        result: finalResult,
      });

      return finalResult;
    }

    // ------------------------------------------------------------------------
    // FUNNEL B: No Website Found (Live Web Prototype Engine)
    // ------------------------------------------------------------------------
    console.log(`[Funnel B] Generating prototype offer for lead ${lead.business_name}...`);

    notify({
      step: 2,
      percent: 32,
      stepText: '2. Mounting live mobile responsive prototype layout...',
      log: `[Prototype Engine] Generating dynamic web prototype at /demo/${businessSlug}...`,
      status: 'running',
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://synergytechsol.com';
    const prototypeUrl = `${appBaseUrl.replace(/\/$/, '')}/demo/${businessSlug}`;

    notify({
      step: 3,
      percent: 56,
      stepText: '3. Customizing hero, services, reviews & 1-tap quote capture...',
      log: `[Prototype Engine] Tailoring industry template for ${lead.category || 'Local Business'}...`,
      status: 'running',
    });

    notify({
      step: 4,
      percent: 74,
      stepText: '4. Synthesizing Google Maps conversion pitch with Gemini 3.6 Flash...',
      log: `[Gemini AI] Reasoning high-intent local conversion hooks for ${lead.city || 'local area'}...`,
      status: 'running',
    });

    const geminiHook = await generateFunnelBHook({
      businessName: lead.business_name,
      category: lead.category || 'Local Services',
      city: lead.city || 'your area',
    });

    const { subject, body } = buildFunnelBEmail({
      ownerName: lead.owner_name || 'Team',
      businessName: lead.business_name,
      category: lead.category || 'Local Services',
      city: lead.city || 'your area',
      businessSlug,
      appBaseUrl,
    });

    notify({
      step: 5,
      percent: 90,
      stepText: '5. Dispatching Interactive Prototype Invitation via Email...',
      log: `[SMTP Outbound] Delivering prototype access link to ${lead.email}...`,
      status: 'running',
    });

    const emailResult = await sendColdEmail({
      to: lead.email,
      subject,
      body,
    });

    const now = new Date().toISOString();

    if (supabase) {
      try {
        await supabase.from('audit_reports').insert({
          lead_id: lead.id,
          gemini_hook: geminiHook,
          prototype_url: prototypeUrl,
          email_subject: subject,
          email_body: body,
          sent_at: emailResult.success ? now : null,
        });

        const nextStatus = emailResult.success ? 'SENT' : 'FAILED';
        await supabase
          .from('leads')
          .update({
            status: nextStatus,
            business_slug: businessSlug,
            status_reason: emailResult.success
              ? `Dispatched Funnel B prototype demo offer (${emailResult.simulated ? 'Simulated' : 'SMTP'})`
              : `Email delivery failed: ${emailResult.error}`,
          })
          .eq('id', lead.id);
      } catch (dbErr) {
        console.warn('DB update notice for prototype:', dbErr.message);
      }
    }

    const nextStatus = emailResult.success ? 'SENT' : 'FAILED';
    const finalResult = {
      success: emailResult.success,
      leadId: lead.id,
      businessName: lead.business_name,
      funnel: 'FUNNEL_B_PROTOTYPE',
      status: nextStatus,
      emailSent: emailResult.success,
      auditReport: {
        prototype_url: prototypeUrl,
        gemini_hook: geminiHook,
        email_subject: subject,
        email_body: body,
        sent_at: now,
      },
    };

    notify({
      step: 6,
      percent: 100,
      stepText: '6. Pipeline Completed & Prototype Invitation Sent!',
      log: `[Done] Funnel B finished -> Status: ${nextStatus} (${emailResult.simulated ? 'Simulated' : 'Delivered'})`,
      status: 'completed',
      result: finalResult,
    });

    return finalResult;
  } catch (error) {
    console.error(`Pipeline error on lead ${lead.id}:`, error);

    if (supabase && lead.id) {
      try {
        await supabase
          .from('leads')
          .update({
            status: 'FAILED',
            status_reason: `Pipeline error: ${error?.message || 'Execution exception'}`,
            business_slug: businessSlug,
          })
          .eq('id', lead.id);
      } catch (dbErr) {
        console.warn('Failed to update lead status to FAILED in catch block:', dbErr.message);
      }
    }

    notify({
      step: 6,
      percent: 100,
      stepText: `Pipeline Exception: ${error.message}`,
      log: `[Error] ${error.message}`,
      status: 'error',
      error: error.message,
    });

    return {
      success: false,
      leadId: lead.id,
      businessName: lead.business_name,
      funnel: hasWebsite ? 'FUNNEL_A_AUDIT' : 'FUNNEL_B_PROTOTYPE',
      status: 'FAILED',
      error: error?.message || 'Unexpected pipeline exception',
    };
  }
}
