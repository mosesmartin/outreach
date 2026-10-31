'use client';

import React, { useState, useId } from 'react';
import { Calculator, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, Tag } from 'lucide-react';

const TIERS = [
  {
    level: 1,
    name: 'Essential Care & Diagnostic',
    desc: 'Targeted single-issue inspection, fast repairs, and precision tune-up.',
    minPrice: 280,
    maxPrice: 480,
    turnaround: 'Same-Day / 2-4 Hours',
  },
  {
    level: 2,
    name: 'Standard Comprehensive Service',
    desc: 'Full diagnostic check, premium replacement components, and preventative tuning.',
    minPrice: 650,
    maxPrice: 1150,
    turnaround: '24-48 Hours',
    recommended: true,
  },
  {
    level: 3,
    name: 'Executive Full-System Overhaul',
    desc: 'Heavy-duty commercial-grade overhaul, total restoration, and certified warranties.',
    minPrice: 1800,
    maxPrice: 3200,
    turnaround: '2-4 Days Priority',
  },
  {
    level: 4,
    name: 'Turnkey Architectural Transformation',
    desc: 'Complete property-wide execution, custom engineering, and dedicated project manager.',
    minPrice: 4200,
    maxPrice: 7500,
    turnaround: 'Scheduled Milestone Delivery',
  },
];

export default function ProjectCostCalculator({
  businessName = 'Apex Premier',
  city = 'Local Area',
  category = 'Professional Services',
  theme = null,
  isLightMode = false,
  onSelectEstimate = null,
}) {
  const [selectedTierIndex, setSelectedTierIndex] = useState(1); // Standard default
  const [includePriorityDispatch, setIncludePriorityDispatch] = useState(true);
  const [includePermitAudit, setIncludePermitAudit] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(true);

  const priorityId = useId();
  const permitId = useId();

  const activeTier = TIERS[selectedTierIndex];
  const priorityCost = includePriorityDispatch ? 120 : 0;
  const permitCost = includePermitAudit ? 95 : 0;

  const rawMin = activeTier.minPrice + priorityCost + permitCost;
  const rawMax = activeTier.maxPrice + priorityCost + permitCost;

  // 15% web discount
  const discountMultiplier = appliedDiscount ? 0.85 : 1.0;
  const finalMin = Math.round(rawMin * discountMultiplier);
  const finalMax = Math.round(rawMax * discountMultiplier);
  const savings = Math.round(rawMax - finalMax);

  const buttonClass = theme?.buttonClass || 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white font-bold shadow-cyan-500/25';
  const accentText = theme?.accentText || 'text-cyan-400';

  const handleLockIn = (e) => {
    e.preventDefault();
    if (onSelectEstimate) {
      onSelectEstimate({
        tierName: activeTier.name,
        estimatedRange: `$${finalMin.toLocaleString()} - $${finalMax.toLocaleString()}`,
        savings,
      });
    }
    const formElement = document.getElementById('quote-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 border-t border-slate-800/80 relative" id="pricing-calculator">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider bg-slate-900/80 border-slate-800 text-slate-300">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Instant Transparent Pricing</span>
          </div>
          <h3 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            Interactive Project Cost Estimator
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Upfront transparent estimates by {businessName} tailored for residential & commercial clients in {city}.
          </p>
        </div>

        {/* Calculator Widget Box */}
        <div className={`max-w-4xl mx-auto rounded-3xl border p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/85 border-slate-800'
        }`}>
          
          {/* Glowing Ambient Backdrop */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2">
                  <span>1. Select Project Scope</span>
                  <span className={`font-mono text-xs font-bold ${accentText}`}>
                    Level {activeTier.level} of 4
                  </span>
                </label>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={selectedTierIndex}
                  onChange={(e) => setSelectedTierIndex(parseInt(e.target.value, 10))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                {/* 4 Tier Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {TIERS.map((tier, idx) => (
                    <button
                      key={tier.level}
                      onClick={() => setSelectedTierIndex(idx)}
                      className={`p-2.5 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                        selectedTierIndex === idx
                          ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-md'
                          : isLightMode 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                            : 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 border-slate-800'
                      }`}
                    >
                      <span className="font-bold text-[11px] truncate">{tier.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-500">Tier 0{tier.level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Tier Description Card */}
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/90'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{activeTier.name}</span>
                  </h4>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ⏱️ {activeTier.turnaround}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activeTier.desc}
                </p>
              </div>

              {/* Addon Checkboxes */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Optional Service Addons
                </span>

                <label htmlFor={priorityId} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 transition">
                  <div className="flex items-center gap-2.5">
                    <input
                      id={priorityId}
                      type="checkbox"
                      checked={includePriorityDispatch}
                      onChange={(e) => setIncludePriorityDispatch(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-200">24/7 Priority Emergency Dispatch</span>
                      <p className="text-[10px] text-slate-500">Fast-track direct team dispatch within 45 minutes in {city}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">+$120</span>
                </label>

                <label htmlFor={permitId} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 transition">
                  <div className="flex items-center gap-2.5">
                    <input
                      id={permitId}
                      type="checkbox"
                      checked={includePermitAudit}
                      onChange={(e) => setIncludePermitAudit(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-200">Official Municipal Code & Permit Filing</span>
                      <p className="text-[10px] text-slate-500">Full safety documentation and compliance certification</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">+$95</span>
                </label>
              </div>
            </div>

            {/* Right Price Display & CTA Card (5 cols) */}
            <div className="md:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/40 rounded-2xl p-6 sm:p-7 text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-mono">
                  <Zap className="w-3 h-3 text-cyan-400" /> Instant Estimate
                </span>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Estimated Investment Range
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  ${finalMin.toLocaleString()} <span className="text-slate-500 text-lg font-normal">–</span> ${finalMax.toLocaleString()}
                </div>
                {appliedDiscount && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mt-1 animate-pulse">
                    <Tag className="w-3 h-3" />
                    <span>15% Online Special Applied (Save up to ${savings})</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-left text-xs border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>100% Upfront Transparent Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No Obligation & Zero Hidden Fees</span>
                </div>
              </div>

              <button
                onClick={handleLockIn}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer ${buttonClass}`}
              >
                <span>Lock In This Price →</span>
              </button>

              <p className="text-[10px] text-slate-500">
                🔒 Quote locked for 14 days when confirmed today with {businessName}
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
