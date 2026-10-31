'use client';

import React, { useState, useRef, useCallback } from 'react';
import { SlidersHorizontal, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

const COMPARISONS_BY_NICHE = {
  AUTOMOTIVE_SERVICES: {
    beforeImg: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Swirl Marks & Paint Oxidation',
    afterLabel: 'AFTER: 9H Mirror Ceramic Shield',
    badge: 'Ceramic & Detailing Transformation',
    stat: '100% Mirror Depth Restored',
  },
  ROOFING_CONSTRUCTION: {
    beforeImg: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Storm Hail Leaks & Weather Damage',
    afterLabel: 'AFTER: Architectural Slate 50-Yr Warranty',
    badge: 'Structural Craftsmanship',
    stat: '130mph Wind-Rated Barrier',
  },
  DENTAL_MEDICAL: {
    beforeImg: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Wear, Discoloration & Alignment',
    afterLabel: 'AFTER: Custom Porcelain Aesthetic Smile',
    badge: 'Cosmetic Dentistry Results',
    stat: 'Natural Multi-Layer Luminescence',
  },
  REAL_ESTATE: {
    beforeImg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Outdated 1990s Dark Layout',
    afterLabel: 'AFTER: Modern Luxury Open-Concept Staging',
    badge: 'Property Valuation Lift',
    stat: '+$140k Est. Appraisal Equity',
  },
  TRAVEL_TOURISM: {
    beforeImg: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Commercial Delays & Booking Stress',
    afterLabel: 'AFTER: All-Inclusive 5-Star VIP Concierge',
    badge: 'Bespoke Curated Experience',
    stat: '100% Hassle-Free Guarantees',
  },
  RESTAURANT_DINING: {
    beforeImg: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Raw Local Farm Ingredients',
    afterLabel: 'AFTER: Wood-Fired Artisanal Signature Plating',
    badge: 'Gastronomic Excellence',
    stat: 'Craft Culinary Standards',
  },
  DEFAULT: {
    beforeImg: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    afterImg: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    beforeLabel: 'BEFORE: Outdated Offline Manual Bottlenecks',
    afterLabel: 'AFTER: High-Converting Automated 24/7 Engine',
    badge: 'Commercial-Grade Performance',
    stat: '5-Star Guaranteed Delivery',
  }
};

export default function BeforeAfterSlider({
  themeKey = 'DEFAULT',
  businessName = 'Apex Solutions',
  city = 'Local Area',
  theme = null,
  isLightMode = false,
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const activeData = COMPARISONS_BY_NICHE[themeKey] || COMPARISONS_BY_NICHE.DEFAULT;
  const accentText = theme?.accentText || 'text-cyan-400';
  const badgeBg = theme?.badgeBg || 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200';

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches[0]) return;
    handleMove(e.touches[0].clientX);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  return (
    <section className="py-16 border-t border-slate-800/80 relative overflow-hidden" id="before-after">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm bg-slate-900/80 border-slate-800 text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Proof of Quality</span>
          </div>
          <h3 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            See The Real Difference By {businessName}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Slide the divider left or right to inspect the before-and-after standards delivered across {city}.
          </p>
        </div>

        {/* Comparison Showcase Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDragging}
          className="relative w-full h-[320px] sm:h-[480px] md:h-[520px] rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl select-none group cursor-ew-resize bg-slate-950"
        >
          {/* AFTER IMAGE (Full Background) */}
          <img
            src={activeData.afterImg}
            alt={activeData.afterLabel}
            className="absolute inset-0 w-full h-full object-cover"
            draggable="false"
          />

          {/* AFTER BADGE (Right Side) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeData.afterLabel}</span>
            </div>
          </div>

          {/* BEFORE IMAGE (Clipped on Left Side) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={activeData.beforeImg}
              alt={activeData.beforeLabel}
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
                height: '100%',
              }}
              draggable="false"
            />
            {/* Darker contrast overlay on before side to highlight difference */}
            <div className="absolute inset-0 bg-slate-950/20" />

            {/* BEFORE BADGE (Left Side) */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 shadow-lg">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{activeData.beforeLabel}</span>
              </div>
            </div>
          </div>

          {/* DRAGGABLE VERTICAL DIVIDER LINE */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* Glowing vertical line */}
            <div className="absolute top-0 bottom-0 -left-0.5 w-1 bg-gradient-to-b from-cyan-400 via-white to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

            {/* Interactive Circular Drag Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900 border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] flex items-center justify-center text-white cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-0.5 text-cyan-300 font-black text-xs">
                <span>◀</span>
                <span>▶</span>
              </div>
            </div>
          </div>

          {/* Bottom Floating Stats Pill */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[90%]">
            <div className="px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 text-white text-xs flex items-center gap-3 shadow-2xl">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {activeData.badge}
              </span>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="hidden sm:inline text-slate-300 font-mono text-[11px] font-semibold">
                {activeData.stat}
              </span>
            </div>
          </div>
        </div>

        {/* Micro-Interaction Drag Hint */}
        <p className="text-center text-[11px] text-slate-500 mt-3 font-mono">
          💡 Click & drag the slider or swipe horizontally on mobile to compare results
        </p>

      </div>
    </section>
  );
}
