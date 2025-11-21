import { createClient } from '@supabase/supabase-js';

// Utiliser les variables d'environnement avec des valeurs par défaut pour le développement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://fydfrytvaqgeotdsewoi.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5ZGZyeXR2YXFnZW90ZHNld29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjA4NjIsImV4cCI6MjA3OTIzNjg2Mn0.bfF1pGCraL2Vy9KjgVhtre86V1it-P47F0w1EYfNL2k";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
