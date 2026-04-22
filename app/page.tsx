import Image from 'next/image'
import { MessageCircle, Package, ShoppingBag } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import type { Produto } from '@/types'
import ProductCarousel from './components/ProductCarousel'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = '5541992533439'

function getWhatsAppLink(titulo: string, preco: number): string {
  const precoFormatado = preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const mensagem = `Olá! Vi a peça *${titulo}* no site por R$ ${precoFormatado} e tenho interesse em comprar!`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`
}

export default async function Home() {
  const supabase = await createClient()

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('*, produto_imagens(id, url, ordem)')
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error.message)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header estilo Instagram ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="Glow Maker 3D"
            width={130}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          >
            <MessageCircle size={13} />
            Contato
          </a>
        </div>
      </header>

      {/* ── Bio / intro ── */}
      <div className="max-w-lg mx-auto px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-rose-50 flex-shrink-0 border-2 border-rose-200">
            <Image
              src="/logo.png"
              alt="Glow Maker 3D"
              width={64}
              height={64}
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">glowmaker3d</p>
            <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
              ✨ Acessórios de maquiagem em impressão 3D<br />
              🎀 Feitos sob encomenda com amor<br />
              💬 Peça pelo WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* ── Feed de posts ── */}
      <main className="max-w-lg mx-auto pb-20">
        {!produtos || produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <Package size={56} strokeWidth={1} />
            <p className="mt-4 text-sm font-medium text-gray-400">
              Em breve, peças lindas esperando por você 🌸
            </p>
          </div>
        ) : (
          <div>
            {(produtos as Produto[]).map((produto) => {
              const imagens = (produto.produto_imagens ?? [])
                .sort((a, b) => a.ordem - b.ordem)
                .map((img) => img.url)

              if (imagens.length === 0 && produto.imagem_url) {
                imagens.push(produto.imagem_url)
              }

              return (
                <article key={produto.id} className="border-b border-gray-100">

                  {/* Cabeçalho do post */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-50 flex-shrink-0 border border-rose-100">
                      <Image src="/logo.png" alt="Glow Maker 3D" width={32} height={32} className="w-full h-full object-contain p-0.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-none">glowmaker3d</p>
                      <p className="text-xs text-gray-400 mt-0.5">Impressão 3D sob encomenda</p>
                    </div>
                  </div>

                  {/* Imagem / Carrossel — quadrado como Instagram */}
                  <div className="relative w-full aspect-square bg-gray-50">
                    <ProductCarousel imagens={imagens} titulo={produto.titulo} />
                  </div>

                  {/* Ações e info */}
                  <div className="px-4 py-3 space-y-2">
                    {/* Preço destaque */}
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-extrabold text-rose-500">
                        {produto.preco.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        sob encomenda
                      </span>
                    </div>

                    {/* Título e descrição */}
                    <div>
                      <span className="text-sm font-bold text-gray-900">{produto.titulo}</span>
                      {produto.descricao && (
                        <span className="text-sm text-gray-500"> {produto.descricao}</span>
                      )}
                    </div>

                    {/* Botão WhatsApp */}
                    <a
                      href={getWhatsAppLink(produto.titulo, produto.preco)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl transition-all text-sm mt-1"
                    >
                      <ShoppingBag size={16} />
                      Quero esse! Comprar pelo WhatsApp
                    </a>
                  </div>

                </article>
              )
            })}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-lg mx-auto px-4 py-6 text-center text-xs text-gray-300 border-t border-gray-100">
        © {new Date().getFullYear()} Glow Maker 3D — Feito com 💕
      </footer>
    </div>
  )
}

