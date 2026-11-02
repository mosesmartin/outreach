import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Automatic processing was removed. Use Generate demo, review it, then Send reviewed email.' }, { status: 410 });
}
