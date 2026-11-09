'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Code2, Compass, Globe, Layers, LayoutDashboard, Mail, MapPin, Menu, MessageSquare, Network, Phone, Sparkles, Workflow, X } from 'lucide-react';
import { createDemoBrief, demoBrandVariables, getDemoContent } from '../lib/demoContent.mjs';
import styles from './DemoPrototypeClient.module.css';

// Active design workflow: repository ui-ux-pro-max (interactive experience,
// step progress, keyboard focus, responsive layout and reduced-motion guidance).
// Earlier Unslop-derived craft work: Damir Sokolovsky, CC BY 4.0, https://github.com/heydamir/unslop
const ICONS = { layers: Layers, code: Code2, workflow: Workflow, network: Network, spark: Sparkles, compass: Compass, message: MessageSquare };
const NAVIGATION = [['About', '#about'], ['Services', '#services'], ['Our approach', '#process'], ['Concepts', '#work'], ['FAQs', '#faq']];
const initialsFor = name => /^synergytech/i.test(name) ? 'ST' : name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();

function trapDialogFocus(event) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (first && ((!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first) || !event.currentTarget.contains(document.activeElement))) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}

function BriefBuilder({ content, selected, onSelect, onApply }) {
  const [step, setStep] = useState(0);
  const [undecided, setUndecided] = useState(false);
  const [goal, setGoal] = useState('');
  const [timing, setTiming] = useState('');
  const [details, setDetails] = useState('');
  const [complete, setComplete] = useState(false);
  const heading = useRef(null);
  const interacted = useRef(false);
  const moveTo = next => { interacted.current = true; setStep(next); };
  useEffect(() => { if (interacted.current) heading.current?.focus({ preventScroll: true }); }, [step, complete]);
  useEffect(() => { if (selected.length) setUndecided(false); }, [selected.length]);
  const brief = createDemoBrief({ services: selected, goal, timing, details });
  return <div id="project-builder" className={styles.briefBuilder} aria-label="Interactive enquiry planner">
    <div className={styles.builderEyebrow}><span><Sparkles size={14} aria-hidden="true" />Make it your own</span><span>Interactive planner</span></div>
    <ol className={styles.builderSteps} aria-label="Planner progress">{['Services', 'Your goal', 'Timing'].map((label, index) => <li key={label} data-current={index === step} data-complete={complete || index < step}><button type="button" disabled={index > step && !complete} aria-current={!complete && index === step ? 'step' : undefined} onClick={() => { setComplete(false); moveTo(index); }}><span>{complete || index < step ? <Check size={12} aria-hidden="true" /> : index + 1}</span>{label}</button></li>)}</ol>
    <div className={styles.builderContent}>
      <h2 ref={heading} tabIndex={-1}>{complete ? 'Your brief is ready.' : ['What can we help with?', 'What’s the bigger goal?', 'When are you thinking?'][step]}</h2>
      <p>{complete ? 'Review your choices, then add them to the sample enquiry.' : ['Choose one or more services to start shaping your enquiry.', 'Choose the direction that comes closest to what you have in mind.', 'This is your preference. Availability is confirmed separately.'][step]}</p>
      {complete ? <div className={styles.briefReceipt}><span>YOUR ENQUIRY BRIEF</span><p>{brief}</p><button type="button" className={styles.builderEdit} onClick={() => { setComplete(false); moveTo(0); }}>Edit my choices</button></div>
        : step === 0 ? <div className={styles.builderOptions}>{content.services.map(service => { const Icon = ICONS[service.icon] || Layers; return <button type="button" key={service.title} aria-pressed={selected.includes(service.title)} onClick={() => { setUndecided(false); onSelect(service.title); }}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span>{service.title}</span><span className={styles.choiceCheck}>{selected.includes(service.title) && <Check size={12} aria-hidden="true" />}</span></button>; })}<button type="button" className={styles.unsureOption} aria-pressed={undecided} onClick={() => { selected.forEach(onSelect); setUndecided(!undecided); }}><Compass size={18} strokeWidth={1.5} aria-hidden="true" /><span>Help me decide</span><span className={styles.choiceCheck}>{undecided && <Check size={12} aria-hidden="true" />}</span></button></div>
          : step === 1 ? <div className={styles.builderGoal}><div className={styles.builderOptions}>{content.planningGoals.map(option => <button type="button" key={option} aria-pressed={goal === option} onClick={() => setGoal(option)}><span>{option}</span>{goal === option && <Check size={16} aria-hidden="true" />}</button>)}</div><label htmlFor="planner-detail">Anything you would like to add? <span>Optional</span></label><input id="planner-detail" value={details} onChange={event => setDetails(event.target.value)} maxLength={400} placeholder="A little context goes a long way" /></div>
            : <div className={styles.builderOptions}>{['Just exploring', 'I have a date in mind', 'My timing is flexible'].map(option => <button type="button" key={option} aria-pressed={timing === option} onClick={() => setTiming(option)}><span>{option}</span>{timing === option && <Check size={16} aria-hidden="true" />}</button>)}</div>}
    </div>
    <div className={styles.builderActions}>{step > 0 && !complete && <button type="button" className={styles.builderBack} onClick={() => moveTo(step - 1)}>Back</button>}<button type="button" className={styles.primaryAction} disabled={!complete && (step === 0 ? !selected.length && !undecided : step === 1 ? !goal : !timing)} onClick={() => { if (complete) onApply(brief); else if (step === 2) { interacted.current = true; setComplete(true); } else moveTo(step + 1); }}>{complete ? 'Use this in my enquiry' : step === 2 ? 'Create my brief' : 'Continue'}<ArrowRight size={16} aria-hidden="true" /></button></div>
    <p className={styles.builderFootnote}>{complete ? 'Your choices stay on this page. No request has been sent.' : `Step ${step + 1} of 3 · Or skip straight to the enquiry below`}</p>
  </div>;
}

