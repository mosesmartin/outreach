import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { processSingleLead } from '@/lib/pipeline';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BACKUP_FILE = path.join(process.cwd(), 'data', 'fallback_leads.json');

function loadFallbackLeads() {
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8') || '[]');
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * POST /api/leads/process-stream
 * Server-Sent Events (SSE) streaming endpoint for real-time pipeline execution progress.
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const leadId = body.leadId;

  let targetLead = null;

  // 1. Try fetching from Supabase
  if (isSupabaseConfigured) {
    try {
      const supabase = getSupabaseAdmin();
      if (leadId) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();
        if (!error && data) targetLead = data;
      } else {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true })
          .limit(1);
        if (!error && data && data.length > 0) targetLead = data[0];
      }
    } catch (err) {
      console.warn('Supabase lookup warning in stream route:', err.message);
    }
  }

  // 2. Fallback to local leads if not found in Supabase
  if (!targetLead) {
    const fallbackList = loadFallbackLeads();
    if (leadId) {
      targetLead = fallbackList.find((l) => l.id === leadId);
    } else {
      targetLead = fallbackList.find((l) => l.status === 'PENDING') || fallbackList[0];
    }
  }

  if (!targetLead) {
    return new Response(
      JSON.stringify({ error: 'No target lead found to process in queue.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (data) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.warn('Error writing to SSE stream:', e.message);
    }
  };

  // Execute pipeline in async worker and stream progress
  (async () => {
    try {
      await sendEvent({
        type: 'INIT',
        step: 1,
        percent: 10,
        stepText: `Initializing pipeline for ${targetLead.business_name}...`,
        businessName: targetLead.business_name,
        lead: targetLead,
        log: `[0.0s] Starting live execution for ${targetLead.business_name}...`,
        status: 'running',
      });

      const finalResult = await processSingleLead(targetLead, async (progressEvent) => {
        await sendEvent({
          type: 'PROGRESS',
          businessName: targetLead.business_name,
          lead: targetLead,
          ...progressEvent,
        });
      });

      await sendEvent({
        type: 'COMPLETE',
        step: 6,
        percent: 100,
        stepText: 'Pipeline Completed & Outreach Processed!',
        businessName: targetLead.business_name,
        lead: targetLead,
        status: finalResult.status === 'FAILED' ? 'error' : 'completed',
        result: finalResult,
        log: `[100%] Execution finished with status: ${finalResult.status}`,
      });
    } catch (error) {
      console.error('SSE Stream Error:', error);
      await sendEvent({
        type: 'ERROR',
        step: 6,
        percent: 100,
        stepText: `Execution Error: ${error.message}`,
        businessName: targetLead.business_name,
        lead: targetLead,
        status: 'error',
        error: error.message,
        log: `[Error] ${error.message}`,
      });
    } finally {
      try {
        await writer.close();
      } catch (e) {
        // stream already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
