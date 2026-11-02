import { NextResponse } from 'next/server';
import { requestAccess } from '@/lib/websiteRequestAccess';
import { generateLeadDemo } from '@/lib/manualDemo.mjs';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
  const body = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(body.leadId || '')) return NextResponse.json({ error: 'Choose a saved lead.' }, { status: 400 });
  try { return NextResponse.json(await generateLeadDemo(body.leadId)); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 500 }); }
}
