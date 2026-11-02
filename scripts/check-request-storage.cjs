// Read-only readiness check. Never prints environment values or customer records.
require('@next/env').loadEnvConfig(process.cwd());
(async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/website_requests?select=id&limit=0`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    console.log(JSON.stringify({ status: response.status, code: body.code || null, storageReady: response.ok }));
  } catch (error) {
    console.log(JSON.stringify({ storageReady: false, error: error.name, networkCode: error.cause?.code || null }));
    process.exitCode = 1;
  }
})();
