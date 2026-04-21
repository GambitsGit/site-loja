export type ProdutoImagem = {
  id: string
  produto_id: string
  url: string
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
}
