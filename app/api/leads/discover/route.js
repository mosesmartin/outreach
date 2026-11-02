import { NextResponse } from 'next/server';
import { discoverAndEnrichLeads } from '@/lib/discovery';
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
    const isLocalDev = process.env.NODE_ENV !== 'production' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!session && !isLocalDev) {
      return NextResponse.json({ error: 'Unauthorized access. Please login.' }, { status: 401 });
    }

    const body = await req.json();
    const { niche, location, maxLeads, filterMode, mode } = body;

    if (!niche || !location) {
      return NextResponse.json(
        { error: 'Niche / Keyword and Location are required.' },
        { status: 400 }
      );
    }

    const result = await discoverAndEnrichLeads({
      niche,
      location,
      maxLeads: parseInt(maxLeads || '50', 10),
      filterMode: filterMode || mode || 'HYBRID',
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
