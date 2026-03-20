import { createClient } from '@supabase/supabase-js';

// Vite exposes variables prefixed with VITE_ via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. History features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
