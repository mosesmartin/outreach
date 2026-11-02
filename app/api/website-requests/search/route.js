import { NextResponse } from 'next/server';
import { requestAccess, requestApiError } from '@/lib/websiteRequestAccess';
import { claimRequestSearch, finishRequestSearch, saveWebsiteRequests } from '@/lib/websiteRequestStore';
import { isFreshRequest, REQUEST_PLATFORMS, REQUEST_WINDOWS } from '@/lib/websiteRequestRules.mjs';
import { discoverWebsiteRequests } from '@/lib/websiteRequestSearch.mjs';
import { isDataForSeoConfigured } from '@/lib/dataforseo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
  const access = requestAccess(req, true);
  if (access.error) return access.error;
  let runId;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.niche !== 'string' || typeof body.location !== 'string'
      || body.niche.length > 80 || body.location.length > 80
      || (body.country && body.country !== 'US')
      || !REQUEST_WINDOWS.includes(body.window) || !REQUEST_PLATFORMS.includes(body.platform)) {
      return NextResponse.json({ error: 'Choose a valid date range and source. Niche and location must be 80 characters or fewer.' }, { status: 400 });
    }
    if (!isDataForSeoConfigured()) return NextResponse.json({ error: 'Configure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to search Google.', code: 'SEARCH_SETUP_REQUIRED' }, { status: 503 });
    runId = await claimRequestSearch(access.session.id || access.session.email);
    const result = await discoverWebsiteRequests({ ...body, niche: body.niche.trim(), location: body.location.trim() });
    const saved = await saveWebsiteRequests(result.requests);
    const stats = { ...result.stats, saved: saved.filter((record) => isFreshRequest(record, body.window)).length, providerCost: result.providerCost, window: body.window, niche: body.niche.trim(), location: body.location.trim() };
    await finishRequestSearch(runId, result.warnings.length ? 'partial' : 'completed', stats);
    return NextResponse.json({ success: true, stats, warnings: result.warnings, range: result.range });
  } catch (error) {
    if (runId) await finishRequestSearch(runId, 'failed', {}).catch(() => {});
    return requestApiError(error);
  }
}
