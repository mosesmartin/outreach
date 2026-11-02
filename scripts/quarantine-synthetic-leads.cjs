// Exact legacy fingerprints only. No deletion and no outbound email.
require('@next/env').loadEnvConfig(process.cwd());
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const { syntheticLeadReason, isPlaceholderEmail } = await import('../lib/leadSafety.mjs');
  const root = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/leads';
  const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY };
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${root}?select=*&order=id&offset=${offset}&limit=1000`, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Could not read contact records.');
    const page = await response.json(); rows.push(...page); if (page.length < 1000) break;
  }
  const matches = rows.filter(row => syntheticLeadReason(row));
  const apply = process.argv.includes('--apply');
  let changed = 0;
  if (apply) {
    for (const lead of matches) {
      if (String(lead.status_reason || '').startsWith('[QUARANTINED SYNTHETIC]')) continue;
      const reason = `[QUARANTINED SYNTHETIC] ${syntheticLeadReason(lead)} Previous status: ${lead.status}. Previous note: ${lead.status_reason || ''}`;
      const url = new URL(root); url.searchParams.set('id', 'eq.' + lead.id); url.searchParams.set('email', 'eq.' + (lead.email || ''));
      const response = await fetch(url, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ status: lead.status === 'SENT' ? 'SENT' : 'SKIPPED', status_reason: reason }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Quarantine update failed; no records were deleted.');
      changed += (await response.json()).length;
    }
    const file = path.join(process.cwd(), 'data', 'fallback_leads.json');
    if (fs.existsSync(file)) {
      const local = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const lead of local) {
        const reason = syntheticLeadReason(lead);
        if (reason && !String(lead.status_reason || '').startsWith('[QUARANTINED SYNTHETIC]')) {
          lead.status_reason = `[QUARANTINED SYNTHETIC] ${reason} Previous status: ${lead.status}. Previous note: ${lead.status_reason || ''}`;
          if (lead.status !== 'SENT') lead.status = 'SKIPPED';
        }
      }
      fs.writeFileSync(file, JSON.stringify(local, null, 2) + '\n');
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'quarantine' : 'dry-run', inspected: rows.length, matchedSynthetic: matches.length, placeholderOnlyBusinessesRetained: rows.filter(row => !syntheticLeadReason(row) && isPlaceholderEmail(row.email)).length, updated: changed, sentHistoryPreserved: true, contactFieldsModified: false, deleted: 0, emailsSent: 0 }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
