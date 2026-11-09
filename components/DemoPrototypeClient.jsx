'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Code2, Compass, Globe, Layers, LayoutDashboard, Mail, MapPin, Menu, MessageSquare, Network, Phone, Sparkles, Workflow, X } from 'lucide-react';
import { getDemoContent } from '../lib/demoContent.mjs';
import styles from './DemoPrototypeClient.module.css';

// Craft guidance: Unslop by Damir Sokolovsky, CC BY 4.0.
// https://github.com/heydamir/unslop
const ICONS = { layers: Layers, code: Code2, workflow: Workflow, network: Network, spark: Sparkles, compass: Compass, message: MessageSquare };
const NAVIGATION = [['About', '#about'], ['Services', '#services'], ['Our approach', '#process'], ['Concepts', '#work'], ['FAQs', '#faq']];
const initialsFor = name => /^synergytech/i.test(name) ? 'ST' : name.split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase();

function BusinessVisual({ content }) {
  return <figure className={styles.heroVisual} aria-label="Illustration of a proposed website and customer journey">
    <div className={styles.visualHeading}><span>One business. A connected experience.</span><span className={styles.visualIndex}>Concept / 01</span></div>
    <div className={styles.browserFrame}>
      <div className={styles.browserBar}><span className={styles.windowDots}><i /><i /><i /></span><span>{content.name}</span><ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" /></div>
      <div className={styles.browserPage}>
        <div className={styles.miniNav}><span className={styles.miniBrand}>{initialsFor(content.name)}</span><span>{content.category}</span><Menu size={16} strokeWidth={1.5} aria-hidden="true" /></div>
        <div className={styles.miniHero}><div><p>{content.industry === 'technology' ? 'Built around your business' : 'Your next step starts here'}</p><span>Discover the possibilities.</span><span className={styles.miniButton}>Explore services <ArrowRight size={12} aria-hidden="true" /></span></div><div className={styles.visualMonogram}>{initialsFor(content.name)}<span>Ideas into action</span></div></div>
        <div className={styles.miniServices}>{content.services.slice(0, 3).map(service => <span key={service.title}><Check size={12} aria-hidden="true" />{service.title}</span>)}</div>
      </div>
    </div>
    <div className={styles.journeyFlow}>{content.visual.map((label, index) => <div key={label}><span className={styles.flowIcon}>{index === 0 ? <Globe size={18} strokeWidth={1.5} aria-hidden="true" /> : index === 1 ? <Workflow size={18} strokeWidth={1.5} aria-hidden="true" /> : <MessageSquare size={18} strokeWidth={1.5} aria-hidden="true" />}</span><span>{label}</span>{index < 2 && <ArrowRight className={styles.flowArrow} size={16} aria-hidden="true" />}</div>)}</div>
    <figcaption>Illustrative website and workflow concept</figcaption>
  </figure>;
}

function ProjectVisual({ content, index }) {
  return <div className={styles.projectVisual} data-kind={index} aria-hidden="true">
    {index === 0 ? <div className={styles.projectBrowser}><div className={styles.projectChrome}><i /><i /><i /></div><span className={styles.projectBrand}>{content.name}</span><p>{content.industry === 'technology' ? 'A clearer digital presence.' : 'Discover your next step.'}</p><span className={styles.projectButton}>Explore</span><div className={styles.projectLines}><i /><i /><i /></div></div>
      : index === 1 ? <div className={styles.projectWorkspace}><div className={styles.workspaceSide}><LayoutDashboard size={16} /><i /><i /><i /></div><div className={styles.workspaceMain}><span>A little more clarity</span><p>{content.industry === 'technology' ? 'Your work, in one place.' : 'Your visit, thoughtfully planned.'}</p>{['Explore the options', 'Consider the details', 'Take the next step'].map((text, i) => <div key={text}><span>{i + 1}</span>{text}<Check size={12} /></div>)}</div></div>
        : <div className={styles.projectWorkflow}><span className={styles.workflowNode}><Globe size={24} strokeWidth={1.5} /></span><div className={styles.workflowConnector} /><span className={styles.workflowCentre}>{initialsFor(content.name)}</span><div className={styles.workflowBranches}><span><Workflow size={18} strokeWidth={1.5} /></span><span><MessageSquare size={18} strokeWidth={1.5} /></span><span><Network size={18} strokeWidth={1.5} /></span></div><p>{content.industry === 'technology' ? 'Tools that work together.' : 'A simpler way to connect.'}</p></div>}
  </div>;
}

