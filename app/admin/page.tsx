import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, MessageSquare, Clapperboard } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import type { Produto, Story } from '@/types'
import ProductForm from './ProductForm'
import LogoutButton from './LogoutButton'
import ProductActions from './ProductActions'
import CommentsPanel from './CommentsPanel'
import StoriesManager from './StoriesManager'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  // Verifica sessão no servidor — middleware já redireciona, mas dupla checagem é boa prática
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca todos os produtos com imagens e variações
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, produto_imagens(id, url, ordem), produto_variacoes(id, produto_id, nome, imagem_url, ordem, created_at)')
    .order('created_at', { ascending: false })

  // Busca comentários pendentes de moderação
  const { data: comentariosPendentes } = await supabase
    .from('comentarios')
    .select('*, produtos(titulo)')
    .eq('aprovado', false)
    .order('created_at', { ascending: true })

  // Busca todos os stories
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .order('ordem', { ascending: true })

  return (
    <div className="min-h-screen bg-rose-50/40">
      {/* ── Header ── */}
      <header className="bg-white border-b border-rose-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="Glow Maker 3D"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
            <p className="text-xs text-rose-300 mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm text-rose-400 hover:text-rose-600 transition-colors"
            >
              Ver Loja →
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Coluna esquerda: Formulário */}
          <div className="lg:col-span-1">
            <ProductForm />
          </div>

          {/* Coluna direita: Lista de produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Produtos Cadastrados
                </h2>
                <span className="text-sm text-rose-400 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {produtos?.length ?? 0}
                </span>
              </div>

              {!produtos || produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-rose-200">
                  <Package size={40} strokeWidth={1} />
                  <p className="mt-3 text-sm text-rose-300">
                    Nenhum produto cadastrado. Use o formulário ao lado.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-rose-50">
                  {(produtos as Produto[]).map((produto) => {
                    const capa = (produto.produto_imagens ?? [])
                      .sort((a: {ordem: number}, b: {ordem: number}) => a.ordem - b.ordem)[0]?.url
                      ?? produto.imagem_url
                    return (
                    <li
                      key={produto.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-rose-50/50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-rose-50 flex-shrink-0">
                        {capa ? (
                          <Image
                            src={capa}
                            alt={produto.titulo}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-rose-200">
                            <Package size={22} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate leading-snug">
                          {produto.titulo}
                        </p>
                        <p className="text-sm text-gray-400 truncate mt-0.5">
                          {produto.descricao ?? '—'}
                        </p>
                        <p className="text-xs text-rose-300 mt-0.5">
                          {(produto.produto_imagens?.length ?? 0)} foto(s)
                        </p>
                      </div>

                      {/* Preço + ações */}
                      <div className="text-right flex-shrink-0 space-y-2">
                        <p className="font-bold text-rose-500 text-sm">
                          {produto.preco.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                        <ProductActions
                          id={produto.id}
                          titulo={produto.titulo}
                          descricao={produto.descricao ?? null}
                          preco={produto.preco}
                          ativo={produto.ativo}
                          imagens={produto.produto_imagens ?? []}
                          variacoes={produto.produto_variacoes ?? []}
                        />
                      </div>
                    </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Stories ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 flex items-center gap-2">
            <Clapperboard size={18} className="text-rose-400" />
            <h2 className="text-lg font-semibold text-gray-800">Stories</h2>
            <span className="text-sm text-rose-400 bg-rose-50 px-2.5 py-0.5 rounded-full ml-auto">
              {stories?.length ?? 0}
            </span>
          </div>
          <div className="p-6">
            <StoriesManager stories={(stories ?? []) as Story[]} />
          </div>
        </div>
      </div>

      {/* ── Moderação de Comentários ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-rose-400" />
              <h2 className="text-lg font-semibold text-gray-800">Comentários Pendentes</h2>
            </div>
            {(comentariosPendentes?.length ?? 0) > 0 && (
              <span className="text-sm bg-rose-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                {comentariosPendentes!.length}
              </span>
            )}
          </div>
          <div className="p-6">
            <CommentsPanel pendentes={(comentariosPendentes ?? []) as any} />
          </div>
        </div>
      </div>
    </div>
  )
}
