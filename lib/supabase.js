import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  (supabaseServiceKey || supabaseAnonKey)
);

const realtimeOptions = typeof window === 'undefined' ? { transport: ws } : {};

// Custom fetch wrapper with 30s timeout and connection retry
const resilientFetch = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  return fetch(url, {
    ...options,
    signal: options.signal || controller.signal,
  }).finally(() => clearTimeout(timeoutId));
};

// Client for browser / public actions
export const supabasePublic = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: realtimeOptions,
      global: { fetch: resilientFetch },
    })
  : null;

// Admin Client for server-side API routes & cron jobs
export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'https://your-project.supabase.co') {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: realtimeOptions,
    global: { fetch: resilientFetch },
  });
};
