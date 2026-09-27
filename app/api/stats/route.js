import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      configured: false,
      totalLeads: 0,
      pending: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      withWebsite: 0,
      noWebsite: 0,
      avgSpeedScore: 0,
      avgSeoScore: 0,
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    const [leadsRes, auditRes] = await Promise.all([
      supabase.from('leads').select('status, has_website'),
      supabase.from('audit_reports').select('speed_score, seo_score'),
    ]);

    const leads = leadsRes.data || [];
    const audits = auditRes.data || [];

    const stats = {
      configured: true,
      totalLeads: leads.length,
      pending: leads.filter((l) => l.status === 'PENDING').length,
      sent: leads.filter((l) => l.status === 'SENT').length,
      skipped: leads.filter((l) => l.status === 'SKIPPED').length,
      failed: leads.filter((l) => l.status === 'FAILED').length,
      qualified: leads.filter((l) => l.status === 'QUALIFIED').length,
      withWebsite: leads.filter((l) => l.has_website).length,
      noWebsite: leads.filter((l) => !l.has_website).length,
      avgSpeedScore: 0,
      avgSeoScore: 0,
    };

    const validSpeeds = audits.filter((a) => typeof a.speed_score === 'number' && a.speed_score > 0);
    if (validSpeeds.length > 0) {
      stats.avgSpeedScore = Math.round(
        validSpeeds.reduce((acc, curr) => acc + (curr.speed_score || 0), 0) / validSpeeds.length
      );
    }

    const validSeo = audits.filter((a) => typeof a.seo_score === 'number' && a.seo_score > 0);
    if (validSeo.length > 0) {
      stats.avgSeoScore = Math.round(
        validSeo.reduce((acc, curr) => acc + (curr.seo_score || 0), 0) / validSeo.length
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Failed to calculate stats' }, { status: 500 });
  }
}
