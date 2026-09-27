import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { processSingleLead } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s for PageSpeed API & Gemini

/**
 * GET /api/cron/process-lead
 * Vercel Cron Endpoint: Dispatches 1 lead every run safely (1 lead/hour)
 * Secured via CRON_SECRET authorization header
 */
export async function GET(req) {
  // 1. Validate Cron Authorization (via Bearer header or ?secret= query param)
  const authHeader = req.headers.get('authorization');
  const url = new URL(req.url);
  const secretParam = url.searchParams.get('secret') || url.searchParams.get('key');
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized =
    !cronSecret ||
    authHeader === `Bearer ${cronSecret}` ||
    secretParam === cronSecret ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }


  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        error: 'Supabase credentials not configured. Please set them in .env.local',
      },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // 2. Select STRICTLY 1 oldest PENDING lead
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error querying pending leads:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        message: 'No pending leads to process in queue.',
        processed: false,
      });
    }

    const targetLead = leads[0];

    // 3. Mark as in-flight / QUALIFIED during processing to prevent race conditions
    await supabase
      .from('leads')
      .update({ status: 'QUALIFIED', status_reason: 'Processing audit/prototype pipeline...' })
      .eq('id', targetLead.id);

    // 4. Run through Funnel A or Funnel B
    const result = await processSingleLead(targetLead);

    return NextResponse.json({
      success: true,
      processed: true,
      result,
    });
  } catch (error) {
    console.error('Cron process-lead exception:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal cron processing error',
      },
      { status: 500 }
    );
  }
}
