import { NextResponse } from 'next/server';
import { requestAccess } from '@/lib/websiteRequestAccess';
import { generateLeadDemo } from '@/lib/manualDemo.mjs';
import { missingDemoRequirements, normalizeDemoRequirements } from '@/lib/demoRequirements.mjs';
import { demoEventStream } from '@/lib/demoEventStream';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(req) {
  const access = requestAccess(req, true); if (access.error) return access.error;
  const body = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(body.leadId || '')) return NextResponse.json({ error: 'Choose a saved lead.' }, { status: 400 });
  const requirements = normalizeDemoRequirements(body.requirements);
  const missing = missingDemoRequirements(requirements);
  if (missing.length) return NextResponse.json({ error: 'Complete the requirements session before generating.', missing }, { status: 409 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Configure GEMINI_API_KEY on the server to generate a requirements-based demo.' }, { status: 503 });
  return demoEventStream(req, async (emit, signal) => {
    const result = await generateLeadDemo(body.leadId, { requirements, signal, onStage: stage => emit('stage', { stage }), onDelta: delta => emit('delta', { delta }) });
    emit('complete', result);
  });
}
