import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase non configuré. Veuillez configurer les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans le fichier .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
