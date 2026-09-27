'use client';

import React, { useState } from 'react';
import LeadCaptureForm from './LeadCaptureForm';
import { INDUSTRY_THEMES } from '@/lib/demoThemes';
import {
  Phone,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink,
  Award,
  HelpCircle,
  MessageSquare,
  Zap,
  Check,
  Plane,
  Utensils,
  Stethoscope,
  Car,
  Home,
  Laptop,
  Building,
  Smile,
  Moon,
  Sun,
  ShieldAlert,
  ChevronRight,
  Layers,
  HeartHandshake
} from 'lucide-react';

export default function DemoPrototypeClient({ initialLead, initialTheme }) {
  const [activeThemeKey, setActiveThemeKey] = useState(initialTheme?.key || 'TRAVEL_TOURISM');
  const [isLightMode, setIsLightMode] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState(0);

  // Active theme resolved from selected key or initial theme
  const theme = INDUSTRY_THEMES[activeThemeKey] || initialTheme;
  const businessName = initialLead.business_name || 'Apex Premier Solutions';
  const category = theme.industryName || initialLead.category || theme.tagline;
  const city = initialLead.city || 'Metro Area';
  const rating = initialLead.rating || 4.9;
  const reviewCount = initialLead.review_count || 64;

  // If the lead specified custom services, format them for rendering, otherwise use theme's defaultServices
  const customLeadServices = Array.isArray(initialLead.services) && initialLead.services.length > 0
    ? initialLead.services.map((s, idx) => ({
        title: s,
        desc: `High-touch, personalized ${s.toLowerCase()} tailored specifically for clients in ${city} by ${businessName}.`,
        badge: idx === 0 ? 'Featured' : 'Available'
      }))
    : (typeof initialLead.services === 'string' && initialLead.services.trim().length > 0
      ? initialLead.services.split(',').map((s) => s.trim()).filter(Boolean).map((s, idx) => ({
          title: s,
          desc: `High-touch, personalized ${s.toLowerCase()} tailored specifically for clients in ${city} by ${businessName}.`,
          badge: idx === 0 ? 'Featured' : 'Available'
        }))
      : []);

  const servicesToRender = customLeadServices.length > 0 ? customLeadServices : (theme.defaultServices || []);

  const themeSwitchers = [
    { key: 'TRAVEL_TOURISM', label: 'Travel & Tours', icon: Plane, color: 'text-sky-400' },
    { key: 'RESTAURANT_DINING', label: 'Restaurant & Dining', icon: Utensils, color: 'text-amber-400' },
    { key: 'DENTAL_MEDICAL', label: 'Dental & Clinic', icon: Stethoscope, color: 'text-teal-400' },
    { key: 'AUTOMOTIVE_SERVICES', label: 'Auto Detailing', icon: Car, color: 'text-rose-400' },
    { key: 'ROOFING_CONSTRUCTION', label: 'Roofing & Contracting', icon: Home, color: 'text-orange-400' },
    { key: 'TECH_SOFTWARE_AGENCY', label: 'Tech & SaaS', icon: Laptop, color: 'text-violet-400' },
    { key: 'REAL_ESTATE', label: 'Luxury Real Estate', icon: Building, color: 'text-emerald-400' },
    { key: 'BEAUTY_SPA_SALON', label: 'Spa & Salon', icon: Smile, color: 'text-fuchsia-400' },
  ];

  const currentSwitcher = themeSwitchers.find((t) => t.key === activeThemeKey) || {
    key: activeThemeKey,
    label: theme.industryName || initialLead.category || 'Travel & Tours',
    icon: Plane,
    color: 'text-sky-400'
  };
  const ActiveIcon = currentSwitcher.icon;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isLightMode 
        ? 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white' 
        : 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950'
    }`}>
      
      {/* 🚀 FLOATING PROTOTYPE TOOLBAR (Single Bespoke Archetype Badge) */}
      <aside aria-label="Interactive Prototype Controls" className="sticky top-0 z-50 bg-[#070d1d]/95 backdrop-blur-xl border-b border-cyan-500/30 text-white shadow-2xl py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          {/* Left: Branding & Performance Stats */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-xs font-bold tracking-tight">
                <span className="text-cyan-400">Live Prototype Lab</span>
                <span className="text-slate-400 hidden sm:inline"> • {businessName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-emerald-400" /> 99/100 PageSpeed
              </span>
              
              <button
                onClick={() => setIsLightMode(!isLightMode)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 text-xs"
                title="Toggle Light / Dark Mode"
              >
                {isLightMode ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
                <span className="hidden lg:inline text-[10px]">{isLightMode ? 'Dark' : 'Light'}</span>
              </button>
            </div>
          </div>

          {/* Right: Bespoke Matched Industry Archetype (Single Focused Badge) */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/90 text-slate-200 border border-cyan-500/30 flex items-center gap-2 shadow-inner">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Bespoke Niche:</span>
              <span className={`flex items-center gap-1.5 font-bold ${theme.accentText || 'text-cyan-400'}`}>
                <ActiveIcon className="w-3.5 h-3.5" />
                {theme.industryName || initialLead.category || 'Travel & Tours'}
              </span>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Navigation Header */}
      <header className={`border-b sticky top-[45px] z-40 transition-colors ${
        isLightMode 
          ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm' 
          : 'bg-slate-950/85 backdrop-blur-md border-slate-800/80 shadow-md'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr ${theme.gradientClass} flex items-center justify-center font-black text-slate-950 text-xl shadow-lg`}>
              {businessName.charAt(0)}
            </div>
            <div>
              <h1 className={`text-base sm:text-xl font-extrabold tracking-tight leading-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {businessName}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className={`w-3 h-3 shrink-0 ${theme.accentText}`} /> {city} • <span className={theme.accentText}>{category}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#specialty"
              className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition ${
                isLightMode 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              Industry Showcase
            </a>
            <a
              href="#quote-form"
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 shadow-lg ${theme.buttonClass}`}
            >
              <Calendar className="w-4 h-4" />
              <span>Get Free Quote</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        {/* Dynamic Glow backdrop */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${theme.glowColor} rounded-full blur-3xl pointer-events-none opacity-60`} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Tailored Value Proposition */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
              {/* Category Rating Badge */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${theme.badgeBg}`}>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{rating} / 5.0 Rated by {reviewCount}+ Verified Clients in {city}</span>
              </div>

              {/* Dynamic Industry Headline */}
              <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {theme.heroHeadlinePrefix}{' '}
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientClass}`}>
                  {theme.heroHighlight}
                </span>
              </h2>

              <p className={`text-sm sm:text-base max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                {theme.heroSubtext} <strong className={isLightMode ? 'text-slate-900' : 'text-white'}>{city}</strong>. Upfront transparent estimates, guaranteed craftsmanship, and priority scheduling.
              </p>

              {/* 4 Trust Pillars */}
              <div className="grid grid-cols-2 gap-3 pt-2 max-w-lg mx-auto lg:mx-0 text-left">
                {theme.trustPillars.map((pillar, i) => (
                  <div 
                    key={i} 
                    className={`p-2.5 rounded-xl border space-y-0.5 transition ${
                      isLightMode 
                        ? 'bg-white border-slate-200 shadow-sm' 
                        : 'bg-slate-900/60 border-slate-800/80'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{pillar.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-5">
                      {pillar.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <a
                  href="#quote-form"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold transition active:scale-95 shadow-xl ${theme.buttonClass}`}
                >
                  <span>Request Free Estimate</span> <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="tel:5550192834"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-medium border transition ${
                    isLightMode 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                  }`}
                >
                  <Phone className={`w-4 h-4 ${theme.accentText}`} /> Direct Phone Line
                </a>
              </div>
            </div>

            {/* Right Column: Lead Capture Card */}
            <div className="lg:col-span-5" id="quote-form">
              <LeadCaptureForm 
                businessName={businessName}
                city={city}
                services={servicesToRender}
                theme={theme}
              />
            </div>

          </div>
        </div>
      </section>

      {/* 🌟 BESPOKE INDUSTRY-SPECIFIC VISUAL ARCHITECTURE SECTION */}
      <section id="specialty" className={`py-16 border-t transition-colors ${
        isLightMode ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* ✈️ 1. TRAVEL & TOURISM: Curated Expeditions & Visa Concierge */}
          {activeThemeKey === 'TRAVEL_TOURISM' && (
            <div className="space-y-12 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center justify-center gap-1.5">
                  <Plane className="w-4 h-4" /> Curated Signature Expeditions
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Handcrafted Luxury Travel Packages
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  All-inclusive boutique flights, 5-star accommodations, and private local guides arranged by {businessName}.
                </p>
              </div>

              {/* Travel Package Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {(theme.travelPackages || []).map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className={`rounded-2xl overflow-hidden border transition hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-sky-500/90 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                        {pkg.badge}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-[11px] font-mono text-sky-300 font-semibold">{pkg.duration}</div>
                        <h4 className="text-sm font-bold leading-tight">{pkg.title}</h4>
                      </div>
                    </div>

                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-400 italic">
                        "{pkg.highlight}"
                      </p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        {pkg.includes.map((inc, i) => (
                          <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-sky-400 shrink-0" />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <div>
                          <div className="text-base font-extrabold text-white">{pkg.price}</div>
                          <div className="text-[10px] text-slate-400">{pkg.perPerson}</div>
                        </div>
                        <a
                          href="#quote-form"
                          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                        >
                          Book Package
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fast-Track Visa Concierge Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/60 to-blue-950/60 border border-sky-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> 24/7 Embassy Documentation Desk
                  </div>
                  <h4 className="text-base font-bold text-white">
                    Need Express Tourist or Business Visa Processing?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Fast-track consular filing for {theme.visaAssistanceCountries?.join(' • ')}.
                  </p>
                </div>
                <a
                  href="#quote-form"
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shrink-0 shadow-lg"
                >
                  Inquire Visa Fast-Track
                </a>
              </div>
            </div>
          )}

          {/* 🍽️ 2. RESTAURANT & DINING: Interactive Menu Tabs & VIP Reserve */}
          {activeThemeKey === 'RESTAURANT_DINING' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                  <Utensils className="w-4 h-4" /> Artisanal Culinary Experience
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Explore {businessName}'s Seasonal Menu
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Crafted daily from organic regional produce and signature Michelin-grade culinary techniques in {city}.
                </p>
              </div>

              {/* Menu Category Switcher Tabs */}
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                {(theme.menuCategories || []).map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMenuTab(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeMenuTab === idx
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Active Menu Dishes */}
              <div className="grid md:grid-cols-3 gap-5">
                {(theme.menuCategories?.[activeMenuTab]?.items || []).map((item, i) => (
                  <div 
                    key={i}
                    className={`p-5 rounded-2xl border space-y-3 transition hover:border-amber-500/50 flex flex-col justify-between ${
                      isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
                      <span className="text-sm font-extrabold text-amber-400 font-mono">{item.price}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    <div className="pt-2 flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                        {item.badge}
                      </span>
                      <a href="#quote-form" className="text-amber-400 hover:underline font-semibold flex items-center gap-1">
                        Reserve Table <ArrowRight className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🦷 3. DENTAL & CLINIC: Smile Transformations & Insurance Grid */}
          {activeThemeKey === 'DENTAL_MEDICAL' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center justify-center gap-1.5">
                  <Stethoscope className="w-4 h-4" /> Patient Smile Transformations
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  State-of-the-Art Clinical Outcomes
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Painless cosmetic, restorative, and orthodontic dental care engineered for lifelong oral health in {city}.
                </p>
              </div>

              {/* Smile Transformation Cards */}
              <div className="grid md:grid-cols-3 gap-5">
                {(theme.smileCases || []).map((c, i) => (
                  <div key={i} className={`p-6 rounded-2xl border space-y-4 ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                        {c.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">⏱️ {c.treatmentTime}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">{c.procedure}</h4>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div><strong className="text-slate-400">Condition:</strong> {c.condition}</div>
                      <div><strong className="text-teal-400">Clinical Result:</strong> {c.result}</div>
                    </div>
                    <a
                      href="#quote-form"
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:underline pt-2"
                    >
                      Book Free Smile Consultation <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>

              {/* Insurance Matrix Banner */}
              <div className="p-6 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" /> In-Network Insurance Accepted
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {theme.acceptedInsurance?.join(' • ')}
                  </div>
                </div>
                <a href="#quote-form" className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition shrink-0">
                  Verify Your Insurance
                </a>
              </div>
            </div>
          )}

          {/* 🏎️ 4. AUTOMOTIVE DETAILING: 3-Tier Ceramic Coating Comparison */}
          {activeThemeKey === 'AUTOMOTIVE_SERVICES' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center justify-center gap-1.5">
                  <Car className="w-4 h-4" /> Ceramic Coating & Paint Armor
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Precision Protection Tiers
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Certified 9H Graphene Ceramic Pro and computer-cut self-healing PPF in a climate-controlled clean bay in {city}.
                </p>
              </div>

              {/* 3 Detailing Tiers */}
              <div className="grid md:grid-cols-3 gap-6">
                {(theme.detailingTiers || []).map((tier, i) => (
                  <div 
                    key={i} 
                    className={`rounded-2xl p-6 border transition flex flex-col justify-between relative ${
                      tier.recommended
                        ? 'bg-slate-900 border-rose-500 shadow-2xl shadow-rose-600/20 ring-1 ring-rose-500'
                        : isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {tier.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        ★ Most Popular Package
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">{tier.badge}</span>
                        <span className="text-[11px] font-mono text-slate-500">⏱️ {tier.duration}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white">{tier.name}</h4>
                      <div className="text-3xl font-black text-rose-400 font-mono">{tier.price}</div>
                      
                      <div className="space-y-2 pt-3 border-t border-slate-800/80">
                        {tier.features.map((feat, f) => (
                          <div key={f} className="text-xs text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <a
                      href="#quote-form"
                      className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold text-center block transition ${
                        tier.recommended
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      Select {tier.name.split(' ')[0]}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏠 5. ROOFING & CONTRACTING: Drone Inspection & Material Comparison */}
          {activeThemeKey === 'ROOFING_CONSTRUCTION' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                  <Home className="w-4 h-4" /> Storm Damage & Drone Inspections
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Engineered Roofing Systems for {city}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Master certified contractors backed by 50-year manufacturer non-prorated warranties and 24/7 storm emergency dispatch.
                </p>
              </div>

              {/* 3 Material Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {(theme.roofingMaterials || []).map((mat, i) => (
                  <div key={i} className={`p-6 rounded-2xl border space-y-4 ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        {mat.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{mat.lifespan}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">{mat.name}</h4>
                    <p className="text-xs text-slate-400">{mat.desc}</p>
                    <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                      <div>🌪️ <strong className="text-white">Wind Rating:</strong> {mat.windRating}</div>
                      <div>🛡️ <strong className="text-amber-400">Warranty:</strong> {mat.warranty}</div>
                    </div>
                    <a href="#quote-form" className="text-xs font-bold text-amber-400 hover:underline block pt-2">
                      Get Estimate for this Material →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 💻 6. TECH & SAAS: Bento Grid & Speed Benchmark */}
          {activeThemeKey === 'TECH_SOFTWARE_AGENCY' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center justify-center gap-1.5">
                  <Laptop className="w-4 h-4" /> Next-Gen Engineering Standards
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  High-Performance Digital Infrastructure
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Sub-50ms Edge API latency, autonomous AI pipeline workflows, and high-converting modern web platforms.
                </p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(theme.bentoGrid || []).map((card, i) => (
                  <div key={i} className={`p-5 rounded-2xl border space-y-3 flex flex-col justify-between ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        {card.badge}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white font-mono">{card.stat}</div>
                      <div className="text-[10px] text-violet-400 font-semibold uppercase">{card.statLabel}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{card.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏡 7. REAL ESTATE: Luxury Listings Grid */}
          {activeThemeKey === 'REAL_ESTATE' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5">
                  <Building className="w-4 h-4" /> Featured Off-Market Portfolio
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Exclusive Architectural Listings in {city}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Confidential scouting, Matterport 3D digital tours, and private buyer advisory.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(theme.luxuryListings || []).map((prop) => (
                  <div key={prop.id} className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex flex-col justify-between">
                    <div className="relative h-48">
                      <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-emerald-500/90 text-slate-950 text-[10px] font-bold">
                        {prop.tag}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="text-lg font-black font-mono">{prop.price}</div>
                        <div className="text-[11px] text-slate-300">{prop.specs}</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-bold text-white">{prop.title}</h4>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        {prop.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400" /> <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <a href="#quote-form" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center block transition">
                        Schedule Private 4K Showing
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 💆 8. BEAUTY & SPA: Rejuvenation Rituals */}
          {activeThemeKey === 'BEAUTY_SPA_SALON' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-400 flex items-center justify-center gap-1.5">
                  <Smile className="w-4 h-4" /> Artisanal Sanctuary & Rejuvenation
                </span>
                <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Bespoke Beauty Treatments
                </h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(theme.spaTreatments || []).map((t) => (
                  <div key={t.id} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                        {t.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{t.duration}</span>
                    </div>
                    <h4 className="text-base font-bold text-white">{t.name}</h4>
                    <div className="text-2xl font-black text-fuchsia-400 font-mono">{t.price}</div>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                    <a href="#quote-form" className="w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold text-center block transition">
                      Book VIP Suite Session
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Standard Services Section */}
      <section className="py-16 border-t border-slate-800/80" id="services">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${theme.accentText}`}>
              Full Service Capabilities
            </span>
            <h3 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Tailored Offerings by {businessName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Commercial-grade quality engineered for residential and commercial clients across {city}.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {servicesToRender.slice(0, 4).map((svc, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-xl group space-y-3 ${
                  isLightMode 
                    ? 'bg-white border-slate-200' 
                    : 'bg-slate-900/70 border-slate-800/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-9 w-9 rounded-xl ${theme.badgeBg} flex items-center justify-center font-bold text-xs font-mono`}>
                    0{idx + 1}
                  </div>
                  {svc.badge && (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {svc.badge}
                    </span>
                  )}
                </div>
                <h4 className={`text-base font-bold transition ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {svc.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {svc.desc}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <a
                    href="#quote-form"
                    className={`inline-flex items-center gap-1 font-semibold ${theme.accentText} hover:underline transition`}
                  >
                    Book This Service <ArrowRight className="w-3 h-3" />
                  </a>
                  <span className="text-[10px] text-slate-500 font-mono">100% Guaranteed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Reviews Section */}
      <section className="py-16 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4" /> 5-Star Local Reputation
            </span>
            <h3 className={`text-2xl sm:text-3xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              What Clients in {city} Say
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {theme.reviews.map((rev, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className={`text-xs sm:text-sm italic leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                  "{rev.text}"
                </p>
                <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-3">
                  <div className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{rev.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{rev.role} • {city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic FAQs Section */}
      {theme.faqs && theme.faqs.length > 0 && (
        <section className="py-14 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${theme.accentText} flex items-center justify-center gap-1`}>
                <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
              </span>
              <h3 className={`text-xl sm:text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Everything You Need to Know
              </h3>
            </div>

            <div className="space-y-3">
              {theme.faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-xl border space-y-1.5 ${
                    isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    <span className={`${theme.accentText} font-mono`}>Q.</span>
                    <span>{faq.q}</span>
                  </div>
                  <div className="text-xs text-slate-400 pl-5 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 pb-20 md:pb-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} {businessName} • All rights reserved.</p>
          <p className="text-[11px] text-slate-600">
            Engineered & Custom-Designed as a high-converting prototype by{' '}
            <a href="https://synergytechsol.com" target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline">
              SynergyTech Solutions
            </a>
          </p>
        </div>
      </footer>

      {/* Floating Sticky Mobile Quick Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 md:hidden flex items-center gap-2.5 shadow-2xl">
        <a
          href="tel:5550192834"
          className="flex-1 py-3 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Phone className={`w-3.5 h-3.5 ${theme.accentText}`} />
          <span>Call Now</span>
        </a>
        <a
          href="#quote-form"
          className={`flex-1 py-3 px-3 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg ${theme.buttonClass}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Get Quote</span>
        </a>
      </div>
    </div>
  );
}