export default function DemoPrototypeClient({ initialLead: lead }) {
  const content = getDemoContent(lead);
  const [preview, setPreview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const menuButton = useRef(null);
  const closeMenu = () => setMenuOpen(false);
  const chooseService = service => { setSelectedService(service); setPreview(false); closeMenu(); };

  return <div className={styles.root} data-tone={content.tone} onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { closeMenu(); menuButton.current?.focus(); } }}>
    <a className={styles.skipLink} href="#main-content">Skip to content</a>
    <aside className={styles.conceptBar}><span>Website concept for review</span><span>Sample experience · Enquiries are not sent from this page</span></aside>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.wordmark} href="#main-content"><span className={styles.brandMark}>{initialsFor(content.name)}</span><span>{content.name}</span></a>
        <button ref={menuButton} className={styles.menuToggle} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="demo-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}</button>
        <nav id="demo-navigation" aria-label="Main navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}>
          {NAVIGATION.map(([label, href]) => <a key={href} href={href} onClick={closeMenu}>{label}</a>)}
          <a className={styles.navAction} href="#enquiry" onClick={closeMenu}>Let’s talk <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>
        </nav>
      </div>
    </header>
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="demo-headline">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span />{content.label}</p>
            <h1 id="demo-headline">{content.headline[0]}<br /><span>{content.headline[1]}</span></h1>
            <p className={styles.heroDescription}>{content.intro}</p>
            <div className={styles.heroActions}><a className={styles.primaryAction} href="#enquiry">{content.industry === 'technology' ? 'Discuss your project' : 'Start a conversation'}<ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a><a className={styles.secondaryAction} href="#services">Explore services <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a></div>
            <div className={styles.heroMeta}><span>{content.name}</span>{content.city && <span><MapPin size={14} strokeWidth={1.5} aria-hidden="true" />{content.city}</span>}</div>
          </div>
          <BusinessVisual content={content} />
        </div>
        {content.services.length > 0 && <div className={`${styles.container} ${styles.capabilityStrip}`}><span>What we can explore</span><div>{content.services.slice(0, 4).map(service => <span key={service.title}>{service.title}</span>)}</div></div>}
      </section>

      <section id="about" className={`${styles.container} ${styles.about}`} aria-labelledby="about-heading">
        <div><p className={styles.sectionLabel}>01 / About {content.name}</p><h2 id="about-heading">{content.aboutTitle}</h2></div>
        <div className={styles.aboutStory}><p className={styles.leadParagraph}>{content.description}</p><div className={styles.aboutFacts}><div><span>Our focus</span><strong>{content.category}</strong></div>{content.city && <div><span>Based in</span><strong>{content.city}</strong></div>}<div><span>Where to begin</span><a href="#enquiry">Your goals and requirements <ArrowUpRight size={16} aria-hidden="true" /></a></div></div></div>
      </section>

      <section id="services" className={styles.servicesSection} aria-labelledby="services-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>02 / The services</p><h2 id="services-heading">{content.serviceTitle}</h2></div><p>Explore the areas that matter to you. Each conversation starts with the work you need to do.</p></div>
          {content.suggested && <p className={styles.suggestionNote}>Suggested service labels for this concept. Confirm these against the business&apos;s actual offering before sharing.</p>}
          <div className={styles.serviceGrid}>{content.services.map((service, index) => { const Icon = ICONS[service.icon] || Layers; return <article key={service.title} className={styles.serviceCard}><div className={styles.serviceCardTop}><span className={styles.serviceIcon}><Icon size={24} strokeWidth={1.5} aria-hidden="true" /></span><span>{String(index + 1).padStart(2, '0')}</span></div><h3>{service.title}</h3><p>{service.description}</p><a href="#enquiry" onClick={() => chooseService(service.title)}>Discuss this service <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" /></a></article>; })}</div>
          {!content.services.length && <div className={styles.emptyServices}><MessageSquare size={24} strokeWidth={1.5} aria-hidden="true" /><h3>Start with what you need</h3><p>The service list has not been supplied yet. Describe your requirements in the sample enquiry.</p><a className={styles.textAction} href="#enquiry">View the enquiry form <ArrowRight size={16} aria-hidden="true" /></a></div>}
        </div>
      </section>

      <section id="process" className={styles.processSection} aria-labelledby="process-heading"><div className={styles.container}>
        <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>03 / A proposed approach</p><h2 id="process-heading">A clear path from<br />the first conversation.</h2></div><p>Good decisions start with shared understanding. Here is a proposed journey for your enquiry.</p></div>
        <div className={styles.processGrid}>{content.process.map((step, index) => <article key={step.title}><span className={styles.processNumber}>{String(index + 1).padStart(2, '0')}<span />{index < content.process.length - 1 && <ArrowRight size={16} aria-hidden="true" />}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div></section>

      <section id="work" className={`${styles.container} ${styles.workSection}`} aria-labelledby="work-heading">
        <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>04 / Possibilities in practice</p><h2 id="work-heading">{content.workTitle}</h2></div><p>Three illustrative directions for this website concept. Explore an idea and use it to start a conversation.</p></div>
        <div className={styles.projectGrid}>{content.projectNames.map((title, index) => <article key={title} className={styles.projectCard}><ProjectVisual content={content} index={index} /><div className={styles.projectInfo}><span>Illustrative concept / {index + 1}</span><h3>{title}</h3><a href="#enquiry" onClick={() => chooseService(content.services[index]?.title || '')}>Explore this direction <ArrowUpRight size={16} aria-hidden="true" /></a></div></article>)}</div>
        <p className={styles.workDisclaimer}>Concept illustrations, not completed client projects or customer results.</p>
      </section>

      <section className={styles.benefitsSection} aria-labelledby="benefits-heading"><div className={`${styles.container} ${styles.benefitsGrid}`}><div><p className={styles.sectionLabel}>Designed around the next step</p><h2 id="benefits-heading">Less searching.<br />More understanding.</h2></div><div className={styles.benefitList}>{[{title:'The information you came for',text:'Services, business information and useful questions brought together in one place.'},{title:'An experience for any screen',text:'A responsive layout with clear navigation, readable content and accessible controls.'},{title:'One straightforward enquiry',text:'Choose a service, share the details and see how a first conversation could begin.'}].map(item => <div key={item.title}><Check size={18} strokeWidth={1.5} aria-hidden="true" /><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}</div></div></section>

      <section id="faq" className={`${styles.container} ${styles.faqSection}`} aria-labelledby="faq-heading"><div><p className={styles.sectionLabel}>05 / Useful answers</p><h2 id="faq-heading">A few things<br />you might be wondering.</h2><p className={styles.faqIntro}>Still have a question?<br /><a className={styles.textAction} href="#enquiry">Start with an enquiry <ArrowUpRight size={16} aria-hidden="true" /></a></p></div><div className={styles.faqList}>{content.faqs.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>

      <section id="enquiry" className={styles.contactSection} aria-labelledby="enquiry-heading"><div className={`${styles.container} ${styles.contactGrid}`}>
        <div className={styles.contactCopy}><p className={styles.sectionLabel}>06 / Let’s talk</p><h2 id="enquiry-heading">{content.contactTitle}</h2><p>Tell us what you have in mind. A goal, a question or an idea is a good place to start.</p><div className={styles.contactDetails}>{content.contact?.email && <a href={`mailto:${content.contact.email}`}><Mail size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Email</small>{content.contact.email}</span><ArrowUpRight size={16} aria-hidden="true" /></a>}{content.contact?.phone && <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Phone</small>{content.contact.phone}</span><ArrowUpRight size={16} aria-hidden="true" /></a>}{(content.contact?.address || content.city) && <div><MapPin size={18} strokeWidth={1.5} aria-hidden="true" /><span><small>Location</small>{content.contact?.address || content.city}</span></div>}</div><p className={styles.previewNote}>Website concept for review. The sample form does not collect or send customer requests.{content.contact && ' Public contact details are sourced from the business website.'}</p></div>
        <form className={styles.form} onSubmit={event => { event.preventDefault(); setPreview(true); }}>
          <h3>A sample enquiry</h3><p>See how the first conversation could begin.</p>
          <div className={styles.formRow}><div><label htmlFor="demo-name">Your name <span>*</span></label><input id="demo-name" placeholder="Your name" autoComplete="off" required /></div><div><label htmlFor="demo-email">Email address <span>*</span></label><input id="demo-email" type="email" placeholder="you@example.com" autoComplete="off" required /></div></div>
          <label htmlFor="demo-service">What are you interested in?</label><select id="demo-service" value={selectedService} onChange={event => { setSelectedService(event.target.value); setPreview(false); }}><option value="">Let’s discuss the options</option>{content.services.map(service => <option key={service.title} value={service.title}>{service.title}</option>)}</select>
          <label htmlFor="demo-enquiry">A little about what you need <span>*</span></label><textarea id="demo-enquiry" placeholder="Your goals, questions or project details…" rows={4} required />
          <button className={styles.primaryAction} type="submit">Preview enquiry <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></button><p className={styles.formNote}>Preview only · No message will be sent</p>{preview && <p role="status" className={styles.formStatus}>Preview interaction only. No enquiry was sent.</p>}
        </form>
      </div></section>
    </main>
    <footer className={styles.footer}><div className={styles.container}><div className={styles.footerTop}><div><a className={styles.wordmark} href="#main-content"><span className={styles.brandMark}>{initialsFor(content.name)}</span><span>{content.name}</span></a><p>{content.category}{content.city ? ` · ${content.city}` : ''}</p></div><div className={styles.footerLinks}>{NAVIGATION.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div><a className={styles.backToTop} href="#main-content">Back to top <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className={styles.footerBottom}><span>Website concept by SynergyTech Solutions</span><span>Sample content · Business details require review</span></div></div></footer>
  </div>;
}
