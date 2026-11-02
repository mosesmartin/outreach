const adjectives = ['Apex','Summit','Vanguard','Precision','Elite','Titan','Prime','Artisan','Crown','Silverline','Eagle','Liberty','Lone Star','Heritage','Beacon','Atlas','Paramount','Pinnacle','Sterling','Velocity'];
const firstNames = ['Marcus','David','Sarah','Carlos','Michael','Elena','Tyler','Robert','Derrick','Sophia','Anthony','Rachel','James','Daniel','Victoria','Brandon','Jessica','Jonathan','Natalie','Gabriel'];
const lastNames = ['Vance','Miller','Jenkins','Rodriguez','Chen','Rostova','Brooks','Alvarez','Kowalski','Rossi','Sterling','Hayes','Carter','Peterson','Washington','Navarro','Bennett','Morales','Fischer','Sullivan'];

export function syntheticLeadReason(lead = {}) {
  if (String(lead.status_reason || '').startsWith('[QUARANTINED SYNTHETIC]')) return 'Blocked historical simulated contact. Re-import verified business details as a new lead.';
  if (lead.is_simulated === true || lead.isSimulated === true || /^(?:simulation|synthetic)$/i.test(lead.source || '')) return 'Simulated lead; contact details are not sourced from a real business.';
  const name = String(lead.business_name || '');
  const owner = String(lead.owner_name || '');
  const email = String(lead.email || '').toLowerCase();
  // Exact historical fingerprints, not a blanket rule against digits in emails.
  for (let i = 0; i < 500; i++) {
    const prefix = `${adjectives[i % 20]} `;
    const suffix = i >= 20 ? ` ${Math.floor(i / 20) + 1}` : '';
    const expectedOwner = `${firstNames[i % 20]} ${lastNames[(i + 3) % 20]}`;
    if (!name.startsWith(prefix) || (suffix && !name.endsWith(suffix)) || owner !== expectedOwner) continue;
    if (!name.slice(prefix.length, suffix ? -suffix.length : undefined)) continue;
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, '-and-').replace(/[^\w-]+/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const first = firstNames[i % 20].toLowerCase();
    const last = lastNames[(i + 3) % 20].toLowerCase();
    const expected = [`${first}.${last}${i > 0 ? i : ''}@gmail.com`, `${first}.${last}@${slug}.com`, `contact@${slug}.com`];
    if (expected.includes(email)) return 'Blocked: contact matches the old simulated lead generator. Its numeric suffix was a generated counter, not an extracted business email.';
  }
  return null;
}

export function isPlaceholderEmail(email) {
  return String(email || '').toLowerCase().endsWith('@leads.synergytechsol.com');
}

export function leadContactSafety(lead) {
  const reason = syntheticLeadReason(lead);
  return { blocked: Boolean(reason), reason, emailBlocked: Boolean(reason) || isPlaceholderEmail(lead.email), emailIdentityVerified: false };
}
