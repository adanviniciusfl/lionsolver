import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

console.log("🔍 [LIONSOLVER DEBUG] URL:", supabaseUrl || "NÃO DEFINIDA");
console.log("🔍 [LIONSOLVER DEBUG] Key Length:", supabaseAnonKey ? supabaseAnonKey.length : 0);
if (supabaseAnonKey) {
  console.log("🔍 [LIONSOLVER DEBUG] Key Prefixo (deve iniciar com eyJ):", supabaseAnonKey.substring(0, 10));
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis do Supabase (URL e ANON_KEY) não encontradas.');
}

// Fallback seguro de inicialização para não quebrar a montagem da árvore do React se faltar variáveis
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey);
