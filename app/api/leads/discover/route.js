import { NextResponse } from 'next/server';
import { discoverAndEnrichLeads, enrichSingleDomainLead } from '@/lib/discovery';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Authenticate user
    const cookie = req.cookies.get(AUTH_COOKIE_NAME);
    const token = cookie?.value;
    const session = token ? verifyAuthToken(token) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const { niche, location, maxLeads, mode, domain, businessName } = body;

    // Handle Single Domain Enrichment Mode
    if (mode === 'SINGLE_DOMAIN' || (domain && !niche)) {
      if (!domain) {
        return NextResponse.json({ error: 'Domain or Website URL is required.' }, { status: 400 });
      }

      const enriched = await enrichSingleDomainLead(domain, businessName);

      if (!enriched.isDeliverable || !enriched.email) {
        return NextResponse.json({
          success: true,
          mode: 'SINGLE_DOMAIN',
          enriched,
          lead: null,
          totalDiscovered: 1,
          totalSaved: 0,
          skipped: true,
          message: 'Lead skipped (No verified deliverable email found). Not stored in database.',
        });
      }

      // Pre-Audit Check: Discard if website already passes all benchmarks with zero bottlenecks
      if (enriched.audit) {
        const isHighPerformance =
          enriched.audit.speedScore >= 75 &&
          parseFloat(enriched.audit.lcpSeconds) <= 2.8 &&
          enriched.audit.technicalScore >= 75 &&
          enriched.audit.geoScore >= 75 &&
          enriched.audit.localSchemaScore >= 75;

        if (isHighPerformance) {
          return NextResponse.json({
            success: true,
            mode: 'SINGLE_DOMAIN',
            enriched,
            lead: null,
            totalDiscovered: 1,
            totalSaved: 0,
            skipped: true,
            message: `Lead skipped: "${enriched.businessName}" website already passed all performance & SEO benchmarks (${enriched.audit.speedScore}/100 Speed, ${enriched.audit.geoScore}/100 GEO). Not stored in database.`,
          });
        }
      }

      const supabase = getSupabaseAdmin();
      const slug = generateSlug(enriched.businessName);

      const leadRecord = {
        business_name: enriched.businessName,
        business_slug: slug,
        owner_name: enriched.ownerName,
        email: enriched.email,
        website_url: enriched.websiteUrl,
        has_website: true,
        category: 'Enterprise & Professional Services',
        city: 'United States',
        status: 'PENDING',
        status_reason: `Enriched via Autonomous Domain Discovery • Verified Inbox`,
      };

      const { data: inserted, error: dbErr } = await supabase
        .from('leads')
        .insert(leadRecord)
        .select()
        .single();

      if (inserted && enriched.audit) {
        try {
          await supabase.from('audit_reports').insert({
            lead_id: inserted.id,
            speed_score: enriched.audit.speedScore,
            lcp_seconds: enriched.audit.lcpSeconds,
            page_size_mb: enriched.audit.pageSizeMb,
            technical_score: enriched.audit.technicalScore,
            geo_score: enriched.audit.geoScore,
            local_schema_score: enriched.audit.localSchemaScore,
            composite_score: enriched.audit.compositeScore,
            seo_score: enriched.audit.seoScore,
            seo_issues: enriched.audit.seoIssues,
            actionable_fixes: enriched.audit.actionableFixes,
            gemini_hook: null,
            sent_at: null,
          });
        } catch (auditErr) {
          console.warn('[Single Domain Audit Report Save Notice]:', auditErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        mode: 'SINGLE_DOMAIN',
        enriched,
        lead: inserted || leadRecord,
        totalDiscovered: 1,
        totalSaved: inserted ? 1 : 0,
      });
    }

    if (!niche || !location) {
      return NextResponse.json(
        { error: 'Niche / Keyword and Location are required.' },
        { status: 400 }
      );
    }

    const result = await discoverAndEnrichLeads({
      niche,
      location,
      maxLeads: parseInt(maxLeads || '15', 10),
      mode: mode || 'APOLLO_DECISION_MAKERS',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Discovery API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to discover leads' },
      { status: 500 }
    );
  }
}
