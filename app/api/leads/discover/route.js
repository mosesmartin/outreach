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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const { niche, location, maxLeads } = body;

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
