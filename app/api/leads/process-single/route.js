import { NextResponse } from 'next/server';
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
 * POST /api/leads/process-single
 * Triggers processing of a specific lead ID or the next pending lead
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = body.leadId;

    let targetLead = null;

    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabaseAdmin();
        if (leadId) {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .maybeSingle();

          if (!error && data) {
            targetLead = data;
          }
        } else {
          const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true })
            .limit(1);

          if (!error && data && data.length > 0) {
            targetLead = data[0];
          }
        }
      } catch (dbErr) {
        console.warn('Supabase fetch notice in process-single:', dbErr.message);
      }
    }

    // Fallback if not found in Supabase
    if (!targetLead) {
      const fallbackList = loadFallbackLeads();
      if (leadId) {
        targetLead = fallbackList.find((l) => l.id === leadId);
      } else {
        targetLead = fallbackList.find((l) => l.status === 'PENDING') || fallbackList[0];
      }
    }

    if (!targetLead) {
      return NextResponse.json(
        { message: 'No pending leads found in the queue.', processed: false },
        { status: 200 }
      );
    }

    const result = await processSingleLead(targetLead);

    return NextResponse.json({
      success: true,
      processed: true,
      result,
    });
  } catch (error) {
    console.error('Process single lead route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process lead' },
      { status: 500 }
    );
  }
}
