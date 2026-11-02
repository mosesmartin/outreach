import { NextResponse } from 'next/server';
import { requestAccess } from '@/lib/websiteRequestAccess';
import { sendReviewedDemo } from '@/lib/manualDemo.mjs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
  const body = await req.json().catch(() => ({}));
  try { return NextResponse.json(await sendReviewedDemo(body)); }
  catch (error) { return NextResponse.json({ error: error.message }, { status: error.status || 500 }); }
}
