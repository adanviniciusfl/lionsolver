-- =================================================================================
-- LIONSOLVER: SUPABASE SCHEMA & RLS POLICIES (v1.8.0 - SaaS Pivot)
-- Execute este script inteiro no SQL Editor do Supabase.
-- =================================================================================

-- 1. Tabela de Perfis/Usuários (Extensão amigável da tabela auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  tier TEXT DEFAULT 'self' CHECK (tier IN ('self', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para criar profile automaticamente quando um user se registra
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tier)
  VALUES (new.id, 'self');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Tabela de Empresas
-- Usamos JSONB para `anexos`, `apuracoes` e `notas` para não quebrar a estrutura existente do App.jsx
CREATE TABLE public.empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  regime_tributario TEXT DEFAULT 'Simples Nacional',
  anexos JSONB DEFAULT '[]'::jsonb,
  faturamento_12m NUMERIC DEFAULT 0,
  apuracoes JSONB DEFAULT '[]'::jsonb,
  notas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- ROW LEVEL SECURITY (RLS)
-- Assegura que um usuário logado SÓ pode ler, editar e deletar as PRÓPRIAS empresas
-- =================================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Usuários podem ver o próprio profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Empresas
CREATE POLICY "Usuários podem ver as próprias empresas" 
ON public.empresas FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir empresas para si mesmos" 
ON public.empresas FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar as próprias empresas" 
ON public.empresas FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar as próprias empresas" 
ON public.empresas FOR DELETE USING (auth.uid() = user_id);

-- =================================================================================
-- 🚀 TUDO PRONTO! O BD ESTÁ CONFIGURADO E SEGURO.
-- =================================================================================
