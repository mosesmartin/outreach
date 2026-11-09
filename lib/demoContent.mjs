// Public first-party information, checked 2026-11-09. This profile corrects the
// old form defaults for our own business without changing the saved lead.
// Source: https://synergytechsol.com/ (page title, business description, footer).
const SYNERGY = {
  name: 'SynergyTech Solutions', category: 'IT consulting & digital solutions',
  city: 'St. Charles, Illinois',
  description: 'SynergyTech Solutions brings SaaS implementation, IT consulting, workflow automation and digital infrastructure together. The focus is connecting the technology your customers see with the systems your business uses every day.',
  services: ['SaaS implementation', 'IT consulting', 'Workflow automation', 'Digital infrastructure'],
  contact: { email: 'contact@synergytechsol.com', phone: '+1 (815) 219-1969', address: '284 Remington Drive, St. Charles, IL 60175, US', website: 'https://synergytechsol.com' },
};

function industryFor(category) {
  if (/\b(technology|tech|software|saas|digital|websites?|web|it|development|automation)\b/i.test(category)) return 'technology';
  if (/\b(salon|spa|beauty|hair|barber)\b/i.test(category)) return 'beauty';
  if (/\b(dental|dentist|clinic|medical|health)\b/i.test(category)) return 'health';
  if (/\b(restaurant|cafe|dining|food|travel|tour)\b/i.test(category)) return 'hospitality';
  if (/plumb|roof|contract|hvac|heating|electric|clean|repair|maintenance/i.test(category)) return 'trades';
  return 'general';
}

const DIRECTIONS = {
  technology: { tone: 'blue', label: 'Technology, with a purpose', headline: ['The right technology.', 'A stronger business.'], intro: 'Connect your digital presence, your tools and your day-to-day operations. Start with what your business needs to do next.', aboutTitle: 'Good technology brings the whole business together.', serviceTitle: 'From the first idea to the systems behind it.', workTitle: 'See what a connected business could look like.', contactTitle: 'Let’s build what’s next.', visual: ['Your website', 'Your workflow', 'Your team'], projectNames: ['A customer-facing website', 'An operations workspace', 'A connected workflow'] },
  beauty: { tone: 'rose', label: 'A little time, just for you', headline: ['Your next visit.', 'Your kind of style.'], intro: 'Explore the services, find your inspiration and take the first step towards your next appointment.', aboutTitle: 'A space to discover your next look.', serviceTitle: 'Find the right service for your next visit.', workTitle: 'A closer look at the experience.', contactTitle: 'Make time for your next visit.', visual: ['Explore services', 'Choose your visit', 'Get in touch'], projectNames: ['Discover the services', 'Plan your appointment', 'Find your inspiration'] },
  health: { tone: 'teal', label: 'Information for your next visit', headline: ['A clearer first step.', 'A more informed visit.'], intro: 'Find service information and a straightforward way to ask about your next appointment.', aboutTitle: 'Helpful information, before you visit.', serviceTitle: 'Explore the services and your next steps.', workTitle: 'A simpler journey from question to visit.', contactTitle: 'Start with your questions.', visual: ['Explore services', 'Plan your visit', 'Ask a question'], projectNames: ['Service information', 'Your first visit', 'Appointment enquiries'] },
  hospitality: { tone: 'olive', label: 'Something to look forward to', headline: ['Make your next plan', 'a little more memorable.'], intro: 'Explore what is on offer, discover the details and start planning your next experience.', aboutTitle: 'Get to know the place behind your next plan.', serviceTitle: 'Find something that feels like your kind of plan.', workTitle: 'Explore the possibilities.', contactTitle: 'Tell us what you have in mind.', visual: ['Discover', 'Explore the options', 'Make an enquiry'], projectNames: ['Discover the experience', 'Explore your options', 'Plan your next visit'] },
  trades: { tone: 'earth', label: 'Start with the job in hand', headline: ['Your next project.', 'A clearer way forward.'], intro: 'Explore the services and share what needs attention. A useful first conversation starts with the details of your project.', aboutTitle: 'The right information for the work ahead.', serviceTitle: 'What do you need a hand with?', workTitle: 'A closer look at your next project.', contactTitle: 'Let’s talk about the job.', visual: ['Your project', 'The right service', 'Your enquiry'], projectNames: ['Understand the job', 'Explore the service', 'Plan the next step'] },
  general: { tone: 'blue', label: 'Get to know the business', headline: ['The right place', 'for your next step.'], intro: 'Discover the services, learn more about the business and find a straightforward way to get in touch.', aboutTitle: 'A little more about the business behind the name.', serviceTitle: 'Explore what you came here to find.', workTitle: 'A closer look at the possibilities.', contactTitle: 'Let’s start a conversation.', visual: ['Discover', 'Explore services', 'Get in touch'], projectNames: ['Discover the business', 'Explore the services', 'Plan your next step'] },
};

