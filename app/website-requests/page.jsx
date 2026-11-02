'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, FileSearch, Loader2, RefreshCw, Search } from 'lucide-react';
import { displayRequestDate, REQUEST_PLATFORMS, REQUEST_STATUSES } from '@/lib/websiteRequestRules.mjs';
import { FreshnessNote, platformLabels, primaryRequestButton, requestButton, RequestBadge, requestControl, RequestShell, SourceLink, statusLabels } from '@/components/WebsiteRequestShared';

const windows = [{ value: 'today', label: 'Today' }, { value: '3days', label: 'Last 3 days' }, { value: '7days', label: 'Last 7 days' }];

export default function WebsiteRequestsPage() {
  const [window, setWindow] = useState('today');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus] = useState('ALL');
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [setup, setSetup] = useState(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const version = useRef(0);

  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/website-requests?${new URLSearchParams({ window, platform, status })}`, { cache: 'no-store' });
      const payload = await response.json();
      if (current !== version.current) return;
      if (!response.ok) throw Object.assign(new Error(payload.error), { code: payload.code });
      setData(payload);
      const last = payload.lastSearch ? Date.parse(payload.lastSearch.created_at) + 60000 : 0;
      setCooldownUntil(last);
    } catch (failure) {
      if (current === version.current) { setData(null); setError({ message: failure.message, code: failure.code }); }
    } finally { if (current === version.current) setLoading(false); }
  }, [window, platform, status]);

  useEffect(() => { load(); return () => { version.current++; }; }, [load]);
  useEffect(() => {
    const tick = () => setCooldown(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    tick();
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);
  // Refresh saved results at least once a minute so yesterday's leads disappear after midnight.
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden && !searching) load(); }, 60000);
    const visible = () => { if (!document.hidden && !searching) load(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [load, searching]);

  async function searchGoogle(event) {
    event.preventDefault(); setSearching(true); setError(null); setSummary(null);
    try {
      const response = await fetch('/api/website-requests/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ window, platform, niche, location }),
      });
      const payload = await response.json();
      if (!response.ok) throw Object.assign(new Error(payload.error), { code: payload.code });
      await load();
      setSummary(payload);
    } catch (failure) {
      setError({ message: failure.message, code: failure.code });
      setCooldownUntil(Date.now() + 60000);
    } finally { setSearching(false); }
  }

  async function copySetupSql() {
    setSetupBusy(true);
    try {
      const response = await fetch('/api/website-requests/setup', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      try {
        await navigator.clipboard.writeText(payload.sql);
        setSetup({ ...payload, copied: true });
      } catch { setSetup({ ...payload, copied: false }); }
    } catch (failure) { setError({ message: failure.message, code: 'SETUP_REQUIRED' }); }
    finally { setSetupBusy(false); }
  }

  const requests = data?.requests || [];
  const searchDisabled = searching || loading || cooldown > 0 || !data || data.searchConfigured === false;
  return <RequestShell>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-300">Find USA clients already asking</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Website Requests</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Recent requests from source-declared US clients, with the original post and a way to start the conversation.</p></div>
      <button onClick={load} disabled={loading || searching} className={requestButton}><RefreshCw className={`h-4 w-4 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />Refresh saved requests</button>
    </div>
    <FreshnessNote />

    <section aria-labelledby="search-heading" className="rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="search-heading" className="flex items-center gap-2 font-semibold"><Search className="h-4 w-4 text-blue-300" aria-hidden="true" />Search for requests</h2><span className="text-xs font-medium text-cyan-300">USA only · Today by default · Pakistan time</span></div>
      <form onSubmit={searchGoogle} className="space-y-5">
        <fieldset disabled={searching} className="space-y-5 disabled:opacity-70">
          <legend className="sr-only">Google request search filters</legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Publication date range">
            {windows.map((item) => <button type="button" key={item.value} aria-pressed={window === item.value} onClick={() => { setWindow(item.value); setSummary(null); }} className={window === item.value ? primaryRequestButton : requestButton}><CalendarDays className="h-4 w-4" aria-hidden="true" />{item.label}</button>)}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-300"><span className="block">Business niche <span className="text-slate-400">(optional)</span></span><input className={`${requestControl} w-full`} value={niche} onChange={(e) => setNiche(e.target.value)} maxLength={80} placeholder="e.g. cleaning, auto detailing" /></label>
            <label className="space-y-2 text-sm text-slate-300"><span className="block">US city or state <span className="text-slate-400">(optional)</span></span><input className={`${requestControl} w-full`} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="e.g. Austin or Texas" /></label>
            <label className="space-y-2 text-sm text-slate-300"><span className="block">Source</span><select className={`${requestControl} w-full`} value={platform} onChange={(e) => { setPlatform(e.target.value); setSummary(null); }}>{REQUEST_PLATFORMS.map((item) => <option key={item} value={item}>{platformLabels[item]}</option>)}</select></label>
          </div>
        </fieldset>
        <div className="flex flex-col justify-between gap-4 border-t border-slate-800 pt-5 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-5 text-slate-400">Each search runs two paid Google queries and checks up to 12 original posts. Refreshing saved requests is free. Leaving niche and location empty finds broader requests.</p>
          <button type="submit" disabled={searchDisabled} className={`${primaryRequestButton} shrink-0`}>{searching ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}{searching ? 'Searching & checking sources…' : cooldown > 0 ? `Search again in ${cooldown}s` : 'Search Google'}</button>
        </div>
      </form>
    </section>

    {error && <div role="alert" className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5 text-sm text-amber-200">
      <p>{error.message}</p>
      {error.code === 'SETUP_REQUIRED' && <>
        <p className="text-xs leading-5">One-time setup: copy the SQL below, open your Supabase SQL Editor, paste it and click Run. Then refresh this page. Your existing leads are preserved.</p>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={copySetupSql} disabled={setupBusy} className={requestButton}>{setupBusy ? 'Loading SQL…' : setup?.copied ? 'SQL copied' : 'Copy setup SQL'}</button>{setup?.sqlEditorUrl && <SourceLink href={setup.sqlEditorUrl}>Open SQL Editor</SourceLink>}</div>
        {setup?.copied && <p role="status" className="text-xs">SQL copied. Paste it into the SQL Editor and run it.</p>}
        {setup && !setup.copied && <label className="block text-xs">Copy this setup SQL<textarea aria-label="Setup SQL" readOnly value={setup.sql} rows={8} onFocus={(event) => event.target.select()} className={`${requestControl} mt-2 w-full font-mono text-xs`} /></label>}
      </>}
    </div>}
    {data?.searchConfigured === false && <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">Google search is not configured. Add your DataForSEO login and password to the server environment, then restart the app.</div>}
    <div aria-live="polite" aria-atomic="true">
      {searching && <p className="text-sm text-cyan-300">Checking original dates and request content. This can take up to a minute.</p>}
      {summary && <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5 text-sm text-blue-100"><p><strong>{summary.stats.saved} matching {summary.stats.saved === 1 ? 'request' : 'requests'} saved.</strong> Checked {summary.stats.checked} original posts from {summary.stats.searched} Google results.</p><p className="mt-2 text-xs leading-5 text-slate-300">Excluded: {summary.stats.skipped.old_or_future} outside the date range, {summary.stats.skipped.unverified_date} without a verified date, {(summary.stats.skipped.non_us_client || 0) + (summary.stats.skipped.unverified_country || 0)} non-US or unknown client location, {summary.stats.skipped.unavailable} inaccessible, {summary.stats.skipped.closed} closed, {summary.stats.skipped.seller + summary.stats.skipped.employment + summary.stats.skipped.not_a_request} unrelated.</p>{summary.warnings.map((warning) => <p key={warning} className="mt-2 text-amber-200">Partial search: {warning}</p>)}</div>}
    </div>

    <section aria-labelledby="results-heading" aria-busy={loading} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="results-heading" className="text-lg font-semibold">{windows.find((item) => item.value === window)?.label}: {loading ? 'loading…' : `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`}</h2>{data?.lastSearch && <p className="mt-1 text-xs text-slate-400">Last search: {displayRequestDate(data.lastSearch.created_at)} PKT{data.lastSearch.outcome === 'failed' ? ' · failed' : data.lastSearch.outcome === 'running' ? ' · in progress' : ''}</p>}</div><label className="flex items-center gap-2 text-sm text-slate-300"><span>Status</span><select value={status} disabled={searching} onChange={(e) => setStatus(e.target.value)} className={requestControl}><option value="ALL">Active requests</option>{REQUEST_STATUSES.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label></div>
      {loading ? <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-800 text-sm text-slate-400"><Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />Loading saved requests…</div>
        : !error && requests.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0c1220] px-6 py-12 text-center"><FileSearch className="mx-auto mb-4 h-9 w-9 text-slate-500" aria-hidden="true" /><h3 className="font-semibold">No matching US requests in this date range</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">Search Google to find recent public posts. If today has no matches, try the last 3 days or remove the niche/city filters. Requests without an original date or source-declared US client location stay out of this list.</p></div>
        : <div className="grid gap-4 lg:grid-cols-2">{requests.map((request) => <article key={request.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0c1220] p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{platformLabels[request.platform]}</span><RequestBadge>{statusLabels[request.status]}</RequestBadge></div><h3 className="text-lg font-semibold leading-7"><Link href={`/website-requests/${request.id}`} className="rounded hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">{request.title}</Link></h3><p className="line-clamp-3 text-sm leading-6 text-slate-400">{request.requirement}</p><dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2"><div><dt className="text-slate-400">Published</dt><dd className="mt-1 text-slate-200">{displayRequestDate(request.published_at)} PKT</dd></div><div><dt className="text-slate-400">Budget</dt><dd className="mt-1 text-slate-200">{request.budget || 'Not stated'}</dd></div></dl><div className="mt-auto flex flex-wrap gap-2 border-t border-slate-800 pt-4"><Link href={`/website-requests/${request.id}`} className={primaryRequestButton}>View request<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><SourceLink href={request.source_url}>Source</SourceLink></div></article>)}</div>}
    </section>
  </RequestShell>;
}
