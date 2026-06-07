import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase helpers for Vercel API routes.
 *
 * Do not import this file from React components, hooks, or any code bundled by
 * Vite for the browser. The service-role key bypasses RLS and must never be
 * exposed client-side.
 */

function requireServerEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }
  return value;
}

export function createServerSupabaseClient({ accessToken } = {}) {
  const supabaseUrl = requireServerEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseAnonKey = requireServerEnv('VITE_SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createServiceRoleSupabaseClient() {
  const supabaseUrl = requireServerEnv('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceRoleKey = requireServerEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
