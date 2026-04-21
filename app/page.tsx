import Image from 'next/image'
import { MessageCircle, Package, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import type { Produto } from '@/types'
import ProductCarousel from './components/ProductCarousel'

const WHATSAPP_NUMBER = '5541992533439'

function getWhatsAppLink(titulo: string, preco: number): string {
  const precoFormatado = preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const mensagem = `Olá! Vi a peça *${titulo}* no site por R$ ${precoFormatado} e tenho interesse!`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`
}

export default async function Home() {
  const supabase = await createClient()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, produto_imagens(id, url, ordem)')
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen flex flex-col bg-rose-50/40">

      {/* ── Header ── */}
      <header className="bg-white border-b border-rose-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Image
            src="/logo.png"
            alt="Glow Maker 3D"
            width={200}
            height={80}
            className="h-14 sm:h-18 w-auto object-contain"
            priority
          />
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all shadow-md shadow-green-200 whitespace-nowrap"
          >
            <MessageCircle size={16} />
            <span>Fale Conosco</span>
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="py-16 sm:py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-500 text-xs font-semibold px-3 py-1 rounded-full mb-5">
            <Sparkles size={12} />
            Feito com amor para você
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5 text-gray-800">
            Acessórios únicos em{' '}
            <span className="text-rose-400">Impressão 3D</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Organizadores de maquiagem, porta-batons, suportes e muito mais —
            peças delicadas feitas sob encomenda só pra você.
          </p>
        </div>
      </section>

      {/* ── Grade de Produtos ── */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-24">
        {!produtos || produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-rose-200">
            <Package size={56} strokeWidth={1} />
            <p className="mt-4 text-base font-medium text-rose-300">
              Em breve, peças lindas esperando por você 🌸
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(produtos as Produto[]).map((produto) => {
              const imagens = (produto.produto_imagens ?? [])
                .sort((a, b) => a.ordem - b.ordem)
                .map((img) => img.url)

              if (imagens.length === 0 && produto.imagem_url) {
                imagens.push(produto.imagem_url)
              }

              return (
                <article
                  key={produto.id}
                  className="bg-white rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden"
                >
                  {/* Carrossel de imagens */}
                  <div className="relative h-60 bg-rose-50">
                    <ProductCarousel imagens={imagens} titulo={produto.titulo} />
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-bold text-gray-800 text-base leading-snug mb-1">
                      {produto.titulo}
                    </h2>
                    {produto.descricao && (
                      <p className="text-gray-400 text-sm leading-relaxed flex-1 line-clamp-3 mb-4">
                        {produto.descricao}
                      </p>
                    )}

                    <div className="mt-auto pt-2">
                      <p className="text-2xl font-extrabold text-rose-500 mb-3">
                        {produto.preco.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                      <a
                        href={getWhatsAppLink(produto.titulo, produto.preco)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full
                                   bg-green-500 hover:bg-green-600 text-white
                                   font-semibold py-3 rounded-2xl transition-colors"
                      >
                        <MessageCircle size={18} />
                        Comprar pelo WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-rose-100 bg-white py-8 text-center text-sm text-rose-300">
        <p>
          © {new Date().getFullYear()} Glow Maker 3D — Feito com 💕 para mulheres incríveis
        </p>
      </footer>
    </main>
  )
}