function serviceDescription(title) {
  if (/saas|implementation/i.test(title)) return 'Bring your software requirements into focus. Explore configuration, integration and the steps involved in putting a platform to work.';
  if (/consult|strategy/i.test(title)) return 'Start with the requirements, the questions and the trade-offs. Discuss the options before deciding on a direction.';
  if (/automat|workflow/i.test(title)) return 'Look at the handoffs and repetitive steps in daily work. Explore how your tools and processes could connect.';
  if (/infrastructure|integration/i.test(title)) return 'Consider the systems behind your digital services. Discuss how they fit together and what your next stage needs.';
  if (/web|design|development/i.test(title)) return 'Explore the experience, the features and the content your customers need. Shape a clear brief for the work ahead.';
  if (/hair|styling|colour|color/i.test(title)) return 'Explore your preferences and the look you have in mind. Ask about the available options before planning a visit.';
  if (/maintenance|inspection/i.test(title)) return 'Share the current condition, any concerns and the information you already have. Ask what the next step involves.';
  if (/repair|drain|heating|plumbing/i.test(title)) return 'Describe what needs attention and where the work is needed. Include useful details when asking about the service.';
  if (/clean|detailing/i.test(title)) return 'Tell us about the space or item, its condition and what you want to focus on. Discuss the details of the service.';
  if (/appointment|visit|reservation/i.test(title)) return 'Ask about availability, what to prepare and the details of your visit. Confirm arrangements directly with the business.';
  return `Learn more about ${title.toLowerCase()} and discuss your requirements. Ask about scope, availability and the details that matter to you.`;
}

