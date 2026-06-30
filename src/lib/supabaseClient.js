import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Defensive helper to prevent App crash when Supabase keys are empty (e.g. before user configures keys)
const isValidUrl = (url) => {
  if (!url || url === 'https://your-supabase-project.supabase.co' || url.trim() === '') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        signUp: async () => { throw new Error("Supabase URL tidak terkonfigurasi."); },
        signInWithPassword: async () => { throw new Error("Supabase URL tidak terkonfigurasi."); },
        signInWithOAuth: async () => { throw new Error("Supabase URL tidak terkonfigurasi."); }
      },
      from: () => ({
        select: () => ({ order: () => ({ data: [], error: null }), eq: () => ({ maybeSingle: () => ({ data: null, error: null }), order: () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: new Error("Supabase tidak aktif di Mode Demo") }) }) }),
        upsert: () => Promise.resolve({ data: null, error: new Error("Supabase tidak aktif di Mode Demo") }),
        update: () => ({ eq: () => ({ error: new Error("Supabase tidak aktif di Mode Demo") }) }),
        delete: () => ({ eq: () => ({ error: new Error("Supabase tidak aktif di Mode Demo") }) })
      })
    };
