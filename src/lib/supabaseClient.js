import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appBaseUrl = import.meta.env.VITE_APP_BASE_URL;

let browserClient;

export function hasSupabaseBrowserEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseBrowserConfig() {
  return {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    appBaseUrl: appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
  };
}

export function getSupabaseBrowserConfigError() {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!missing.length) return null;
  return `Missing ${missing.join(' and ')}. Check the Vercel environment variables for this deployment.`;
}

export function getSupabaseClient() {
  const configError = getSupabaseBrowserConfigError();
  if (configError) {
    throw new Error(configError);
  }

  if (!browserClient) {
    if (import.meta.env.DEV) {
      console.info('[supabase-auth-config]', getSupabaseBrowserConfig());
    }

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

// Lazy proxy keeps incremental migration files importable before real Supabase
// env values are configured. The actual client is only created when used.
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabaseClient()[prop];
    },
  }
);