function ProjectVisual({ content, index }) {
  return <div className={styles.projectVisual} data-kind={index} aria-hidden="true">
    {index === 0 ? <div className={styles.projectBrowser}><div className={styles.projectChrome}><i /><i /><i /></div><span className={styles.projectBrand}>{content.name}</span><p>{content.industry === 'technology' ? 'A clearer digital presence.' : 'Discover your next step.'}</p><span className={styles.projectButton}>Explore</span><div className={styles.projectLines}><i /><i /><i /></div></div>
      : index === 1 ? <div className={styles.projectWorkspace}><div className={styles.workspaceSide}><LayoutDashboard size={16} /><i /><i /><i /></div><div className={styles.workspaceMain}><span>A little more clarity</span><p>{content.industry === 'technology' ? 'Your work, in one place.' : 'Your visit, thoughtfully planned.'}</p>{['Explore the options', 'Consider the details', 'Take the next step'].map((text, i) => <div key={text}><span>{i + 1}</span>{text}<Check size={12} /></div>)}</div></div>
        : <div className={styles.projectWorkflow}><span className={styles.workflowNode}><Globe size={24} strokeWidth={1.5} /></span><div className={styles.workflowConnector} /><span className={styles.workflowCentre}>{initialsFor(content.name)}</span><div className={styles.workflowBranches}><span><Workflow size={18} strokeWidth={1.5} /></span><span><MessageSquare size={18} strokeWidth={1.5} /></span><span><Network size={18} strokeWidth={1.5} /></span></div><p>{content.industry === 'technology' ? 'Tools that work together.' : 'A simpler way to connect.'}</p></div>}
  </div>;
}

