// Legacy lead tables lack CRM columns. Keep those values in a durable text field
// until the table is upgraded, instead of pretending a local JSON write saved them.
const OPTIONAL_COLUMNS = ['phone', 'address', 'description', 'stage', 'deal_value', 'retainer_value', 'priority', 'notes', 'follow_up_date'];
const IMPORT_MARKER = '\n[synergy-import:v1]';

function missingOptionalColumn(error) {
  if (!['PGRST204', '42703'].includes(error?.code)) return false;
  return OPTIONAL_COLUMNS.some(column => new RegExp(`['"]${column}['"]`).test(error.message || ''));
}

function legacyRecord(record) {
  const base = { ...record };
  const details = {};
  for (const column of OPTIONAL_COLUMNS) {
    if (base[column] !== undefined) details[column] = base[column];
    delete base[column];
  }
  base.status_reason = `${base.status_reason || ''}${IMPORT_MARKER}${JSON.stringify(details)}`;
  return base;
}

export function restoreImportedLead(record) {
  const reason = record?.status_reason;
  if (typeof reason !== 'string' || !reason.includes(IMPORT_MARKER)) return record;
  const position = reason.lastIndexOf(IMPORT_MARKER);
  try {
    const details = JSON.parse(reason.slice(position + IMPORT_MARKER.length));
    const restored = { ...record, status_reason: reason.slice(0, position) };
    for (const column of OPTIONAL_COLUMNS) {
      if (restored[column] == null && Object.hasOwn(details, column)) restored[column] = details[column];
    }
    return restored;
  } catch { return record; }
}

export function updateImportedLeadReason(previousReason, message) {
  const reason = String(previousReason || '');
  const position = reason.lastIndexOf(IMPORT_MARKER);
  return position < 0 ? message : message + reason.slice(position);
}

export async function persistLeadImports(database, normalizedLeads) {
  if (!database) throw Object.assign(new Error('Lead storage is not configured. No lead was saved.'), { status: 503 });
  const records = normalizedLeads.map(({ id, ...record }) => ({ ...record, email: record.email || '' }));
  let result;
  try {
    result = await database.from('leads').insert(records).select();
    // A missing column error means the first insert did not execute. Other
    // failures can have uncertain outcomes, so do not blindly retry them.
    if (missingOptionalColumn(result.error)) {
      result = await database.from('leads').insert(records.map(legacyRecord)).select();
    }
  } catch {
    throw Object.assign(new Error('Could not confirm the database save. Check the dashboard before retrying.'), { status: 503 });
  }
  if (result.error) {
    throw Object.assign(new Error('The database could not save this lead. Your form details have been kept; please try again after storage is available.'), { status: 503, code: result.error.code || 'LEAD_SAVE_FAILED' });
  }
  if (!Array.isArray(result.data) || result.data.length !== records.length || result.data.some(record => !record.id)) {
    throw Object.assign(new Error('The database did not confirm all saved leads. Refresh the dashboard before retrying.'), { status: 503 });
  }
  return result.data.map(restoreImportedLead);
}
