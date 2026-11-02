'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Loader2, Send, Sparkles, X } from 'lucide-react';

const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50';

export default function LeadDemoActions({ lead, onRefresh }) {
  const [draft, setDraft] = useState(lead.demo || null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const trigger = useRef(null);
  useEffect(() => { setDraft(lead.demo || null); setReviewed(false); }, [lead.demo]);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('button:not(:disabled),a[href],input')?.focus();
    const handle = (event) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
      if (event.key === 'Tab') {
        const elements = [...(dialog.current?.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)') || [])];
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); document.body.style.overflow = overflow; before?.focus(); };
  }, [open, busy]);

  async function generate(event) {
    event.stopPropagation(); setBusy(true); setError(''); setNotice(''); setReviewed(false);
    try {
      const response = await fetch('/api/leads/generate-demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setDraft(result.draft); setOpen(true); setNotice('Demo prepared. No email was sent.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function send() {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/leads/send-reviewed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId: lead.id, draftId: draft.id, reviewed, subject: draft.email_subject, body: draft.email_body }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setNotice(result.message); setDraft({ ...draft, sent_at: new Date().toISOString() }); setReviewed(false);
      onRefresh?.();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  if (lead.contact_safety?.blocked) return <p className="max-w-sm rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs leading-5 text-rose-200" role="status">{lead.contact_safety.reason}</p>;
  return <div className="space-y-2" onClick={event => event.stopPropagation()}>
    <div className="flex flex-wrap gap-2">
      <button ref={trigger} type="button" onClick={generate} disabled={busy} className={button}>{busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}{draft ? 'Regenerate demo' : 'Generate demo'}</button>
      {draft && <button type="button" className={button} onClick={() => { setOpen(true); setReviewed(false); }}>Review demo & email</button>}
    </div>
    {!draft && <p className="text-[11px] text-slate-400">Demo not generated. No invitation will be sent automatically.</p>}
    {error && !open && <p role="alert" className="max-w-sm text-xs text-rose-300">{error}</p>}
    {open && draft && createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={event => event.stopPropagation()}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`review-${lead.id}`} tabIndex={-1} className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3"><div><h2 id={`review-${lead.id}`} className="text-xl font-semibold">Review before contact</h2><p className="mt-2 text-sm text-slate-300">{lead.business_name} · {lead.category}</p></div><button type="button" disabled={busy} aria-label="Close demo review" className={button} onClick={() => { setOpen(false); onRefresh?.(); }}><X className="h-4 w-4" aria-hidden="true" /></button></div>
        <a href={draft.prototype_url} target="_blank" rel="noopener noreferrer" className={button}>Open generated demo<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
        <p className="text-xs leading-5 text-amber-200">Check the business's real services and the recipient. Domain/MX checks do not verify mailbox ownership. Suggested demo content must be checked before sharing.</p>
        <p className="break-all text-sm">Recipient: <strong>{lead.email || 'No email available'}</strong></p>
        <p className="text-sm"><strong>Subject:</strong> {draft.email_subject}</p>
        <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-slate-700 bg-slate-900 p-4 font-sans text-sm leading-6">{draft.email_body}</pre>
        {notice && <p role="status" className="text-sm text-cyan-200">{notice}</p>}{error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {!draft.sent_at && lead.status !== 'SENT' && <><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />I checked the demo's services and confirmed this email belongs to the business.</label><button type="button" onClick={send} disabled={!reviewed || busy || !lead.email} className={button}><Send className="h-4 w-4" aria-hidden="true" />{busy ? 'Sending…' : 'Send reviewed email'}</button></>}
      </section>
    </div>, document.body)}
  </div>;
}
