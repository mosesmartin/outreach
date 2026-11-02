import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ processed: false, emailSent: false, message: 'Automatic outreach is disabled. Each demo and recipient require manual review.' });
}