export default function DemoPrototypeClient({ initialLead: lead, initialDesign }) {
  const content = getDemoContent(lead, initialDesign);
  const options = initialDesign?.requirements;
  const sectionOrder = options?.sections?.length ? ['home', ...options.sections] : ['home', 'about', 'services', 'process', 'work', 'benefits', 'faq', 'enquiry'];
  const navigationLinks = sectionOrder.map(section => NAVIGATION.find(([, href]) => href === `#${section}`)).filter(Boolean);
  const planner = !options || options.features.includes('planner');
  const motion = !options || options.features.includes('motion');
  const [preview, setPreview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [activeService, setActiveService] = useState(0);
  const [projectFilter, setProjectFilter] = useState(-1);
  const [activeProject, setActiveProject] = useState(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const root = useRef(null);
  const projectDialog = useRef(null);
  const menuButton = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  const chooseService = service => { setSelectedService(service); setPreview(false); closeMenu(); };
  const toggleService = service => setSelectedServices(previous => previous.includes(service) ? previous.filter(item => item !== service) : [...previous, service]);
  const applyBrief = brief => {
    setMessageDraft(previous => previous.includes(brief) ? previous : [previous, brief].filter(Boolean).join('\n\n'));
    setSelectedService(selectedServices[0] || '');
    setPreview(false);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('enquiry')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    document.getElementById('demo-enquiry')?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (activeProject !== null) projectDialog.current?.showModal();
  }, [activeProject]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = root.current.querySelectorAll('main section[id]');
    const navigation = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id === 'home' ? '' : `#${entry.target.id}`); }), { rootMargin: '-15% 0px -65% 0px' });
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.dataset.revealed = 'true'; reveal.unobserve(entry.target); } }), { threshold: 0.08 });
    sections.forEach(section => { navigation.observe(section); if (motion && section.id !== 'home') reveal.observe(section); });
    return () => { navigation.disconnect(); reveal.disconnect(); };
  }, [motion]);
  const currentService = content.services[activeService];

  const pageSections = {
    home: (<section id="home" className={styles.hero} aria-labelledby="demo-headline">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span />{content.label}</p>
            <h1 id="demo-headline">{content.headline[0]}<br /><span>{content.headline[1]}</span></h1>
            <p className={styles.heroDescription}>{content.intro}</p>
            <div className={styles.heroActions}><a className={styles.primaryAction} href={planner ? '#project-builder' : '#enquiry'}>{content.primaryCta || 'Build my brief'}<ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>{sectionOrder.includes('services') && <a className={styles.secondaryAction} href="#services">Explore services <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>}</div>
            <div className={styles.heroMeta}><span>{content.name}</span>{content.city && <span><MapPin size={14} strokeWidth={1.5} aria-hidden="true" />{content.city}</span>}</div>
          </div>
          {planner ? <BriefBuilder content={content} selected={selectedServices} onSelect={toggleService} onApply={applyBrief} /> : <aside className={styles.heroSummary}><span>{content.category}</span><h2>{content.aboutTitle}</h2><p>{content.description}</p><div>{content.services.map(service => <a key={service.title} href={sectionOrder.includes('services') ? '#services' : '#enquiry'}><Check size={16} aria-hidden="true" />{service.title}<ArrowUpRight size={16} aria-hidden="true" /></a>)}</div></aside>}
        </div>
        {content.services.length > 0 && <div className={`${styles.container} ${styles.capabilityStrip}`}><span>What we can explore</span><div>{content.services.slice(0, 4).map(service => <span key={service.title}>{service.title}</span>)}</div></div>}
      </section>),
    about: (<section id="about" className={`${styles.container} ${styles.about}`} aria-labelledby="about-heading">
        <div><p className={styles.sectionLabel}>01 / About {content.name}</p><h2 id="about-heading">{content.aboutTitle}</h2></div>
        <div className={styles.aboutStory}><p className={styles.leadParagraph}>{content.description}</p><div className={styles.aboutFacts}><div><span>Our focus</span><strong>{content.category}</strong></div>{content.city && <div><span>Based in</span><strong>{content.city}</strong></div>}<div><span>Where to begin</span><a href="#enquiry">Your goals and requirements <ArrowUpRight size={16} aria-hidden="true" /></a></div></div></div>
      </section>),
    services: (<section id="services" className={styles.servicesSection} aria-labelledby="services-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>02 / The services</p><h2 id="services-heading">{content.serviceTitle}</h2></div><p>Explore the areas that matter to you. Each conversation starts with the work you need to do.</p></div>
          {content.suggested && <p className={styles.suggestionNote}>Suggested service labels for this concept. Confirm these against the business&apos;s actual offering before sharing.</p>}
          {currentService && <div className={styles.serviceExplorer}><div className={styles.serviceChoices} aria-label="Explore services">{content.services.map((service, index) => { const Icon = ICONS[service.icon] || Layers; return <button type="button" key={service.title} aria-pressed={activeService === index} aria-controls="service-details" onClick={() => setActiveService(index)}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><span>{service.title}</span><ArrowUpRight size={18} aria-hidden="true" /></button>; })}</div><article id="service-details" className={styles.servicePanel} aria-live="polite" aria-atomic="true"><span className={styles.panelIndex}>Explore / {String(activeService + 1).padStart(2, '0')}</span><h3>{currentService.title}</h3><p>{currentService.description}</p><div className={styles.serviceQuestions}><span>A useful starting point</span><p><Check size={16} aria-hidden="true" />What would a good outcome look like?</p><p><Check size={16} aria-hidden="true" />What details or requirements matter?</p><p><Check size={16} aria-hidden="true" />Is there a date you have in mind?</p></div><div className={styles.servicePanelActions}><a className={styles.primaryAction} href="#enquiry" onClick={() => chooseService(currentService.title)}>Discuss this service <ArrowUpRight size={16} aria-hidden="true" /></a>{planner && <a className={styles.textAction} href="#project-builder" onClick={() => { if (!selectedServices.includes(currentService.title)) toggleService(currentService.title); }}>Add to my brief <ArrowRight size={16} aria-hidden="true" /></a>}</div></article></div>}
          {!content.services.length && <div className={styles.emptyServices}><MessageSquare size={24} strokeWidth={1.5} aria-hidden="true" /><h3>Start with what you need</h3><p>The service list has not been supplied yet. Describe your requirements in the sample enquiry.</p><a className={styles.textAction} href="#enquiry">View the enquiry form <ArrowRight size={16} aria-hidden="true" /></a></div>}
        </div>
      </section>),
    process: (<section id="process" className={styles.processSection} aria-labelledby="process-heading"><div className={styles.container}>
        <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>03 / A proposed approach</p><h2 id="process-heading">A clear path from<br />the first conversation.</h2></div><p>Good decisions start with shared understanding. Here is a proposed journey for your enquiry.</p></div>
        <div className={styles.processGrid}>{content.process.map((step, index) => <article key={step.title}><span className={styles.processNumber}>{String(index + 1).padStart(2, '0')}<span />{index < content.process.length - 1 && <ArrowRight size={16} aria-hidden="true" />}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div></section>),
    work: (<section id="work" className={`${styles.container} ${styles.workSection}`} aria-labelledby="work-heading">
        <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>04 / Possibilities in practice</p><h2 id="work-heading">{content.workTitle}</h2></div><p>Three illustrative directions for this website concept. Explore an idea and use it to start a conversation.</p></div>
        <div className={styles.projectFilters} aria-label="Filter concepts"><button type="button" aria-pressed={projectFilter === -1} onClick={() => setProjectFilter(-1)}>All concepts <span>{content.projectNames.length}</span></button>{content.projectNames.map((title, index) => <button type="button" key={title} aria-pressed={projectFilter === index} onClick={() => setProjectFilter(index)}>{title}</button>)}</div>
        <div className={styles.projectGrid} data-filtered={projectFilter >= 0}>{content.projectNames.map((title, index) => (projectFilter === -1 || projectFilter === index) && <article key={title} className={styles.projectCard}><button type="button" className={styles.projectPreviewButton} aria-label={`Open concept: ${title}`} onClick={() => setActiveProject(index)}><ProjectVisual content={content} index={index} /><span>Open concept <ArrowUpRight size={18} aria-hidden="true" /></span></button><div className={styles.projectInfo}><span>Illustrative concept / {index + 1}</span><h3>{title}</h3><button type="button" className={styles.conceptDetails} onClick={() => setActiveProject(index)}>Explore this direction <ArrowUpRight size={16} aria-hidden="true" /></button></div></article>)}</div>
        <p className={styles.workDisclaimer}>Concept illustrations, not completed client projects or customer results.</p>
      </section>),
    benefits: (<section id="benefits" className={styles.benefitsSection} aria-labelledby="benefits-heading"><div className={`${styles.container} ${styles.benefitsGrid}`}><div><p className={styles.sectionLabel}>Designed around the next step</p><h2 id="benefits-heading">Less searching.<br />More understanding.</h2></div><div className={styles.benefitList}>{[{title:'The information you came for',text:'Services, business information and useful questions brought together in one place.'},{title:'An experience for any screen',text:'A responsive layout with clear navigation, readable content and accessible controls.'},{title:'One straightforward enquiry',text:'Choose a service, share the details and see how a first conversation could begin.'}].map(item => <div key={item.title}><Check size={18} strokeWidth={1.5} aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div></div></section>),
    faq: (<section id="faq" className={`${styles.container} ${styles.faqSection}`} aria-labelledby="faq-heading"><div><p className={styles.sectionLabel}>05 / Useful answers</p><h2 id="faq-heading">A few things<br />you might be wondering.</h2><p className={styles.faqIntro}>Still have a question?<br /><a className={styles.textAction} href="#enquiry">Start with an enquiry <ArrowUpRight size={16} aria-hidden="true" /></a></p></div><div className={styles.faqList}>{content.faqs.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>),
    enquiry: (<section id="enquiry" className={styles.contactSection} aria-labelledby="enquiry-heading"><div className={`${styles.container} ${styles.contactGrid}`}>
        <div className={styles.contactCopy}><p className={styles.sectionLabel}>06 / Let’s talk</p><h2 id="enquiry-heading">{content.contactTitle}</h2><p>Tell us what you have in mind. A goal, a question or an idea is a good place to start.</p><div className={styles.contactDetails}>{content.contact?.email && <a href={`mailto:${content.contact.email}`}><Mail size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Email</small>{content.contact.email}</span><ArrowUpRight size={16} aria-hidden="true" /></a>}{content.contact?.phone && <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Phone</small>{content.contact.phone}</span><ArrowUpRight size={16} aria-hidden="true" /></a>}{(content.contact?.address || content.city) && <div><MapPin size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Location</small>{content.contact?.address || content.city}</span></div>}</div><p className={styles.previewNote}>Website concept for review. The sample form does not collect or send customer requests.{content.contact && ' Public contact details are sourced from the business website.'}</p></div>
        <form className={styles.form} onSubmit={event => { event.preventDefault(); setPreview(true); }}>
          <h3>A sample enquiry</h3><p>See how the first conversation could begin.</p>
          <div className={styles.formRow}><div><label htmlFor="demo-name">Your name <span>*</span></label><input id="demo-name" placeholder="Your name" autoComplete="off" required /></div><div><label htmlFor="demo-email">Email address <span>*</span></label><input id="demo-email" type="email" placeholder="you@example.com" autoComplete="off" required /></div></div>
          <label htmlFor="demo-service">What are you interested in?</label><select id="demo-service" value={selectedService} onChange={event => { setSelectedService(event.target.value); setPreview(false); }}><option value="">Let’s discuss the options</option>{content.services.map(service => <option key={service.title} value={service.title}>{service.title}</option>)}</select>
          <label htmlFor="demo-enquiry">A little about what you need <span>*</span></label><textarea id="demo-enquiry" value={messageDraft} onChange={event => { setMessageDraft(event.target.value); setPreview(false); }} placeholder="Your goals, questions or project details…" rows={5} required />
          <button className={styles.primaryAction} type="submit">Preview enquiry <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></button><p className={styles.formNote}>Preview only · No message will be sent</p>{preview && <p role="status" className={styles.formStatus}>Preview interaction only. No enquiry was sent.</p>}
        </form>
      </div></section>),
  };

  return <div ref={root} className={styles.root} data-tone={content.tone} data-layout={options?.layout || 'split'} data-style={options?.style || 'bold'} data-appearance={options?.theme || 'legacy'} data-motion={motion ? 'on' : 'off'} style={demoBrandVariables(options?.accent, options?.theme)} onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { closeMenu(); menuButton.current?.focus(); } }}>
    <a className={styles.skipLink} href="#main-content">Skip to content</a>
    <aside className={styles.conceptBar}><span>Website concept for review</span><span>Sample experience · Enquiries are not sent from this page</span></aside>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.wordmark} href="#main-content"><span className={styles.brandMark}>{initialsFor(content.name)}</span><span>{content.name}</span></a>
        <button ref={menuButton} className={styles.menuToggle} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="demo-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}</button>
        <nav id="demo-navigation" aria-label="Main navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}>
          {navigationLinks.map(([label, href]) => <a key={href} href={href} data-active={activeSection === href} aria-current={activeSection === href ? 'location' : undefined} onClick={closeMenu}>{label}</a>)}
          <a className={styles.navAction} href="#enquiry" onClick={closeMenu}>Let’s talk <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>
        </nav>
      </div>
    </header>
    <main id="main-content">{sectionOrder.map(section => <Fragment key={section}>{pageSections[section]}</Fragment>)}</main>
    <dialog ref={projectDialog} className={styles.projectDialog} aria-labelledby="project-dialog-title" onKeyDown={trapDialogFocus} onClose={() => setActiveProject(null)} onClick={event => { if (event.target === event.currentTarget) projectDialog.current.close(); }}>
      <div className={styles.dialogContent}>{activeProject !== null && <><div className={styles.dialogHeader}><span>Illustrative concept / {activeProject + 1}</span><button type="button" autoFocus aria-label="Close concept preview" onClick={() => projectDialog.current.close()}><X size={20} aria-hidden="true" /></button></div><ProjectVisual content={content} index={activeProject} /><div className={styles.dialogBody}><h2 id="project-dialog-title">{content.projectNames[activeProject]}</h2><p>{['A clear introduction, a path through the services and a straightforward next step. This direction explores the customer-facing experience.', 'A proposed way to bring information and next steps together. This direction explores how a service journey could be organised.', 'A visual direction for connecting the steps in a customer journey. The connections shown are illustrative, not live integrations.'][activeProject]}</p><p className={styles.workDisclaimer}>Website concept only. This is not a completed client project.</p><a className={styles.primaryAction} href="#enquiry" onClick={() => { chooseService(content.services[activeProject]?.title || ''); setMessageDraft(previous => [previous, `I would like to explore the “${content.projectNames[activeProject]}” concept.`].filter(Boolean).join('\n\n')); projectDialog.current.close(); }}>Add this idea to my enquiry <ArrowUpRight size={16} aria-hidden="true" /></a></div></>}</div>
    </dialog>
    <footer className={styles.footer}><div className={styles.container}><div className={styles.footerTop}><div><a className={styles.wordmark} href="#main-content"><span className={styles.brandMark}>{initialsFor(content.name)}</span><span>{content.name}</span></a><p>{content.category}{content.city ? ` · ${content.city}` : ''}</p></div><div className={styles.footerLinks}>{navigationLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div><a className={styles.backToTop} href="#main-content">Back to top <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className={styles.footerBottom}><span>Website concept by SynergyTech Solutions</span><span>Sample content · Business details require review</span></div></div></footer>
  </div>;
}
