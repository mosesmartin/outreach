'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function LeadCaptureForm({ 
  businessName, 
  city, 
  services = [],
  theme = null
}) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: (services && services[0]) || 'General Inquiry',
    note: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonStyle = theme?.buttonClass || 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-blue-600/30';
  const badgeStyle = theme?.badgeBg || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  const inputFocusStyle = theme?.inputFocusClass || 'focus:border-blue-500';
  const accentTextStyle = theme?.accentText || 'text-cyan-400';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/leads/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          city,
          name: formData.name,
          phone: formData.phone,
          service: formData.service,
          note: formData.note,
        }),
      });
    } catch (err) {
      console.warn('Inquiry dispatch error:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-4 animate-fadeIn">
        <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Booking Request Received!</h3>
        <p className="text-xs text-slate-300">
          Thank you <strong className="text-white">{formData.name || 'valued client'}</strong>. A specialist from{' '}
          <strong className="text-white">{businessName}</strong> in {city} will contact you within 15 minutes.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative" id="quote-form">
      <div className={`absolute -top-3 right-6 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-md border ${badgeStyle} flex items-center gap-1.5`}>
        <Sparkles className="w-3 h-3" /> Priority Dispatch
      </div>
      
      <h3 className="text-xl font-extrabold text-white mb-1.5">
        Request Free Estimate
      </h3>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed">
        Fill out this 30-second form for instant priority scheduling with <strong className="text-slate-200">{businessName}</strong> in {city}.
      </p>

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Your Full Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Johnathan Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${inputFocusStyle}`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Direct Phone Number
          </label>
          <input
            type="tel"
            required
            placeholder="(555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${inputFocusStyle}`}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Service Required
          </label>
          <select
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition ${inputFocusStyle}`}
          >
            {services.map((svc, i) => (
              <option key={i} value={typeof svc === 'string' ? svc : svc.title}>
                {typeof svc === 'string' ? svc : svc.title}
              </option>
            ))}
            <option value="General Consultation">General Service Consultation</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Project Notes / Details (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Tell us what you need..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition resize-none ${inputFocusStyle}`}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60 ${buttonStyle}`}
        >
          {isSubmitting ? (
            <span>Sending Priority Request...</span>
          ) : (
            <>
              <span>Submit Priority Request</span> <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Privacy Protected • Instant Callback Guarantee</span>
        </div>
      </form>
    </div>
  );
}
