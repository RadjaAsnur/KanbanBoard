import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables via Vite import.meta.env
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanitize URL (removes any accidental /rest/v1 or trailing slashes)
export const supabaseUrl = rawUrl
  ? String(rawUrl).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : '';

export const supabaseAnonKey = rawAnonKey ? String(rawAnonKey).trim() : '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Detailed initialization logging for browser console (F12)
if (typeof window !== 'undefined') {
  if (isSupabaseConfigured) {
    console.log(
      '%c[Supabase Client] Initialized successfully%c\n' +
      `URL: ${supabaseUrl}\n` +
      `Anon Key: ${supabaseAnonKey.slice(0, 15)}... (${supabaseAnonKey.length} chars)`,
      'color: #10b981; font-weight: bold;',
      'color: inherit;'
    );
  } else {
    console.error(
      '%c[Supabase Client] Configuration Missing or Undefined!%c\n' +
      `VITE_SUPABASE_URL: ${rawUrl} (${typeof rawUrl})\n` +
      `VITE_SUPABASE_ANON_KEY: ${rawAnonKey ? 'provided' : 'undefined/empty'} (${typeof rawAnonKey})\n` +
      'Please check your .env or .env.local file.',
      'color: #ef4444; font-weight: bold;',
      'color: inherit;'
    );
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
