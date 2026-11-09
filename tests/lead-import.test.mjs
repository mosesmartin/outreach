import test from 'node:test';
import assert from 'node:assert/strict';
import { persistLeadImports, restoreImportedLead, updateImportedLeadReason } from '../lib/leadImport.mjs';
import { leadFingerprint } from '../lib/manualDemo.mjs';

const fixture = {
  id: 'local-only-id', business_name: 'synergy', business_slug: 'synergy', owner_name: 'Team',
  email: null, phone: '+1 512 555 0100', category: 'Local Services', city: 'Dallas, TX',
  services: ['Consultations'], address: 'A supplied address', description: 'Supplied business details',
  status: 'PENDING', status_reason: 'Imported contact. Demo not generated. Phone: +1 512 555 0100',
  stage: 'NEW_LEAD', deal_value: 0, retainer_value: 0, priority: 'MEDIUM',
  notes: [{ text: 'Imported contact' }], follow_up_date: null,
};
const databaseId = '11111111-1111-4111-8111-111111111111';
function databaseWith(insert) {
  const attempts = [];
  return { attempts, from(table) { assert.equal(table, 'leads'); return { insert(records) { attempts.push(structuredClone(records)); return { select: () => insert(records, attempts.length) }; } }; } };
}

test('Full schema import returns only persisted records with database IDs', async () => {
  const database = databaseWith(async records => ({ data: records.map(record => ({ ...record, id: databaseId })), error: null }));
  const saved = await persistLeadImports(database, [fixture]);
  assert.equal(saved[0].id, databaseId);
  assert.equal(saved[0].phone, fixture.phone);
  assert.equal(saved[0].email, '');
  assert.equal(database.attempts[0][0].id, undefined);
  assert.equal(database.attempts.length, 1);
});

test('Actual legacy schema rejects description; retry persists every supplied value and survives a fresh read', async () => {
  let persisted;
  const database = databaseWith(async (records, attempt) => {
    if (attempt === 1) return { data: null, error: { code: 'PGRST204', message: "Could not find the 'description' column of 'leads' in the schema cache" } };
    assert.equal(Object.hasOwn(records[0], 'description'), false);
    assert.equal(Object.hasOwn(records[0], 'phone'), false);
    persisted = { ...records[0], id: databaseId };
    return { data: [persisted], error: null };
  });
  const saved = await persistLeadImports(database, [fixture]);
  const reloaded = restoreImportedLead(JSON.parse(JSON.stringify(persisted)));
  for (const field of ['phone', 'address', 'description', 'stage', 'notes', 'services']) assert.deepEqual(reloaded[field], fixture[field]);
  assert.deepEqual(saved[0], reloaded);
  assert.equal(reloaded.status_reason, fixture.status_reason);
  assert.equal(database.attempts.length, 2);
  assert.equal(leadFingerprint(persisted), leadFingerprint(reloaded), 'demo drafts remain valid before and after reading restored fields');
  const afterSend = restoreImportedLead({ ...persisted, status: 'SENT', status_reason: updateImportedLeadReason(persisted.status_reason, 'Reviewed demo invitation accepted by SMTP.') });
  assert.equal(afterSend.phone, fixture.phone, 'sending a reviewed invitation preserves contact details');
});

test('Storage missing or both insert attempts failing never report success', async () => {
  await assert.rejects(persistLeadImports(null, [fixture]), error => error.status === 503);
  const database = databaseWith(async (_, attempt) => ({ data: null, error: attempt === 1 ? { code: 'PGRST204', message: "Missing 'phone' column" } : { code: '42501', message: 'Permission denied' } }));
  await assert.rejects(persistLeadImports(database, [fixture]), error => error.status === 503 && error.code === '42501');
  assert.equal(database.attempts.length, 2);
});

test('Uncertain network failures and constraint errors are not retried as schema errors', async () => {
  const failed = databaseWith(async () => { throw new Error('connection reset'); });
  await assert.rejects(persistLeadImports(failed, [fixture]), /Check the dashboard before retrying/);
  assert.equal(failed.attempts.length, 1);
  const duplicate = databaseWith(async () => ({ data: null, error: { code: '23505', message: 'duplicate key' } }));
  await assert.rejects(persistLeadImports(duplicate, [fixture]), error => error.status === 503);
  assert.equal(duplicate.attempts.length, 1);
});

test('Empty, partial or unidentified insert results do not falsely confirm an import', async () => {
  for (const data of [null, [], [{ business_name: 'synergy' }]]) {
    await assert.rejects(persistLeadImports(databaseWith(async () => ({ data, error: null })), [fixture]), error => error.status === 503);
  }
  await assert.rejects(persistLeadImports(databaseWith(async () => ({ data: [{ id: databaseId }], error: null })), [fixture, fixture]), error => error.status === 503);
});

test('Legacy metadata cannot overwrite canonical business fields; broken metadata remains readable', () => {
  const record = { business_name: 'Original', status_reason: 'Imported\n[synergy-import:v1]{"business_name":"Changed","phone":"123"}' };
  assert.equal(restoreImportedLead(record).business_name, 'Original');
  assert.equal(restoreImportedLead(record).phone, '123');
  const broken = { status_reason: 'Imported\n[synergy-import:v1]invalid JSON' };
  assert.deepEqual(restoreImportedLead(broken), broken);
});
