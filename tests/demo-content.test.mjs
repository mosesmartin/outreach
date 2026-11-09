import test from 'node:test';
import assert from 'node:assert/strict';
import { getDemoContent } from '../lib/demoContent.mjs';

test('The shared SynergyTech lead uses public technology content instead of the old form defaults', () => {
  const saved = { business_name: 'synergytechsol', category: 'Home & Commercial Services', city: 'Dallas, TX', services: ['Services information', 'Appointments', 'Contact enquiries'], services_suggested: true };
  const original = structuredClone(saved);
  const content = getDemoContent(saved);
  assert.equal(content.industry, 'technology');
  assert.equal(content.name, 'SynergyTech Solutions');
  assert.equal(content.city, 'St. Charles, Illinois');
  assert.deepEqual(content.services.map(service => service.title), ['SaaS implementation', 'IT consulting', 'Workflow automation', 'Digital infrastructure']);
  assert.equal(content.contact.website, 'https://synergytechsol.com');
  assert.deepEqual(saved, original, 'presentation changes do not alter saved contacts or invalidate draft access');
});

test('Unrelated businesses keep their own services and description and do not expose private contacts', () => {
  const lead = { business_name: 'Synergy Hair Studio', category: 'Hair Salon', city: 'Austin, TX', services: ['Haircuts', 'Haircuts', 'Colour consultation'], description: 'A supplied business description.', email: 'private@example.test', phone: 'private-number' };
  const content = getDemoContent(lead);
  assert.equal(content.industry, 'beauty');
  assert.deepEqual(content.services.map(service => service.title), ['Haircuts', 'Colour consultation']);
  assert.equal(content.description, lead.description);
  assert.equal(content.contact, null);
  assert.equal(JSON.stringify(content).includes('private@example.test'), false);
});

test('Missing business data stays missing rather than inventing services, location or customer proof', () => {
  const content = getDemoContent({ business_name: 'Example Local Business', city: 'Local Area', services: [] });
  assert.equal(content.city, '');
  assert.deepEqual(content.services, []);
  assert.equal(content.contact, null);
  assert.equal(content.reviews, undefined);
  assert.equal(content.prices, undefined);
  assert.equal(content.projectNames.length, 3, 'only explicitly illustrative directions are provided');
});

test('Specific service content distinguishes technology from trades without substring matches', () => {
  assert.equal(getDemoContent({ category: 'IT Services', services: ['Software development'] }).industry, 'technology');
  assert.equal(getDemoContent({ category: 'Hair Salon', services: ['Haircuts'] }).industry, 'beauty');
  assert.equal(getDemoContent({ category: 'Plumbing', services: ['Drain repairs'] }).industry, 'trades');
  const confirmed = getDemoContent({ business_name: 'synergytechsol', services: ['Custom IT consultation'], services_suggested: false });
  assert.deepEqual(confirmed.services.map(service => service.title), ['Custom IT consultation'], 'sourced fallback services do not replace supplied services');
});
