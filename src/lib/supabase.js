import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis do Supabase (URL e ANON_KEY) não encontradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
