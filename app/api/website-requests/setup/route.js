import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requestAccess } from '@/lib/websiteRequestAccess';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const access = requestAccess(req);
  if (access.error) return access.error;
  try {
    const sql = await readFile(path.join(process.cwd(), 'supabase', 'website_requests.sql'), 'utf8');
    let sqlEditorUrl = 'https://supabase.com/dashboard';
    try {
      const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1];
      if (projectRef) sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
    } catch { /* custom project URLs use the general dashboard */ }
    return NextResponse.json({ sql, sqlEditorUrl }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Open supabase/website_requests.sql in your project to copy the setup SQL.' }, { status: 500 });
  }
}
