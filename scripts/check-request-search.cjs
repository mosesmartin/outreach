// One manual live check: two paid queries, no messages, no writes and no contact data printed.
require('@next/env').loadEnvConfig(process.cwd());
(async () => {
  const { discoverWebsiteRequests } = await import('../lib/websiteRequestSearch.mjs');
  try {
    const dependencies = process.argv.includes('--single-query') ? {
      search: (() => {
        let used = false;
        return async (input) => {
          if (used) throw new Error('Diagnostic limited to one query.');
          used = true;
          const { fetchGoogleRequestResults } = await import('../lib/dataforseo.js');
          if (process.argv.includes('--relative-window')) input = { ...input, query: '"looking for a web designer"', searchParam: '&tbs=qdr:d' };
          return fetchGoogleRequestResults(input);
        };
      })(),
    } : undefined;
    const result = await discoverWebsiteRequests({ window: 'today', platform: 'all', niche: '', location: '' }, dependencies);
    console.log(JSON.stringify({ stats: result.stats, providerCost: result.providerCost, warnings: result.warnings }));
  } catch (error) {
    const invalidField = error.providerMessage?.match(/field[:\s]+['"]?([a-z_]+)/i)?.[1];
    console.log(JSON.stringify({ error: error.message, providerStatus: error.providerStatus || null, invalidField }));
    process.exitCode = 1;
  }
})();
