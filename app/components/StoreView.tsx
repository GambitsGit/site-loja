'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { LayoutGrid, List, Share2, ShoppingBag } from 'lucide-react'
import type { Produto, ProdutoVariacao } from '@/types'
import ProductCarousel from './ProductCarousel'
import LikeButton from './LikeButton'
import CommentsSection from './CommentsSection'

const WHATSAPP_NUMBER = '5541992533439'

function getWhatsAppLink(titulo: string, preco: number, variacao?: string): string {
  const precoFormatado = preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const variacaoText = variacao ? ` na cor *${variacao}*` : ''
  const mensagem = `Olá! Vi a peça *${titulo}*${variacaoText} no site por R$ ${precoFormatado} e tenho interesse em comprar!`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`
}

function ShareButton({ titulo, preco }: { titulo: string; preco: number }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const precoStr = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    const shareData = {
      title: titulo,
      text: `${titulo} — ${precoStr} ✨ Acessórios 3D da Glow Maker 3D!`,
      url: window.location.href,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      title="Compartilhar produto"
    >
      <Share2 size={20} />
      {copied && <span className="text-xs text-green-500 dark:text-green-400 font-medium">Link copiado!</span>}
    </button>
  )
}

function ProductPost({ produto, priority, postRef }: { produto: Produto; priority?: boolean; postRef?: (el: HTMLElement | null) => void }) {
  const [selectedVar, setSelectedVar] = useState<ProdutoVariacao | null>(null)

  const imagens = (produto.produto_imagens ?? [])
    .sort((a, b) => a.ordem - b.ordem)
    .map((img) => img.url)
  if (imagens.length === 0 && produto.imagem_url) imagens.push(produto.imagem_url)

  const variacoes = (produto.produto_variacoes ?? []).sort((a, b) => a.ordem - b.ordem)
  const [expandedDesc, setExpandedDesc] = useState(false)
  const CHAR_LIMIT = 120
  const descLonga = (produto.descricao?.length ?? 0) > CHAR_LIMIT

  // Pré-aquece o cache do Vercel Image Optimization para as variações de cor
  // assim a troca de imagem é instantânea quando o usuário clica
  useEffect(() => {
    variacoes.forEach((v) => {
      const img = new window.Image()
      img.src = `/_next/image?url=${encodeURIComponent(v.imagem_url)}&w=640&q=75`
    })
  }, [variacoes])

  return (
    <article ref={postRef} className="border-b border-gray-100 dark:border-gray-800 scroll-mt-16"  id={`produto-${produto.id}`}>
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-50 dark:bg-rose-950 flex-shrink-0 border border-rose-100 dark:border-rose-900">
          <Image src="/logo.png" alt="Glow Maker 3D" width={32} height={32} className="w-full h-full object-contain p-0.5" priority />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-none">glowmaker3d</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Impressão 3D sob encomenda</p>
        </div>
      </div>

      {/* Image / Carousel */}
      <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-800">
        <ProductCarousel
          imagens={imagens}
          titulo={produto.titulo}
          overrideImage={selectedVar?.imagem_url}
          priority={priority}
          objectFit={produto.object_fit || 'contain'}
        />
      </div>

      {/* Action bar */}
      <div className="px-4 pt-3 flex items-center gap-3">
        <LikeButton produtoId={produto.id} />
        <div className="ml-auto">
          <ShareButton titulo={produto.titulo} preco={produto.preco} />
        </div>
      </div>

      {/* Variações de cor */}
      {variacoes.length > 0 && (
        <div className="px-4 pt-2.5">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            Cores disponíveis
          </p>
          <div className="flex gap-3 flex-wrap">
            {variacoes.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVar((prev) => (prev?.id === v.id ? null : v))}
                title={v.nome}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedVar?.id === v.id
                      ? 'border-rose-400 dark:border-rose-500 scale-110 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Image src={v.imagem_url} alt={v.nome} fill className="object-cover" sizes="44px" loading="eager" quality={85} />
                </div>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    selectedVar?.id === v.id ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {v.nome}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info + CTA */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold text-rose-500 dark:text-rose-400">
            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
            sob encomenda
          </span>
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{produto.titulo}</span>
          {selectedVar && (
            <span className="text-sm text-rose-400 font-medium"> — {selectedVar.nome}</span>
          )}
          {produto.descricao && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {' '}
              {descLonga && !expandedDesc
                ? produto.descricao.slice(0, CHAR_LIMIT).trimEnd() + '…'
                : produto.descricao}
              {descLonga && (
                <button
                  onClick={() => setExpandedDesc((v) => !v)}
                  className="ml-1 text-rose-400 dark:text-rose-500 font-semibold hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                >
                  {expandedDesc ? ' ver menos' : ' ver mais'}
                </button>
              )}
            </span>
          )}
        </div>
        <a
          href={getWhatsAppLink(produto.titulo, produto.preco, selectedVar?.nome)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-1"
        >
          <ShoppingBag size={16} />
          {selectedVar
            ? `Quero na cor ${selectedVar.nome}!`
            : 'Quero esse! Comprar pelo WhatsApp'}
        </a>
      </div>
      <CommentsSection produtoId={produto.id} titulo={produto.titulo} />
    </article>
  )
}

interface Props {
  produtos: Produto[]
}

export default function StoreView({ produtos }: Props) {
  const [view, setView] = useState<'feed' | 'grid'>('feed')
  const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null)
  const postRefs = useRef<Map<string, HTMLElement>>(new Map())

  const scrollToProduct = (produtoId: string) => {
    const element = postRefs.current.get(produtoId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setSelectedProdutoId(produtoId)
      // Remove highlight depois de 2s
      setTimeout(() => setSelectedProdutoId(null), 2000)
    }
  }

  return (
    <>
      {/* Profile tabs — feed / grid */}
      <div className="max-w-lg mx-auto flex border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setView('feed')}
          className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${
            view === 'feed'
              ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
              : 'border-transparent text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
          }`}
          title="Feed"
        >
          <List size={20} />
        </button>
        <button
          onClick={() => setView('grid')}
          className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${
            view === 'grid'
              ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
              : 'border-transparent text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'
          }`}
          title="Grade"
        >
          <LayoutGrid size={20} />
        </button>
      </div>

      <main className="max-w-lg mx-auto pb-20">
        {!produtos || produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300 dark:text-gray-600">
            <p className="mt-4 text-sm font-medium text-gray-400 dark:text-gray-500">
              Em breve, peças lindas esperando por você 🌸
            </p>
          </div>
        ) : view === 'feed' ? (
          <div>
            {produtos.map((p, i) => (
              <ProductPost
                key={p.id}
                produto={p}
                priority={i < 3}
                postRef={(el: HTMLElement | null) => {
                  if (el) postRefs.current.set(p.id, el)
                  return undefined
                }}
              />
            ))}
          </div>
        ) : (
          /* Grid — 3 columns like Instagram profile */
          <div className="grid grid-cols-3 gap-0.5 bg-gray-100 dark:bg-gray-800">
            {produtos.map((produto, gridIndex) => {
              const imagens = (produto.produto_imagens ?? [])
                .sort((a, b) => a.ordem - b.ordem)
                .map((img) => img.url)
              if (imagens.length === 0 && produto.imagem_url) imagens.push(produto.imagem_url)
              const cover = imagens[0]
              const hasMultiple =
                imagens.length > 1 || (produto.produto_variacoes?.length ?? 0) > 0

              return (
                <button
                  key={produto.id}
                  onClick={() => {
                    setView('feed')
                    // Aguarda o DOM atualizar antes de scrollar
                    setTimeout(() => scrollToProduct(produto.id), 100)
                  }}
                  className="relative aspect-square bg-white overflow-hidden hover:opacity-90 transition-opacity"
                  title={produto.titulo}
                >
                  {cover ? (
                    <Image
                      src={cover}
                      alt={produto.titulo}
                      fill
                      className="object-cover"
                      sizes="33vw"
                      loading={gridIndex < 6 ? "eager" : "lazy"}
                      quality={85}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ShoppingBag size={24} strokeWidth={1} />
                    </div>
                  )}
                  {hasMultiple && (
                    <div className="absolute top-1.5 right-1.5 bg-black/40 rounded-full p-0.5">
                      <LayoutGrid size={10} className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
