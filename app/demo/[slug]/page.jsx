import React from 'react';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getIndustryTheme } from '@/lib/demoThemes';
import DemoPrototypeClient from '@/components/DemoPrototypeClient';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BACKUP_FILE = path.join(process.cwd(), 'data', 'fallback_leads.json');

function loadFallbackLeads() {
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8') || '[]');
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Fallback generator for demo if database record is fresh or during direct preview
function getMockLeadFromSlug(slug) {
  const words = (slug || 'business-demo').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
  const businessName = words.join(' ');

  // Auto-detect common industry types from slug words
  const slugLower = (slug || '').toLowerCase();
  let detectedCategory = 'Professional Services';
  if (
    slugLower.includes('travel') || 
    slugLower.includes('tour') || 
    slugLower.includes('ghaith') || 
    slugLower.includes('umrah') || 
    slugLower.includes('umra') || 
    slugLower.includes('hajj') || 
    slugLower.includes('ziyarat') || 
    slugLower.includes('trip') || 
    slugLower.includes('flight') || 
    slugLower.includes('visa')
  ) {
    detectedCategory = 'Travel & Tourism';
  }
  else if (slugLower.includes('roof') || slugLower.includes('construct')) detectedCategory = 'Roofing & Contracting';
  else if (slugLower.includes('dent') || slugLower.includes('clinic')) detectedCategory = 'Dental & Medical';
  else if (slugLower.includes('auto') || slugLower.includes('car') || slugLower.includes('detail')) detectedCategory = 'Automotive & Detailing';
  else if (slugLower.includes('law') || slugLower.includes('attorney')) detectedCategory = 'Legal Representation';
  else if (slugLower.includes('food') || slugLower.includes('cafe') || slugLower.includes('restaurant')) detectedCategory = 'Restaurant & Dining';
  else if (slugLower.includes('real') || slugLower.includes('estate')) detectedCategory = 'Luxury Real Estate';
  else if (slugLower.includes('spa') || slugLower.includes('salon') || slugLower.includes('beauty')) detectedCategory = 'Luxury Salon & Spa';
  else if (slugLower.includes('tech') || slugLower.includes('saas') || slugLower.includes('software') || slugLower.includes('dmz')) detectedCategory = 'Technology & Digital Solutions';

  return {
    business_name: businessName || 'Apex Premier Services',
    owner_name: 'Team',
    category: detectedCategory,
    city: 'Local Area',
    services: [],
    rating: 4.9,
    review_count: 64,
  };
}

async function getLeadBySlug(slug) {
  // 1. Try Supabase
  if (isSupabaseConfigured) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('business_slug', slug)
        .maybeSingle();

      if (!error && data) return data;

      const { data: list } = await supabase.from('leads').select('*').limit(50);
      const match = list?.find(
        (l) => l.business_slug === slug || (l.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-') === slug
      );
      if (match) return match;
    } catch (e) {
      console.warn('Supabase lead fetch notice in demo page:', e.message);
    }
  }

  // 2. Fallback to local storage
  const fallbackList = loadFallbackLeads();
  const localMatch = fallbackList.find(
    (l) => l.business_slug === slug || (l.business_name || '').toLowerCase().replace(/[^a-z0-9]/g, '-') === slug
  );
  if (localMatch) return localMatch;

  return getMockLeadFromSlug(slug);
}

export default async function DemoPrototypePage({ params }) {
  const lead = await getLeadBySlug(params?.slug);
  const theme = getIndustryTheme(lead);

  return (
    <DemoPrototypeClient 
      initialLead={lead}
      initialTheme={theme}
    />
  );
}
