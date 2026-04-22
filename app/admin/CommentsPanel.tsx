'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, MessageSquare } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type PendingComment = {
  id: string
  nome: string
  texto: string
  created_at: string
  produtos: { titulo: string } | null
}

interface Props {
  pendentes: PendingComment[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function CommentsPanel({ pendentes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, string>>({})

  async function approve(id: string) {
    setLoading(id)
    const supabase = createClient()
    const reply = replies[id]?.trim() || null
    await supabase
      .from('comentarios')
      .update({ aprovado: true, ...(reply && { resposta_admin: reply }) })
      .eq('id', id)
    setLoading(null)
    router.refresh()
  }

  async function reject(id: string) {
    setLoading(id)
    await createClient().from('comentarios').delete().eq('id', id)
    setLoading(null)
    router.refresh()
  }

  if (pendentes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-200">
        <MessageSquare size={36} strokeWidth={1} />
        <p className="mt-2 text-sm text-gray-400">Nenhum comentário aguardando aprovação ✅</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pendentes.map((c) => (
        <div key={c.id} className="border border-rose-100 rounded-2xl p-4 space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-sm text-gray-900">{c.nome}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.created_at)}</span>
            </div>
            {c.produtos && (
              <p className="text-xs text-rose-400 font-medium mt-0.5">em "{c.produtos.titulo}"</p>
            )}
            <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
              {c.texto}
            </p>
          </div>

          <textarea
            placeholder="Resposta da Glow Maker 3D (opcional — publicada junto com o comentário)"
            value={replies[c.id] ?? ''}
            onChange={(e) => setReplies((prev) => ({ ...prev, [c.id]: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-rose-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-rose-200"
          />

          <div className="flex gap-2">
            <button
              onClick={() => approve(c.id)}
              disabled={loading === c.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold disabled:opacity-60 transition-colors"
            >
              <Check size={13} />
              {loading === c.id ? 'Publicando…' : 'Aprovar e publicar'}
            </button>
            <button
              onClick={() => reject(c.id)}
              disabled={loading === c.id}
              className="flex items-center justify-center px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 disabled:opacity-60 transition-colors"
              title="Rejeitar e excluir"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
