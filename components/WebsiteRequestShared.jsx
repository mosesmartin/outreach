import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Clock3, ShieldCheck } from 'lucide-react';

export const requestControl = 'min-h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50';
const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50';
export const requestButton = `${buttonBase} border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700`;
export const primaryRequestButton = `${buttonBase} border-blue-500 bg-blue-600 text-white hover:bg-blue-500`;
export const platformLabels = { all: 'All sources', reddit: 'Reddit', linkedin: 'LinkedIn', facebook: 'Facebook', x: 'X', upwork: 'Upwork', freelancer: 'Freelancer' };
export const statusLabels = { NEW: 'New', CONTACTED: 'Contacted', REPLIED: 'Replied', DEMO_SENT: 'Demo sent', WON: 'Won', CLOSED: 'Closed', DISMISSED: 'Dismissed' };

export function RequestShell({ children, detail = false }) {
  return <div className="min-h-screen bg-[#070b13] text-slate-100">
    <a href="#request-content" className="sr-only z-50 rounded-lg bg-blue-600 p-3 focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a>
    <header className="border-b border-slate-800 bg-[#0c1220]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold">S</span>
          <span><span className="block text-sm font-bold">SynergyTech Solutions</span><span className="text-xs text-slate-400">USA website requests</span></span>
        </Link>
        <Link href={detail ? '/website-requests' : '/'} className={requestButton}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{detail ? 'All requests' : 'Outreach dashboard'}</Link>
      </div>
    </header>
    <main id="request-content" className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
  </div>;
}

export function FreshnessNote() {
  return <div className="flex gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 text-sm leading-relaxed text-slate-300">
    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
    <p><strong className="text-slate-100">USA clients only</strong>, based on the requester’s location stated in the original source. Unknown locations, old, undated and closed posts are excluded. Dates use <strong className="text-slate-100">Pakistan time (UTC+05:00)</strong>. Confirm the client’s location and availability before preparing a custom demo.</p>
  </div>;
}

export function RequestBadge({ children, muted = false }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${muted ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'}`}><Clock3 className="h-3 w-3" aria-hidden="true" />{children}</span>;
}

export function SourceLink({ href, children = 'Open original post' }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={requestButton}>{children}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>;
}
