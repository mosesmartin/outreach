import { NextResponse } from 'next/server';
import { requestAccess } from '@/lib/websiteRequestAccess';
import { getSupabaseAdmin } from '@/lib/supabase';
import { restoreImportedLead } from '@/lib/leadImport.mjs';
import { syntheticLeadReason } from '@/lib/leadSafety.mjs';
import { normalizeDemoRequirements } from '@/lib/demoRequirements.mjs';
import { streamDemoAI } from '@/lib/demoAI.mjs';
import { demoEventStream } from '@/lib/demoEventStream';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
  const body = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(body.leadId || '')) return NextResponse.json({ error: 'Choose a saved lead.' }, { status: 400 });
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 24 || body.messages.some(message => !['user', 'assistant'].includes(message?.role) || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 4000) || body.messages.at(-1).role !== 'user') return NextResponse.json({ error: 'Send a valid requirements message (up to 4,000 characters, 24 messages per session).' }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Configure GEMINI_API_KEY on the server for live requirements chat.' }, { status: 503 });
  try {
    const { data, error } = await getSupabaseAdmin().from('leads').select('*').eq('id', body.leadId).maybeSingle();
    if (error) return NextResponse.json({ error: 'Could not load this business from the database.' }, { status: 503 });
    if (!data) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    const blocked = syntheticLeadReason(data); if (blocked) return NextResponse.json({ error: blocked }, { status: 422 });
    const lead = restoreImportedLead(data);
    return demoEventStream(req, async (emit, signal) => {
      emit('stage', { stage: 'understanding' });
      const result = await streamDemoAI({ lead, messages: body.messages, requirements: normalizeDemoRequirements(body.requirements), onDelta: delta => emit('delta', { delta }), signal });
      emit('complete', result);
    });
  } catch { return NextResponse.json({ error: 'Could not start the requirements session. Check the server connection.' }, { status: 503 }); }
}
