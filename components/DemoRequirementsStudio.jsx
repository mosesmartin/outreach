'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowRight, ArrowUp, Check, Loader2, MessageSquare, Send, Sparkles, Square, X } from 'lucide-react';
import { DEMO_SECTIONS, missingDemoRequirements, normalizeDemoRequirements } from '../lib/demoRequirements.mjs';
import { readDemoEvents } from '../lib/demoStreamClient.mjs';
import styles from './DemoRequirementsStudio.module.css';

const sectionLabels = { about: 'About', services: 'Services', process: 'Process', work: 'Concept examples', benefits: 'Benefits', faq: 'FAQs', enquiry: 'Contact' };
const greeting = name => ({ role: 'assistant', local: true, content: `Let’s design the website for ${name}. What should it help the business achieve, and who is it for? Tell me any colors, sections, references or features you already have in mind. I’ll ask about anything important that is missing before we generate.` });

export default function DemoRequirementsStudio({ open, lead, initialRequirements, onClose, onGenerated }) {
  const [messages, setMessages] = useState(() => [greeting(lead.business_name)]);
  const [requirements, setRequirements] = useState(() => normalizeDemoRequirements(initialRequirements || { services: lead.services || [], sections: ['about', 'services', 'faq', 'enquiry'], features: ['planner', 'motion'] }));
  const [serviceText, setServiceText] = useState(() => (initialRequirements?.services || lead.services || []).join('\n'));
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [generationReply, setGenerationReply] = useState('');
  const panel = useRef(null), log = useRef(null), composer = useRef(null), request = useRef(null), locked = useRef(false), follow = useRef(true);
  const busy = Boolean(phase);
  const missing = missingDemoRequirements(requirements);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    composer.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { request.current?.abort(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = [...(panel.current?.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]') || [])].filter(element => element.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { request.current?.abort(); document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [open]);
  useEffect(() => { if (follow.current && log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, phase]);
  const edit = (field, value) => setRequirements(previous => ({ ...previous, [field]: value }));
  const toggleSection = section => edit('sections', requirements.sections.includes(section) ? requirements.sections.filter(item => item !== section) : [...requirements.sections, section]);
  const moveSection = (index, direction) => { const sections = [...requirements.sections]; const next = index + direction; if (next < 0 || next >= sections.length) return; [sections[index], sections[next]] = [sections[next], sections[index]]; edit('sections', sections); };

  async function chat(event) {
    event?.preventDefault();
    const prompt = input.trim();
    if (!prompt || locked.current) return;
    locked.current = true; setPhase('understanding'); setError(''); setInput(''); follow.current = true;
    const history = [...messages.filter(message => !message.local && !message.failed).map(({ role, content }) => ({ role, content })), { role: 'user', content: prompt }].slice(-24);
    setMessages(previous => [...previous, { role: 'user', content: prompt }, { role: 'assistant', content: '', streaming: true }]);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch('/api/leads/demo-session', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ leadId: lead.id, messages: history, requirements }), signal: controller.signal });
      const result = await readDemoEvents(response, (type, data) => {
        if (type === 'delta') setMessages(previous => previous.map((message, index) => index === previous.length - 1 ? { ...message, content: message.content + data.delta } : message));
      });
      setRequirements(normalizeDemoRequirements(result.requirements));
      setServiceText(normalizeDemoRequirements(result.requirements).services.join('\n'));
      setMessages(previous => previous.map((message, index) => index === previous.length - 1 ? { role: 'assistant', content: result.reply } : message));
    } catch (failure) {
      setError(failure.name === 'AbortError' ? 'Stopped. Your answers and current brief are still here.' : failure.message);
      setInput(current => current || prompt);
      setMessages(previous => previous.map((message, index) => index === previous.length - 1 ? { ...message, content: message.content || 'No response was completed. Your current brief has been kept.', streaming: false, failed: true } : message));
    } finally { locked.current = false; setPhase(''); request.current = null; }
  }

  async function generate() {
    if (locked.current || missing.length) return;
    locked.current = true; setPhase('designing'); setError(''); setGenerationReply('');
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch('/api/leads/generate-demo', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ leadId: lead.id, requirements: normalizeDemoRequirements(requirements) }), signal: controller.signal });
      const result = await readDemoEvents(response, (type, data) => { if (type === 'stage') setPhase(data.stage); if (type === 'delta') setGenerationReply(previous => previous + data.delta); });
      if (!result.draft?.id) throw new Error('The server did not confirm a saved demo. Check the latest draft before retrying.');
      onGenerated(result);
    } catch (failure) { setError(failure.name === 'AbortError' ? 'Stopped waiting. Check the latest saved demo before retrying.' : failure.message); }
    finally { locked.current = false; setPhase(''); request.current = null; }
  }

  if (!open) return null;
  return createPortal(<div className={styles.backdrop} onClick={event => event.stopPropagation()}><section ref={panel} role="dialog" aria-modal="true" aria-labelledby={`requirements-${lead.id}`} className={styles.panel}>
    <header className={styles.header}><div><p><Sparkles size={14} aria-hidden="true" />Live design session</p><h2 id={`requirements-${lead.id}`}>First the requirements. Then your demo.</h2><span>{lead.business_name}</span></div><button type="button" aria-label="Close requirements session" onClick={() => { request.current?.abort(); onClose(); }} className={styles.close}><X size={20} aria-hidden="true" /></button></header>
    <div className={styles.body}>
      <div className={styles.conversation}><div ref={log} role="log" aria-label="Requirements conversation" aria-live="off" onScroll={event => { const element = event.currentTarget; follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }} className={styles.messages}>{messages.map((message, index) => <article key={index} data-role={message.role}><span>{message.role === 'user' ? 'You' : 'AI designer'}</span><p>{message.content || 'Thinking about your requirements…'}</p></article>)}</div>
        {generationReply && <div className={styles.generationReply}><Sparkles size={16} aria-hidden="true" /><p>{generationReply}</p></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <form className={styles.composer} onSubmit={chat}><label htmlFor={`requirements-input-${lead.id}`}>Tell the designer what you need</label><textarea ref={composer} id={`requirements-input-${lead.id}`} value={input} onChange={event => setInput(event.target.value)} maxLength={4000} rows={3} placeholder="For example: a bright website for local homeowners, with plumbing services, FAQs and a quote form. Ask me about anything missing." onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) chat(event); }} /><div><span role="status">{busy ? phase === 'saving' ? 'Saving your generated demo…' : phase === 'designing' ? 'AI is designing from your brief…' : 'AI is replying live…' : 'Ask questions, answer, or edit the brief alongside.'}</span>{busy ? <button type="button" onClick={() => request.current?.abort()}><Square size={14} aria-hidden="true" />Stop</button> : <button type="submit" disabled={!input.trim()}><Send size={16} aria-hidden="true" />Send</button>}</div></form>
      </div>
      <aside className={styles.brief}><h3><MessageSquare size={16} aria-hidden="true" />Your current brief</h3><p>AI updates this as you talk. You can edit it before generating.</p><fieldset disabled={busy}>
        <label>Website goal<textarea value={requirements.goal} rows={2} onChange={event => edit('goal', event.target.value)} placeholder="What should this website achieve?" /></label>
        <label>Who is it for?<input value={requirements.audience} onChange={event => edit('audience', event.target.value)} placeholder="Target audience" /></label>
        <label>Real business services<textarea value={serviceText} rows={3} onChange={event => { setServiceText(event.target.value); edit('services', event.target.value.split('\n')); }} placeholder="One service per line" /></label>
        <div className={styles.fieldRow}><label>Style<select value={requirements.style} onChange={event => edit('style', event.target.value)}><option value="">Choose</option><option value="clean">Clean</option><option value="bold">Bold</option><option value="editorial">Editorial</option><option value="friendly">Friendly</option></select></label><label>Theme<select value={requirements.theme} onChange={event => edit('theme', event.target.value)}><option value="">Choose</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
        <div className={styles.fieldRow}><label>Layout<select value={requirements.layout} onChange={event => edit('layout', event.target.value)}><option value="split">Split hero</option><option value="centered">Centered</option><option value="editorial">Editorial</option></select></label><label>Brand color<input type="color" value={requirements.accent} onChange={event => edit('accent', event.target.value)} /></label></div>
        <span className={styles.fieldLabel}>Website sections</span><div className={styles.checks}>{DEMO_SECTIONS.map(section => <label key={section}><input type="checkbox" checked={requirements.sections.includes(section)} disabled={section === 'enquiry' && requirements.sections.includes(section)} onChange={() => toggleSection(section)} />{sectionLabels[section]}</label>)}</div>
        <ol className={styles.sectionOrder} aria-label="Section order">{requirements.sections.map((section, index) => <li key={section}><span>{index + 1}. {sectionLabels[section]}</span><button type="button" disabled={index === 0} aria-label={`Move ${sectionLabels[section]} up`} onClick={() => moveSection(index, -1)}><ArrowUp size={14} aria-hidden="true" /></button><button type="button" disabled={index === requirements.sections.length - 1} aria-label={`Move ${sectionLabels[section]} down`} onClick={() => moveSection(index, 1)}><ArrowDown size={14} aria-hidden="true" /></button></li>)}</ol>
        <div className={styles.checks}>{[['planner', 'Brief planner'], ['motion', 'Motion']].map(([feature, label]) => <label key={feature}><input type="checkbox" checked={requirements.features.includes(feature)} onChange={() => edit('features', requirements.features.includes(feature) ? requirements.features.filter(item => item !== feature) : [...requirements.features, feature])} />{label}</label>)}</div>
        <label>Other requirements<textarea rows={3} value={requirements.notes} onChange={event => edit('notes', event.target.value)} placeholder="References, constraints and details" /></label>
      </fieldset></aside>
    </div>
    <footer className={styles.footer}><div>{missing.length ? <p>Still needed: {missing.join(', ')}</p> : <p><Check size={16} aria-hidden="true" />Brief complete. Generate when you are happy with these choices.</p>}<span>Requirements and the generated design are saved together. No email is sent.</span></div><button type="button" className={styles.generate} disabled={busy || Boolean(missing.length)} onClick={generate}>{busy && phase !== 'understanding' ? <Loader2 size={18} className={styles.spinner} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}Generate from this brief<ArrowRight size={16} aria-hidden="true" /></button></footer>
  </section></div>, document.body);
}
