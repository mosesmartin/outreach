'use client';

import { useState } from 'react';
import { ArrowRight, MapPin, Menu, X } from 'lucide-react';
import styles from './DemoPrototypeClient.module.css';

// Design pass informed by Unslop, Damir Sokolovsky (CC BY 4.0).
// https://github.com/heydamir/unslop — preserve factual content and demo-only interactions.
function presentationFor(category = '') {
  if (/salon|spa|beauty|hair|barber/i.test(category)) {
    return { tone: 'rose', headline: ['A little time', 'for yourself'], menu: 'The service edit', noun: 'Your next visit' };
  }
  if (/plumb|roof|contract|hvac|heating|electric|clean|repair|maintenance/i.test(category)) {
    return { tone: 'earth', headline: ['A good place', 'to start'], menu: 'Around your home', noun: 'Your next project' };
  }
  if (/restaurant|cafe|dining|food|travel|tour/i.test(category)) {
    return { tone: 'olive', headline: ['Make room', 'for a little more'], menu: 'Take a closer look', noun: 'Your next experience' };
  }
  if (/dent|clinic|doctor|medic|health/i.test(category)) {
    return { tone: 'ink', headline: ['Your next visit', 'starts here'], menu: 'Explore your options', noun: 'Your enquiry' };
  }
  return { tone: 'ink', headline: [category || 'Local services', 'within reach'], menu: 'A closer look', noun: 'Your next step' };
}

export default function DemoPrototypeClient({ initialLead: lead }) {
  const [preview, setPreview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const services = Array.isArray(lead.services) ? lead.services : [];
  const design = presentationFor(lead.category);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.root} data-tone={design.tone}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <aside className={styles.conceptBar}>
        <span>Website concept for review</span>
        <span>Sample content · Not the business&apos;s official booking website</span>
      </aside>

      <header className={styles.header}>
        <a className={styles.wordmark} href="#main-content">{lead.business_name}</a>
        <button className={styles.menuToggle} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="demo-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
        <nav id="demo-navigation" aria-label="Main navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}>
          <a href="#services" onClick={closeMenu}>The services</a>
          <a className={styles.navAction} href="#enquiry" onClick={closeMenu}>Preview enquiry <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>
        </nav>
      </header>

      <main id="main-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby="demo-headline">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.rule} />{lead.category || 'Local business'}{lead.city && <> / {lead.city}</>}</p>
            <h1 id="demo-headline">{design.headline[0]}<br /><span>{design.headline[1]}</span></h1>
            <p className={styles.heroDescription}>Get to know {lead.business_name}{lead.city ? ` in ${lead.city}` : ''}. Explore the services and see how a simple enquiry could begin.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#services">Explore the services <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>
              <a className={styles.textAction} href="#enquiry">View sample enquiry</a>
            </div>
            <p className={styles.heroNote}>A proposed website, shaped around your business</p>
          </div>

          <div className={styles.serviceMenu}>
            <div className={styles.menuMeta}><span>{design.menu}</span><span>Website concept</span></div>
            <p className={styles.menuName}>{lead.business_name}</p>
            <p className={styles.menuCategory}>{lead.category || 'Services & enquiries'}</p>
            {lead.services_suggested && <p className={styles.menuDisclaimer}>Suggested services · To be confirmed</p>}
            <div className={styles.menuServices}>
              {services.slice(0, 3).map((service, index) => (
                <a key={`${index}-${service}`} href="#services"><span className={styles.serviceNumber}>{index + 1}</span><span>{service}</span><ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a>
              ))}
              {!services.length && <p className={styles.emptyMenu}>The service list will be confirmed with the business.</p>}
            </div>
            <div className={styles.menuFooter}>
              {lead.city ? <span><MapPin size={16} strokeWidth={1.5} aria-hidden="true" />{lead.city}</span> : <span>Business details to confirm</span>}
              <span>Explore. Enquire.</span>
            </div>
          </div>
        </section>

        <section id="services" className={styles.services} aria-labelledby="services-heading">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>The services</p>
            <h2 id="services-heading">Find your<br />starting point.</h2>
            <p>Take a look, then ask about the details that matter to you.</p>
            {lead.services_suggested && <p className={styles.suggestionNote}>Suggested service labels for this concept. Confirm these against the business&apos;s actual offering before sharing.</p>}
          </div>
          <div className={styles.serviceList}>
            {services.map((service, index) => (
              <details key={`${index}-${service}`} className={styles.serviceDetail}>
                <summary><span className={styles.listNumber}>{index + 1}</span><h3>{service}</h3><span className={styles.expandMark} aria-hidden="true">+</span></summary>
                <div className={styles.serviceBody}><p>Service descriptions, availability and other details will be confirmed with {lead.business_name} before launch.</p><a className={styles.textAction} href="#enquiry">See a sample enquiry <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></a></div>
              </details>
            ))}
            {!services.length && <p className={styles.emptyServices}>Service information will be added after review with the business.</p>}
          </div>
        </section>

        <section id="enquiry" className={styles.enquiry} aria-labelledby="enquiry-heading">
          <div className={styles.enquiryCopy}>
            <p className={styles.sectionLabel}>{design.noun}</p>
            <h2 id="enquiry-heading">Let&apos;s start with<br />a conversation.</h2>
            <p>A short enquiry, a question about a service, or a first step towards an appointment. This is how it could look on your website.</p>
            <p className={styles.previewNote}>Preview only. No customer requests are collected or sent. Contact details and opening hours require business approval.</p>
          </div>
          <form className={styles.form} onSubmit={event => { event.preventDefault(); setPreview(true); }}>
            <p className={styles.formHeading}>A sample enquiry</p>
            <label htmlFor="demo-name">Your name</label>
            <input id="demo-name" name="sample-name" placeholder="Sample name" autoComplete="off" />
            <label htmlFor="demo-enquiry">What would you like to ask?</label>
            <textarea id="demo-enquiry" name="sample-enquiry" placeholder="Write a sample enquiry" rows={3} />
            <button className={styles.primaryAction} type="submit">Preview enquiry button <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /></button>
            <p className={styles.formNote}>Try the button. This form is a demonstration.</p>
            {preview && <p role="status" className={styles.formStatus}>Preview interaction only. No enquiry was sent.</p>}
          </form>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>{lead.business_name}</p>
        <p>Website concept by SynergyTech Solutions<br />Content and business details require review.</p>
      </footer>
    </div>
  );
}
