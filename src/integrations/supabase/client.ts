import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fydfrytvaqgeotdsewoi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5ZGZyeXR2YXFnZW90ZHNld29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjA4NjIsImV4cCI6MjA3OTIzNjg2Mn0.bfF1pGCraL2Vy9KjgVhtre86V1it-P47F0w1EYfNL2k";

export const supabase = createClient(supabaseUrl, supabaseKey);
