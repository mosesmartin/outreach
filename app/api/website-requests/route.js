import { NextResponse } from 'next/server';
import { requestAccess, requestApiError } from '@/lib/websiteRequestAccess';
import { listWebsiteRequests } from '@/lib/websiteRequestStore';
import { REQUEST_PLATFORMS, REQUEST_STATUSES, REQUEST_WINDOWS } from '@/lib/websiteRequestRules.mjs';
import { isDataForSeoConfigured } from '@/lib/dataforseo';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const access = requestAccess(req);
  if (access.error) return access.error;
  const params = new URL(req.url).searchParams;
  const window = params.get('window') || 'today';
  const platform = params.get('platform') || 'all';
  const status = params.get('status') || 'ALL';
  if ((params.has('country') && params.get('country') !== 'US') || !REQUEST_WINDOWS.includes(window) || !REQUEST_PLATFORMS.includes(platform) || !['ALL', ...REQUEST_STATUSES].includes(status)) {
    return NextResponse.json({ error: 'Invalid request filters.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ ...await listWebsiteRequests({ window, platform, status }), searchConfigured: isDataForSeoConfigured() });
  } catch (error) { return requestApiError(error); }
}