export function getDemoContent(lead = {}, generated = null) {
  const key = String(lead.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const profile = ['synergytechsol', 'synergytechsolutions', 'synergytechsolutionsllc'].includes(key) ? SYNERGY : null;
  const name = profile?.name || lead.business_name || 'Your business';
  const category = profile?.category || lead.category || 'Services';
  const city = profile?.city || (/^(local area|unknown)$/i.test(lead.city || '') ? '' : lead.city || '');
  const provided = Array.isArray(lead.services) ? lead.services.filter(service => typeof service === 'string' && service.trim()).map(service => service.trim()) : [];
  const industry = industryFor(`${category} ${provided.join(' ')}`);
  const direction = DIRECTIONS[industry];
  const titles = profile && (lead.services_suggested || !provided.length) ? profile.services : provided;
  const services = [...new Set(titles)].map((title, index) => ({ title, description: serviceDescription(title), icon: industry === 'technology' ? ['layers', 'code', 'workflow', 'network'][index % 4] : ['spark', 'layers', 'compass', 'message'][index % 4] }));
  const content = {
    ...direction, industry, name, category, city, services,
    planningGoals: industry === 'technology' ? ['Launch something new', 'Connect existing tools', 'Improve a process', 'Explore the options'] : industry === 'beauty' ? ['Explore a new look', 'Plan a visit', 'Discuss a service', 'Ask a question'] : industry === 'trades' ? ['Discuss a repair', 'Plan a project', 'Arrange maintenance', 'Explore the options'] : ['Explore the services', 'Plan a visit or project', 'Discuss my requirements', 'Ask a question'],
    suggested: !profile && Boolean(lead.services_suggested),
    description: profile?.description || lead.description?.trim() || `${name}${city ? ` in ${city}` : ''} is a place to explore ${category.toLowerCase()} and ask about your requirements. Browse the services, consider your options and take the next step with a clear enquiry.`,
    contact: profile?.contact || null,
    process: [
      { title: 'Start with a conversation', text: 'Share what you are looking for, what matters to you and any useful background.' },
      { title: 'Make the details clear', text: 'Discuss the scope, the available options and the questions that need an answer.' },
      { title: 'Agree on the next step', text: 'Confirm the arrangements, the expected work and any decisions before proceeding.' },
      { title: 'Keep the conversation going', text: 'Review the details together and ask about anything that needs a closer look.' },
    ],
    faqs: [
      { question: 'What services can I ask about?', answer: services.length ? `Start with ${services.map(service => service.title).join(', ')}. Use the enquiry form to explain which service you are interested in and what you need.` : 'Use the enquiry form to describe what you need. The service list for this concept still needs to be confirmed with the business.' },
      { question: industry === 'technology' ? 'What should I include in a project brief?' : 'What details should I include in my enquiry?', answer: industry === 'technology' ? 'Describe your business, the problem you want to solve, your existing tools and any important dates. A starting budget and examples you like can help shape the discussion.' : 'Include the service you are interested in, your location if relevant, any preferences and useful dates. You can also explain the questions you would like answered.' },
      { question: 'How is pricing worked out?', answer: 'Pricing depends on the scope and requirements. Ask for an estimate and confirm what is included before agreeing to proceed. This concept does not advertise unverified prices.' },
      { question: 'How do I check availability or timing?', answer: 'Include your preferred dates and any deadlines in the enquiry. Timing and availability need to be confirmed directly with the business.' },
      { question: 'Can I send a real request from this page?', answer: 'This is a website concept for review. The form demonstrates the enquiry experience and does not collect or send customer requests.' },
    ],
  };
  if (!generated?.design) return content;
  const design = generated.design;
  return { ...content, headline: design.headline, intro: design.intro, aboutTitle: design.aboutTitle, description: design.description, serviceTitle: design.serviceTitle, workTitle: design.workTitle, contactTitle: design.contactTitle, primaryCta: design.primaryCta, process: design.process, faqs: design.faqs, projectNames: design.projectNames, suggested: false, services: design.services.map((service, index) => ({ ...service, icon: ['layers', 'code', 'workflow', 'network'][index % 4] })) };
}

export function demoBrandVariables(color, theme = 'dark') {
  if (!/^#[0-9a-f]{6}$/i.test(color || '')) return {};
  const rgb = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  const hex = values => '#' + values.map(value => Math.round(value).toString(16).padStart(2, '0')).join('');
  const luminance = values => values.map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  let readable = [...rgb];
  for (let step = 0; step < 24 && 1.05 / (luminance(readable) + .05) < 4.5; step++) readable = readable.map(value => value * .9);
  return { '--accent': hex(readable), '--accent-light': theme === 'dark' ? hex(rgb.map(value => value * .14 + 20)) : hex(rgb.map(value => value * .1 + 255 * .9)), '--hero-accent': theme === 'dark' ? hex(rgb.map(value => value * .4 + 255 * .6)) : hex(readable) };
}

export function createDemoBrief({ services = [], goal = '', timing = '', details = '' } = {}) {
  const selected = services.filter(service => typeof service === 'string' && service.trim()).map(service => service.trim());
  return [
    `Interested in: ${selected.length ? selected.join(', ') : 'Help choosing the right service'}`,
    goal.trim() && `My goal: ${goal.trim()}`,
    timing.trim() && `Preferred timing: ${timing.trim()}`,
    details.trim() && `Additional details: ${details.trim()}`,
  ].filter(Boolean).join('\n');
}
