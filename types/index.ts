export type ProdutoImagem = {
  id: string
  produto_id: string
  url: string
  ordem: number
  created_at: string
}

export type ProdutoVariacao = {
  id: string
  produto_id: string
  nome: string
  imagem_url: string
  ordem: number
  created_at: string
}

export type Produto = {
  id: string
  titulo: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  ativo: boolean
  created_at: string
  produto_imagens?: ProdutoImagem[]
  produto_variacoes?: ProdutoVariacao[]
}

export type Comentario = {
  id: string
  produto_id: string
  nome: string
  texto: string
  aprovado: boolean
  resposta_admin: string | null
  created_at: string
}

export type Story = {
  id: string
  titulo: string
  subtitulo: string | null
  tipo: 'produto' | 'depoimento' | 'destaque'
  capa_url: string
  midia_url: string | null
  midia_tipo: 'imagem' | 'video'
  produto_id: string | null
  ordem: number
  ativo: boolean
  created_at: string
}
