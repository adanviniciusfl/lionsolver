import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis do Supabase (URL e ANON_KEY) não encontradas em .env.local.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
