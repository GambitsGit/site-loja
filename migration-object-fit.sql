-- Adicionar coluna object_fit na tabela produtos
-- Para controlar se a imagem deve ser cortada (cover) ou ajustada (contain)

ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS object_fit TEXT NOT NULL DEFAULT 'contain' CHECK (object_fit IN ('cover', 'contain'));

-- Atualizar produtos existentes para usar 'contain' (não corta a imagem)
UPDATE produtos SET object_fit = 'contain' WHERE object_fit IS NULL OR object_fit = '';

COMMENT ON COLUMN produtos.object_fit IS 'Como a imagem deve ser exibida: cover (preenche e corta) ou contain (ajusta sem cortar)';
