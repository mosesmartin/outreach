import { getSupabaseAdmin, isSupabaseConfigured } from './supabase.js';
import { generateFunnelBHook } from './gemini.js';
import { buildFunnelBEmail, sendColdEmail } from './email.js';
import { generateSlug } from './slug.js';
import { verifyEmail, extractCleanEmail } from './verifier.js';

function extractPhoneFallback(reason) {
  if (!reason || typeof reason !== 'string') return null;
  const match = reason.match(/(?:Phone:\s*|tel:)([\+\d\s\(\)\-\.]{7,25})/i);
  return match ? match[1].trim() : null;
}

/**
 * Core Orchestration: Dedicated Live Prototype & Direct Outreach Engine
 * Focus: Businesses Without Websites -> Live Mobile Prototype + WhatsApp / Call / Email Hook
 *
 * @param {Object} lead - The lead database object
 * @param {Function} [onProgress] - Optional callback (progressEvent) => void
 */
export async function processSingleLead(lead, onProgress = null) {
  const businessSlug = lead.business_slug || generateSlug(lead.business_name);
  const cleanEmail = extractCleanEmail(lead.email);
  const phone = lead.phone || extractPhoneFallback(lead.status_reason) || null;

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
    percent: 15,
    stepText: '1. Initializing Target Business & Contact Channels...',
    log: `[0.1s] Initializing acquisition pipeline for "${lead.business_name}" (Phone: ${phone || 'N/A'} | Email: ${cleanEmail || 'None'})...`,
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
    // ZERO-WEBSITE ACQUISITION ENGINE (Live Prototype + Multi-Channel Outreach)
    // ------------------------------------------------------------------------
    console.log(`[Acquisition Engine] Generating live prototype for lead: ${lead.business_name}...`);

    notify({
      step: 2,
      percent: 40,
      stepText: '2. Mounting live mobile responsive prototype layout...',
      log: `[Prototype Engine] Generating dynamic web prototype at /demo/${businessSlug}...`,
      status: 'running',
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://synergytechsol.com';
    const prototypeUrl = `${appBaseUrl.replace(/\/$/, '')}/demo/${businessSlug}`;

    notify({
      step: 3,
      percent: 65,
      stepText: '3. Reasoning local conversion pitch with Gemini AI...',
      log: `[Gemini AI] Crafting casual high-converting local hooks for ${lead.city || 'your area'}...`,
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

    // Formulate 1-Tap WhatsApp Pitch Message
    const cleanPhoneForWa = phone ? phone.replace(/[^0-9]/g, '') : null;
    const whatsappGreeting = lead.owner_name && lead.owner_name !== 'Team' && !lead.owner_name.toLowerCase().includes('leadership')
      ? `Hi ${lead.owner_name.split(' ')[0]}`
      : `Hi there`;
    
    const whatsappMessage = `${whatsappGreeting}, I saw your ${lead.rating || 4.9}★ reviews on Google Maps in ${lead.city || 'your area'}. Noticed you don't have an official fast-loading website yet, so our team designed a live mobile prototype specifically for ${lead.business_name}: ${prototypeUrl} - Take a look and let me know what you think!`;
    const whatsappLink = cleanPhoneForWa ? `https://wa.me/${cleanPhoneForWa}?text=${encodeURIComponent(whatsappMessage)}` : null;

    // Check deliverability if email exists
    let emailResult = { success: false, error: 'No email provided' };
    let verification = { valid: false };

    if (cleanEmail) {
      notify({
        step: 4,
        percent: 85,
        stepText: '4. Checking email deliverability & dispatching prototype invitation...',
        log: `[SMTP Outbound] Validating deliverability for ${cleanEmail}...`,
        status: 'running',
      });

      verification = await verifyEmail(cleanEmail);
      if (verification.valid) {
        emailResult = await sendColdEmail({
          to: cleanEmail,
          subject,
          body,
        });
      }
    }

    const now = new Date().toISOString();

    // Determine final status:
    // If email was sent -> SENT
    // If no email, but prototype is live & phone is ready -> QUALIFIED (Ready for WhatsApp / Call)
    const nextStatus = emailResult.success ? 'SENT' : 'QUALIFIED';
    const nextReason = emailResult.success
      ? `Dispatched prototype invitation via email (${emailResult.simulated ? 'Simulated' : 'SMTP'}) • Live at /demo/${businessSlug}`
      : (phone
        ? `Live prototype ready at /demo/${businessSlug} • Ready for 1-Tap WhatsApp/Call (${phone})`
        : `Live prototype ready at /demo/${businessSlug}`);

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

        await supabase
          .from('leads')
          .update({
            status: nextStatus,
            business_slug: businessSlug,
            status_reason: nextReason,
            has_website: false,
          })
          .eq('id', lead.id);
      } catch (dbErr) {
        console.warn('DB update notice for prototype pipeline:', dbErr.message);
      }
    }

    const finalResult = {
      success: true,
      leadId: lead.id,
      businessName: lead.business_name,
      phone,
      whatsappLink,
      funnel: 'NO_WEBSITE_PROTOTYPE',
      status: nextStatus,
      emailSent: emailResult.success,
      auditReport: {
        prototype_url: prototypeUrl,
        gemini_hook: geminiHook,
        email_subject: subject,
        email_body: body,
        whatsapp_message: whatsappMessage,
        sent_at: emailResult.success ? now : null,
      },
    };

    notify({
      step: 5,
      percent: 100,
      stepText: emailResult.success 
        ? '5. Pipeline Completed & Prototype Invitation Sent!' 
        : `5. Prototype Live at /demo/${businessSlug} (Ready for WhatsApp / Phone Outreach)`,
      log: `[Done] Finished -> Status: ${nextStatus} | Demo: /demo/${businessSlug} | Phone: ${phone || 'N/A'}`,
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
      step: 5,
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
      funnel: 'NO_WEBSITE_PROTOTYPE',
      status: 'FAILED',
      error: error?.message || 'Unexpected pipeline exception',
    };
  }
}
