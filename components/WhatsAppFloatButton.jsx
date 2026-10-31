'use client';

import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';

export default function WhatsAppFloatButton({
  phone = null,
  businessName = 'Apex Premier',
  city = 'Local Area',
}) {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
  const greetingText = `Hi ${businessName}, I saw your website in ${city} and would like to request a fast quote for your services. Are you currently available?`;
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greetingText)}` 
    : null;

  return (
    <aside aria-label="Quick Communication" className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5">
      {/* Floating 1-Tap WhatsApp CTA */}
      {waUrl ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 border border-emerald-400/40 transition-all duration-300 hover:scale-105 active:scale-95"
          title={`Chat with ${businessName} directly on WhatsApp`}
        >
          {/* Pulsing Status Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
          </span>

          <MessageCircle className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
          <span className="tracking-wide">
            Chat on WhatsApp
          </span>
        </a>
      ) : phone ? (
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl border border-emerald-400/40 transition-all hover:scale-105 active:scale-95"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call: {phone}</span>
        </a>
      ) : null}
    </aside>
  );
}
