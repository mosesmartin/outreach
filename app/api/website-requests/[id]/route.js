import { NextResponse } from 'next/server';
import { requestAccess, requestApiError } from '@/lib/websiteRequestAccess';
import { getWebsiteRequest, updateWebsiteRequest } from '@/lib/websiteRequestStore';
import { REQUEST_STATUSES } from '@/lib/websiteRequestRules.mjs';
import { inspectRequestSource } from '@/lib/websiteRequestSources.mjs';
import { assessUsClient } from '@/lib/websiteRequestCountry.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const validId = (id) => /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id);

export async function GET(req, { params }) {
  const access = requestAccess(req);
  if (access.error) return access.error;
  if (!validId(params.id)) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  try {
    const request = await getWebsiteRequest(params.id);
    return request ? NextResponse.json({ request }) : NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  } catch (error) { return requestApiError(error); }
}

export async function PATCH(req, { params }) {
  const access = requestAccess(req, true);
  if (access.error) return access.error;
  if (!validId(params.id)) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    const existing = await getWebsiteRequest(params.id);
    if (!existing) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    let updates;
    if (body.action === 'recheck') {
      const result = await inspectRequestSource(existing.source_url);
      updates = { last_checked_at: new Date().toISOString() };
      if (result.accepted) {
        const { post } = result;
        const country = assessUsClient(post);
        Object.assign(updates, {
          title: post.title, requirement: post.body, published_at: post.publishedAt,
          date_evidence: post.dateEvidence, public_email: post.email, public_phone: post.phone,
          source_state: country.accepted ? 'request_detected' : 'needs_review',
          country_code: country.accepted ? 'US' : null,
          country_evidence: country.accepted ? country.evidence : null,
          country_evidence_source: country.accepted ? country.source : null,
        });
      } else {
        updates.source_state = result.reason === 'closed' ? 'closed' : result.reason === 'unavailable' ? 'unavailable' : 'needs_review';
      }
    } else {
      if (!REQUEST_STATUSES.includes(body.status) || typeof body.notes !== 'string' || body.notes.length > 5000) {
        return NextResponse.json({ error: 'Choose a valid status. Notes must be 5,000 characters or fewer.' }, { status: 400 });
      }
      updates = { status: body.status, notes: body.notes };
    }
    return NextResponse.json({ request: await updateWebsiteRequest(params.id, updates) });
  } catch (error) { return requestApiError(error); }
}
