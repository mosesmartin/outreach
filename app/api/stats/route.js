import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
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

function extractPhone(lead) {
  if (lead.phone) return lead.phone;
  if (!lead.status_reason) return null;
  const match = lead.status_reason.match(/(?:Phone:\s*|tel:)([\+\d\s\(\)\-\.]{7,25})/i);
  return match ? match[1].trim() : null;
}

export async function GET() {
  let leads = [];

  if (isSupabaseConfigured) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('leads')
        .select('*');

      if (!error && data) {
        leads = data;
      }
    } catch (err) {
      console.warn('Stats Supabase query warning:', err.message);
    }
  }

  // Fallback if supabase returns empty or error
  if (leads.length === 0) {
    leads = loadFallbackLeads();
  }

  const withPhoneCount = leads.filter((l) => Boolean(extractPhone(l))).length;

  const getLeadStage = (l) => {
    if (l.stage) return l.stage;
    if (l.status === 'SENT') return 'CONTACTED';
    if (l.status === 'QUALIFIED') return 'DEMO_READY';
    if (l.status === 'SKIPPED') return 'LOST';
    return 'NEW_LEAD';
  };

  const stageCounts = {
    NEW_LEAD: 0,
    DEMO_READY: 0,
    CONTACTED: 0,
    IN_NEGOTIATION: 0,
    CLOSED_WON: 0,
    RETAINER_ACTIVE: 0,
    LOST: 0,
  };

  let pipelineValue = 0;
  let closedWonValue = 0;
  let mrrValue = 0;

  leads.forEach((l) => {
    const stage = getLeadStage(l);
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    } else {
      stageCounts.NEW_LEAD++;
    }

    const val = parseFloat(l.deal_value || 0) || 0;
    const retVal = parseFloat(l.retainer_value || 0) || 0;

    if (['NEW_LEAD', 'DEMO_READY', 'CONTACTED', 'IN_NEGOTIATION'].includes(stage)) {
      pipelineValue += val;
    } else if (stage === 'CLOSED_WON') {
      closedWonValue += val;
    }

    if (stage === 'RETAINER_ACTIVE' || retVal > 0) {
      mrrValue += retVal;
    }
  });

  const stats = {
    configured: true,
    totalLeads: leads.length,
    pending: leads.filter((l) => l.status === 'PENDING').length,
    sent: leads.filter((l) => l.status === 'SENT').length,
    qualified: leads.filter((l) => l.status === 'QUALIFIED').length,
    skipped: leads.filter((l) => l.status === 'SKIPPED').length,
    failed: leads.filter((l) => l.status === 'FAILED').length,
    withPhone: withPhoneCount,
    noWebsite: leads.filter((l) => !l.has_website).length,
    prototypesReady: leads.length,
    // Twenty CRM Financial Metrics
    pipelineValue,
    closedWonValue,
    mrrValue,
    stageCounts,
  };

  return NextResponse.json(stats);
}
