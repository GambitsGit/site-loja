'use client'

import { useState } from 'react'
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
      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
      title="Compartilhar produto"
    >
      <Share2 size={20} />
      {copied && <span className="text-xs text-green-500 font-medium">Link copiado!</span>}
    </button>
  )
}

function ProductPost({ produto }: { produto: Produto }) {
  const [selectedVar, setSelectedVar] = useState<ProdutoVariacao | null>(null)

  const imagens = (produto.produto_imagens ?? [])
    .sort((a, b) => a.ordem - b.ordem)
    .map((img) => img.url)
  if (imagens.length === 0 && produto.imagem_url) imagens.push(produto.imagem_url)

  const variacoes = (produto.produto_variacoes ?? []).sort((a, b) => a.ordem - b.ordem)

  return (
    <article className="border-b border-gray-100">
      {/* Post header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-50 flex-shrink-0 border border-rose-100">
          <Image src="/logo.png" alt="Glow Maker 3D" width={32} height={32} className="w-full h-full object-contain p-0.5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-none">glowmaker3d</p>
          <p className="text-xs text-gray-400 mt-0.5">Impressão 3D sob encomenda</p>
        </div>
      </div>

      {/* Image / Carousel */}
      <div className="relative w-full aspect-square bg-gray-50">
        <ProductCarousel
          imagens={imagens}
          titulo={produto.titulo}
          overrideImage={selectedVar?.imagem_url}
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
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
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
                      ? 'border-rose-400 scale-110 shadow-md'
                      : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  <Image src={v.imagem_url} alt={v.nome} fill className="object-cover" sizes="44px" />
                </div>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    selectedVar?.id === v.id ? 'text-rose-500' : 'text-gray-400'
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
          <p className="text-xl font-extrabold text-rose-500">
            {produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
            sob encomenda
          </span>
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900">{produto.titulo}</span>
          {selectedVar && (
            <span className="text-sm text-rose-400 font-medium"> — {selectedVar.nome}</span>
          )}
          {produto.descricao && (
            <span className="text-sm text-gray-500"> {produto.descricao}</span>
          )}
        </div>
        <a
          href={getWhatsAppLink(produto.titulo, produto.preco, selectedVar?.nome)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-1"
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

  return (
    <>
      {/* Profile tabs — feed / grid */}
      <div className="max-w-lg mx-auto flex border-t border-gray-100">
        <button
          onClick={() => setView('feed')}
          className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${
            view === 'feed'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-300 hover:text-gray-500'
          }`}
          title="Feed"
        >
          <List size={20} />
        </button>
        <button
          onClick={() => setView('grid')}
          className={`flex-1 flex items-center justify-center py-3 border-t-2 transition-colors ${
            view === 'grid'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-300 hover:text-gray-500'
          }`}
          title="Grade"
        >
          <LayoutGrid size={20} />
        </button>
      </div>

      <main className="max-w-lg mx-auto pb-20">
        {!produtos || produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <p className="mt-4 text-sm font-medium text-gray-400">
              Em breve, peças lindas esperando por você 🌸
            </p>
          </div>
        ) : view === 'feed' ? (
          <div>
            {produtos.map((p) => (
              <ProductPost key={p.id} produto={p} />
            ))}
          </div>
        ) : (
          /* Grid — 3 columns like Instagram profile */
          <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
            {produtos.map((produto) => {
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
                  onClick={() => setView('feed')}
                  className="relative aspect-square bg-white overflow-hidden"
                  title={produto.titulo}
                >
                  {cover ? (
                    <Image
                      src={cover}
                      alt={produto.titulo}
                      fill
                      className="object-cover"
                      sizes="33vw"
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
