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
        status_reason: `Enriched via Autonomous Domain Discovery • ${enriched.isDeliverable ? 'Verified Inbox' : 'Permutation Synthesized'}`,
      };

      const { data: inserted, error: dbErr } = await supabase
        .from('leads')
        .insert(leadRecord)
        .select()
        .single();

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
