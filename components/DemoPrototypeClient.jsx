'use client';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin, Sparkles } from 'lucide-react';

export default function DemoPrototypeClient({ initialLead: lead, initialTheme: theme }) {
  const [preview, setPreview] = useState(false);
  const services = lead.services || [];
  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <aside className="border-b border-cyan-500/30 bg-slate-900 px-4 py-4 text-center text-sm text-cyan-200">
      Website concept for review. Sample content; this is not the business's official booking website.
    </aside>
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
      <span className="text-lg font-bold">{lead.business_name}</span>
      <a href="#enquiry" className={`rounded-xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${theme?.buttonClass || 'bg-blue-600 text-white'}`}>View sample enquiry</a>
    </header>
    <main className="mx-auto max-w-6xl space-y-16 px-5 py-12 sm:py-20">
      <section className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${theme?.badgeBg || 'border-cyan-500/30 text-cyan-200'}`}><Sparkles className="h-4 w-4" aria-hidden="true" />Proposed mobile website</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">A welcoming online home for <span className={theme?.accentText || 'text-cyan-300'}>{lead.business_name}</span></h1>
          <p className="max-w-xl text-lg leading-8 text-slate-300">Explore a concept for presenting your {lead.category || 'business'} services and helping customers take the next step.</p>
          {lead.city && <p className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4" aria-hidden="true" />{lead.city}</p>}
          <a href="#services" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-3 text-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Explore the layout<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
        </div>
        <div className={`rounded-3xl border border-slate-700 bg-gradient-to-br p-8 ${theme?.gradientClass || 'from-blue-950 to-slate-900'}`}>
          <div className="space-y-5 rounded-2xl bg-slate-950/90 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Your customer journey</p>
            {['Discover your services', 'Find opening hours and contact details', 'Ask about an appointment or service'].map(text => <p key={text} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />{text}</p>)}
            <p className="border-t border-slate-700 pt-4 text-xs leading-5 text-slate-400">Business details and integrations will be confirmed before launch.</p>
          </div>
        </div>
      </section>
      <section id="services" className="space-y-6">
        <h2 className="text-3xl font-semibold">Services at a glance</h2>
        {lead.services_suggested && <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">Suggested service labels for this concept. Confirm these against the business's actual offering before sharing.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((service,index) => <article key={`${index}-${service}`} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"><span className={`text-sm ${theme?.accentText || 'text-cyan-300'}`}>{String(index+1).padStart(2,'0')}</span><h3 className="text-xl font-semibold">{service}</h3><p className="text-sm leading-6 text-slate-400">Add the business's confirmed description, availability and service information here.</p></article>)}</div>
      </section>
      <section id="enquiry" className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10 md:grid-cols-2">
        <div className="space-y-4"><h2 className="text-3xl font-semibold">A simple way to get in touch</h2><p className="text-sm leading-7 text-slate-300">This sample shows where an enquiry or appointment request could sit on your website. Forms, opening hours and contact details are finalized with the business.</p><p className="text-xs text-slate-400">Preview only. No customer requests are collected or sent.</p></div>
        <form onSubmit={event=>{event.preventDefault();setPreview(true);}} className="space-y-4">
          <label className="block text-sm">Name<input placeholder="Sample name" className="mt-2 min-h-11 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-300" /></label>
          <label className="block text-sm">Enquiry<textarea placeholder="Sample enquiry" rows={3} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 focus:outline-none focus:ring-2 focus:ring-cyan-300" /></label>
          <button className={`min-h-11 rounded-xl px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${theme?.buttonClass || 'bg-blue-600 text-white'}`}>Preview enquiry button</button>
          {preview && <p role="status" className="text-sm text-cyan-200">Preview interaction only. No enquiry was sent.</p>}
        </form>
      </section>
    </main>
    <footer className="border-t border-slate-800 p-6 text-center text-xs text-slate-400">Website concept by SynergyTech Solutions. Content and business details require review.</footer>
  </div>;
}
