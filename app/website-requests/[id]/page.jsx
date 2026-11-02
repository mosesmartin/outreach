'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Copy, Loader2, Mail, Phone, RefreshCw, Save } from 'lucide-react';
import { displayRequestDate, isFreshRequest, REQUEST_STATUSES } from '@/lib/websiteRequestRules.mjs';
import { hasUsClientEvidence } from '@/lib/websiteRequestCountry.mjs';
import { FreshnessNote, platformLabels, primaryRequestButton, requestButton, RequestBadge, requestControl, RequestShell, SourceLink, statusLabels } from '@/components/WebsiteRequestShared';

export default function WebsiteRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/website-requests/${id}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setRequest(payload.request); setStatus(payload.request.status); setNotes(payload.request.notes);
    } catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);

  async function update(action) {
    setBusy(action); setError(null); setNotice('');
    try {
      const response = await fetch(`/api/website-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'recheck' ? { action } : { status, notes }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setRequest(payload.request);
      setNotice(action === 'save' ? 'Outreach status and notes saved.' : payload.request.source_state === 'request_detected' ? 'Original post checked. Confirm availability with the client before preparing a custom demo.' : 'This source could not be confirmed as an active request. It has been removed from fresh results.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(null); }
  }

  const fresh = request && isFreshRequest(request, '7days', now);
  const sourceOk = request?.source_state === 'request_detected' && hasUsClientEvidence(request);
  const draft = request ? `Hi${request.author_name ? ` ${request.author_name}` : ''}, I saw your post asking for help with a website. Is the project still open? I can share a relevant demo and a fixed-scope proposal once I understand the pages/features you need.` : '';

  return <RequestShell detail>
    {loading ? <div className="flex items-center gap-2 py-12 text-slate-400"><Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />Loading request…</div> : !request ? <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-6 text-amber-200">{error || 'Request not found.'}<button onClick={load} className={`${requestButton} ml-3`}>Try again</button></div> : <>
      <div className="flex flex-wrap gap-2"><RequestBadge muted>{platformLabels[request.platform]}</RequestBadge><RequestBadge muted={!fresh || !sourceOk}>{!fresh ? 'Outside the last 7 days' : !sourceOk ? request.source_state.replaceAll('_', ' ') : 'Publication date verified'}</RequestBadge><RequestBadge muted>{statusLabels[request.status]}</RequestBadge></div>
      <h1 className="max-w-4xl text-2xl font-bold leading-tight sm:text-4xl">{request.title}</h1>
      <FreshnessNote />
      <section aria-label="Client country evidence" className="rounded-2xl border border-slate-800 bg-[#0c1220] p-5 text-sm">
        <h2 className="font-semibold">Client location: {hasUsClientEvidence(request) ? 'USA (source-declared)' : 'Not confirmed as USA'}</h2>
        <p className="mt-2 leading-6 text-slate-300">{request.country_evidence || 'No qualifying US client-location evidence is saved. This request is excluded from US results.'}</p>
      </section>
      {(!fresh || !sourceOk) && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">This request is not eligible for fresh results. Its original date is preserved even if the post is edited or discovered again.</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 text-sm text-blue-200">{notice}</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-5 rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6"><h2 className="text-lg font-semibold">What the client requested</h2><p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{request.requirement}</p><dl className="grid gap-5 border-t border-slate-800 pt-5 text-sm sm:grid-cols-2">{[['Posted by', request.author_name || 'Not publicly identified'], ['Budget', request.budget || 'Not stated'], ['Originally published', `${displayRequestDate(request.published_at)} PKT`], ['Last checked', `${displayRequestDate(request.last_checked_at)} PKT`], ['Date evidence', request.date_evidence], ['Availability', sourceOk ? 'Not confirmed with client' : request.source_state.replaceAll('_', ' ')]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 break-words text-slate-200">{value}</dd></div>)}</dl></section>
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6"><h2 className="text-lg font-semibold">Original source & contact</h2><a href={request.source_url} target="_blank" rel="noopener noreferrer" className="block break-all rounded text-sm text-cyan-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{request.source_url}</a><div className="flex flex-wrap gap-2"><SourceLink href={request.source_url} /><button onClick={() => update('recheck')} disabled={Boolean(busy)} className={requestButton}><RefreshCw className={`h-4 w-4 ${busy === 'recheck' ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />{busy === 'recheck' ? 'Checking…' : 'Check source again'}</button></div>
            {request.public_email && <p className="flex items-start gap-2 break-all text-sm text-slate-200"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />{request.public_email}</p>}
            {request.public_phone && <p className="flex items-center gap-2 text-sm text-slate-200"><Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />{request.public_phone}</p>}
            <p className="text-xs leading-5 text-slate-400">{request.public_email || request.public_phone ? 'These contact details appeared in the source post; ownership and reachability are not independently verified.' : 'No public email or phone was found. Open the original post and use the reply, DM or proposal option requested by the client.'} Follow the source platform’s contact rules. No messages are sent automatically.</p>
          </section>
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6"><h2 className="text-lg font-semibold">Conversation starter</h2><p className="text-sm leading-7 text-slate-300">{draft}</p><button disabled={copied} className={requestButton} onClick={async () => { try { await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setError('Could not copy. Select and copy the draft text manually.'); } }}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? 'Copied' : 'Copy draft'}</button></section>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); update('save'); }} className="space-y-5 rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6"><h2 className="text-lg font-semibold">Track the conversation</h2><label className="block space-y-2 text-sm text-slate-300"><span className="block">Outreach status</span><select value={status} onChange={(e) => setStatus(e.target.value)} className={`${requestControl} w-full`}>{REQUEST_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label><label className="block space-y-2 text-sm text-slate-300"><span className="block">Notes</span><textarea rows={7} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${requestControl} w-full resize-y`} placeholder="Client requirements, follow-up, demo link…" /></label><button disabled={Boolean(busy)} type="submit" className={`${primaryRequestButton} w-full`}>{busy === 'save' ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{busy === 'save' ? 'Saving…' : 'Save progress'}</button><p className="text-xs leading-5 text-slate-400">Closing or dismissing a request removes it from active results. Its source and notes remain on this page.</p></form>
      </div>
    </>}
  </RequestShell>;
}
