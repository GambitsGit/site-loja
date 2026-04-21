-- ============================================================
-- Script SQL - E-commerce Impressão 3D
-- Cole e execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. CRIAR TABELA DE PRODUTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.produtos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT          NOT NULL,
  descricao   TEXT,
  preco       NUMERIC(10,2) NOT NULL,
  imagem_url  TEXT,
  ativo       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO
-- ============================================================

-- Política 1: Qualquer pessoa pode LER produtos (vitrine pública)
CREATE POLICY "produtos_select_public"
  ON public.produtos
  FOR SELECT
  TO public
  USING (true);

-- Política 2: Apenas usuários autenticados podem INSERIR
CREATE POLICY "produtos_insert_authenticated"
  ON public.produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política 3: Apenas usuários autenticados podem ATUALIZAR
CREATE POLICY "produtos_update_authenticated"
  ON public.produtos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política 4: Apenas usuários autenticados podem EXCLUIR
CREATE POLICY "produtos_delete_authenticated"
  ON public.produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- 4. TABELA DE IMAGENS (múltiplas fotos por produto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.produto_imagens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.produto_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produto_imagens_select_public"
  ON public.produto_imagens FOR SELECT TO public USING (true);

CREATE POLICY "produto_imagens_insert_authenticated"
  ON public.produto_imagens FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "produto_imagens_delete_authenticated"
  ON public.produto_imagens FOR DELETE TO authenticated USING (true);

-- ============================================================
-- INSTRUÇÕES PARA O SUPABASE STORAGE
-- ============================================================
-- Execute os passos abaixo no Dashboard do Supabase:
--
-- 1. Vá em: Storage → New Bucket
-- 2. Nome do bucket: produtos-3d
-- 3. Marque "Public bucket" (deixar público para acesso às imagens)
-- 4. Clique em "Save"
--
-- Após criar o bucket, crie a seguinte policy de Storage
-- via: Storage → Policies → New Policy (no bucket produtos-3d):
--
-- Para permitir upload por usuários autenticados (INSERT):
-- CREATE POLICY "storage_insert_authenticated"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'produtos-3d');
--
-- Para leitura pública dos arquivos (SELECT):
-- CREATE POLICY "storage_select_public"
--   ON storage.objects
--   FOR SELECT
--   TO public
--   USING (bucket_id = 'produtos-3d');
-- ============================================================
