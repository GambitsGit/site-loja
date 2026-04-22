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
-- 5. TABELA DE VARIAÇÕES / CORES (ex: Rosa, Branco, Lilás)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.produto_variacoes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  imagem_url  TEXT        NOT NULL,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.produto_variacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produto_variacoes_select_public"
  ON public.produto_variacoes FOR SELECT TO public USING (true);

CREATE POLICY "produto_variacoes_insert_authenticated"
  ON public.produto_variacoes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "produto_variacoes_update_authenticated"
  ON public.produto_variacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "produto_variacoes_delete_authenticated"
  ON public.produto_variacoes FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 6. TABELA DE LIKES (curtidas por produto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  visitor_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (produto_id, visitor_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select_public"
  ON public.likes FOR SELECT TO public USING (true);

CREATE POLICY "likes_insert_public"
  ON public.likes FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "likes_delete_public"
  ON public.likes FOR DELETE TO public USING (true);

-- ============================================================
-- 7. TABELA DE COMENTÁRIOS / PERGUNTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comentarios (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id      UUID        NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL,
  texto           TEXT        NOT NULL,
  aprovado        BOOLEAN     NOT NULL DEFAULT false,
  resposta_admin  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- Visitantes anônimos só veem comentários aprovados
CREATE POLICY "comentarios_select_anon"
  ON public.comentarios FOR SELECT TO anon USING (aprovado = true);

-- Admin (autenticado) vê todos
CREATE POLICY "comentarios_select_auth"
  ON public.comentarios FOR SELECT TO authenticated USING (true);

-- Qualquer visitante pode enviar comentário (aprovado deve ser false)
CREATE POLICY "comentarios_insert_public"
  ON public.comentarios FOR INSERT TO public WITH CHECK (aprovado = false);

-- Admin pode aprovar, responder e excluir
CREATE POLICY "comentarios_update_auth"
  ON public.comentarios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "comentarios_delete_auth"
  ON public.comentarios FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 8. TABELA DE STORIES (destaques fixados abaixo da bio)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT        NOT NULL,
  subtitulo   TEXT,
  tipo        TEXT        NOT NULL DEFAULT 'destaque' CHECK (tipo IN ('produto', 'depoimento', 'destaque')),
  capa_url    TEXT        NOT NULL,
  midia_url   TEXT,
  midia_tipo  TEXT        NOT NULL DEFAULT 'imagem' CHECK (midia_tipo IN ('imagem', 'video')),
  produto_id  UUID        REFERENCES public.produtos(id) ON DELETE SET NULL,
  ordem       INTEGER     NOT NULL DEFAULT 0,
  ativo       BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_select_public"
  ON public.stories FOR SELECT TO public USING (true);

CREATE POLICY "stories_insert_auth"
  ON public.stories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "stories_update_auth"
  ON public.stories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "stories_delete_auth"
  ON public.stories FOR DELETE TO authenticated USING (true);

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
