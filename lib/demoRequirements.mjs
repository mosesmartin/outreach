export const DEMO_SECTIONS = ['about', 'services', 'process', 'work', 'benefits', 'faq', 'enquiry'];
export const DEMO_FEATURES = ['planner', 'motion'];
const MARKER = '\n[synergy-demo-design:v1]';
const text = (value, limit = 1200) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const strings = (value, limit = 12) => Array.isArray(value) ? [...new Set(value.filter(item => typeof item === 'string').map(item => text(item, 160)).filter(Boolean))].slice(0, limit) : [];
const allowed = (value, values, fallback = '') => values.includes(value) ? value : fallback;

export function normalizeDemoRequirements(value = {}) {
  return {
    goal: text(value.goal, 600), audience: text(value.audience, 400),
    services: strings(value.services),
    style: allowed(value.style, ['clean', 'bold', 'editorial', 'friendly']),
    theme: allowed(value.theme, ['light', 'dark']),
    layout: allowed(value.layout, ['split', 'centered', 'editorial'], 'split'),
    accent: /^#[0-9a-f]{6}$/i.test(value.accent || '') ? value.accent.toLowerCase() : '#425bea',
    sections: strings(value.sections).filter(item => DEMO_SECTIONS.includes(item)),
    features: strings(value.features).filter(item => DEMO_FEATURES.includes(item)),
    notes: text(value.notes, 2500),
  };
}

export function missingDemoRequirements(value) {
  const brief = normalizeDemoRequirements(value);
  return [!brief.goal && 'Website goal', !brief.audience && 'Target audience', !brief.services.length && 'Real business services', !brief.style && 'Visual style', !brief.theme && 'Light or dark theme', !brief.sections.includes('enquiry') && 'Contact section', !brief.sections.some(section => section !== 'enquiry') && 'At least one content section'].filter(Boolean);
}

export function normalizeGeneratedDesign(value, requirements) {
  if (!value || typeof value !== 'object') throw new Error('AI did not return a complete design. Please try again.');
  const brief = normalizeDemoRequirements(requirements);
  const required = ['intro', 'aboutTitle', 'description', 'serviceTitle', 'workTitle', 'contactTitle', 'primaryCta'];
  const copy = Object.fromEntries(required.map(key => [key, text(value[key], key === 'description' ? 2400 : 600)]));
  const headline = strings(value.headline, 2);
  const services = Array.isArray(value.services) ? value.services.map(service => ({ title: text(service?.title, 160), description: text(service?.description, 900) })) : [];
  const process = Array.isArray(value.process) ? value.process.slice(0, 4).map(item => ({ title: text(item?.title, 120), text: text(item?.text, 600) })) : [];
  const faqs = Array.isArray(value.faqs) ? value.faqs.slice(0, 6).map(item => ({ question: text(item?.question, 200), answer: text(item?.answer, 1000) })) : [];
  const projectNames = strings(value.projectNames, 3);
  if (required.some(key => !copy[key]) || headline.length !== 2 || !services.length || process.length < 3 || faqs.length < 3 || projectNames.length !== 3 || services.some(service => !service.description || !brief.services.includes(service.title)) || process.some(item => !item.title || !item.text) || faqs.some(item => !item.question || !item.answer)) {
    throw new Error('The generated design was incomplete or added services outside your brief. No demo was saved; please try again.');
  }
  if (services.length !== brief.services.length || new Set(services.map(service => service.title)).size !== brief.services.length) throw new Error('The generated design did not include every approved service. Please try again.');
  return { ...copy, headline, services, process, faqs, projectNames };
}

export function encodeDemoDesign(requirements, design) {
  const brief = normalizeDemoRequirements(requirements);
  return `Requirements-based website concept. Review its content and recipient before sharing.${MARKER}${JSON.stringify({ version: 1, requirements: brief, design: normalizeGeneratedDesign(design, brief) })}`;
}

export function readDemoDesign(report) {
  const hook = report?.gemini_hook;
  if (typeof hook !== 'string' || !hook.includes(MARKER)) return null;
  try {
    const value = JSON.parse(hook.slice(hook.indexOf(MARKER) + MARKER.length));
    if (value.version !== 1 || missingDemoRequirements(value.requirements).length) return null;
    const requirements = normalizeDemoRequirements(value.requirements);
    return { version: 1, requirements, design: normalizeGeneratedDesign(value.design, requirements) };
  } catch { return null; }
}

export function publicDemoDraft(report) {
  if (!report) return report;
  const generated = readDemoDesign(report);
  return generated ? { ...report, gemini_hook: 'Requirements-based website concept. Review before sharing.', requirements: generated.requirements } : report;
}

export function publicDesignPresentation(payload) {
  if (!payload) return null;
  const { style, theme, layout, accent, sections, features } = payload.requirements;
  return { requirements: { style, theme, layout, accent, sections, features }, design: payload.design };
}

// Decode only complete JSON string characters so real provider chunks can be
// displayed while the remaining structured response is still being generated.
export function partialAssistantReply(json) {
  const match = /"reply"\s*:\s*"/.exec(json);
  if (!match) return '';
  let output = '';
  for (let index = match.index + match[0].length; index < json.length; index++) {
    const char = json[index];
    if (char === '"') break;
    if (char !== '\\') { output += char; continue; }
    const next = json[++index];
    if (!next) break;
    if (next === 'u') {
      const hex = json.slice(index + 1, index + 5);
      if (!/^[0-9a-f]{4}$/i.test(hex)) break;
      output += String.fromCharCode(parseInt(hex, 16)); index += 4;
    } else {
      const escaped = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' };
      if (!Object.hasOwn(escaped, next)) break;
      output += escaped[next];
    }
  }
  return output;
}
