import Image from 'next/image'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import type { Produto, Story } from '@/types'
import StoreView from './components/StoreView'
import StoriesRow from './components/StoriesRow'

export const dynamic = 'force-dynamic'

const WHATSAPP_NUMBER = '5541992533439'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: produtos, error }, { data: stories }] = await Promise.all([
    supabase
      .from('produtos')
      .select('*, produto_imagens(id, url, ordem), produto_variacoes(id, produto_id, nome, imagem_url, ordem, created_at)')
      .eq('ativo', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('stories')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true }),
  ])

  if (error) {
    console.error('Supabase error:', error.message)
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header — clean, logo only ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Glow Maker 3D"
            width={130}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>
      </header>

      {/* ── Bio / perfil ── */}
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
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">glowmaker3d</p>
            <p className="text-gray-500 text-xs leading-relaxed mt-0.5">
              ✨ Acessórios de maquiagem em impressão 3D<br />
              🎀 Feitos sob encomenda com amor
            </p>
          </div>
        </div>
        {/* Botão de contato abaixo da bio */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-800 text-sm font-semibold py-2 rounded-xl transition-all"
        >
          <MessageCircle size={15} />
          Contato
        </a>
      </div>

      {/* ── Stories fixados ── */}
      <StoriesRow stories={(stories ?? []) as Story[]} />

      {/* ── StoreView: tabs feed/grade + produtos com variações ── */}
      <StoreView produtos={(produtos ?? []) as Produto[]} />

    </div>
  )
}

