// Free, read-only account/API readiness check. No credentials or account data printed.
require('@next/env').loadEnvConfig(process.cwd());
(async () => {
  try {
    const credentials = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
      ? `${process.env.DATAFORSEO_LOGIN.trim()}:${process.env.DATAFORSEO_PASSWORD.trim()}`
      : (process.env.DATAFORSEO_API_KEY || '').trim();
    const response = await fetch('https://api.dataforseo.com/v3/appendix/user_data', {
      headers: { Authorization: `Basic ${Buffer.from(credentials).toString('base64')}` },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    console.log(JSON.stringify({ httpStatus: response.status, apiStatus: data.status_code, taskStatus: data.tasks?.[0]?.status_code || null }));
  } catch (error) { console.log(JSON.stringify({ error: error.name, code: error.cause?.code || null })); process.exitCode = 1; }
})();
