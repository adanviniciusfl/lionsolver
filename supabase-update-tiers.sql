-- =================================================================================
-- LIONSOLVER: SUPABASE UPDATE TIERS & DOCUMENTO (v1.8.1)
-- Execute este script no SQL Editor do Supabase para atualizar a tabela Profiles.
-- =================================================================================

-- 1. Adicionar a coluna documento na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS documento TEXT;

-- 2. Atualizar o Trigger de Novos Usuários para ler os metadados do Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, documento)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'tier', 'self'), 
    new.raw_user_meta_data->>'documento'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
