export function getServicesForNiche(niche = '') {
  const n = String(niche).toLowerCase();
  if (/\b(salon|spa|beauty|hair|barber)\b/.test(n)) return ['Haircuts & styling', 'Hair colour consultation', 'Salon appointments'];
  if (/\b(hvac|heating|air conditioning|furnace|heat pump)\b/.test(n)) return ['AC maintenance', 'Heating service', 'HVAC consultation'];
  if (/roof|contract/.test(n)) return ['Roof inspection', 'Roof repairs', 'Roof replacement consultation'];
  if (/plumb|pipe|drain/.test(n)) return ['Plumbing repairs', 'Drain service', 'Plumbing consultation'];
  if (/dent|clinic|doctor|medic/.test(n)) return ['Appointments', 'Consultations', 'Services information'];
  if (/\b(auto|car|detailing|mechanic)\b/.test(n)) return ['Vehicle detailing', 'Interior cleaning', 'Service enquiries'];
  if (/electric/.test(n)) return ['Electrical repairs', 'Electrical inspections', 'Installation enquiries'];
  if (/clean|janitor|maid/.test(n)) return ['Cleaning appointments', 'Property cleaning', 'Cleaning estimates'];
  if (/travel|tour|flight|umrah/.test(n)) return ['Travel enquiries', 'Tour information', 'Booking consultation'];
  if (/restaurant|cafe|dining|food/.test(n)) return ['Menu information', 'Reservations', 'Dining enquiries'];
  if (/real estate|realtor|property/.test(n)) return ['Property enquiries', 'Viewing appointments', 'Consultations'];
  return ['Services information', 'Appointments', 'Contact enquiries'];
}

export function demoServices(lead) {
  const actual = Array.isArray(lead.services) ? lead.services.filter((item) => typeof item === 'string' && item.trim()) : [];
  if (/\b(salon|spa|beauty|hair|barber)\b/i.test(lead.category || '') && actual.some((item) => /\b(ductwork|furnace|hvac|ac repair|heat pump)\b/i.test(item))) return { services: getServicesForNiche(lead.category), suggested: true };
  return actual.length ? { services: actual, suggested: false } : { services: getServicesForNiche(lead.category), suggested: true };
}
