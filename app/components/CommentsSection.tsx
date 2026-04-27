'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { Comentario } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function CommentsSection({
  produtoId,
  titulo,
}: {
  produtoId: string
  titulo: string
}) {
  const [count, setCount] = useState(0)
  const [comments, setComments] = useState<Comentario[]>([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient()
      .from('comentarios')
      .select('*', { count: 'exact', head: true })
      .eq('produto_id', produtoId)
      .eq('aprovado', true)
      .then(({ count: c }) => setCount(c ?? 0))
  }, [produtoId])

  async function handleToggle() {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (comments.length === 0 && !loading) {
      setLoading(true)
      const { data } = await createClient()
        .from('comentarios')
        .select('*')
        .eq('produto_id', produtoId)
        .eq('aprovado', true)
        .order('created_at', { ascending: true })
      setComments((data as Comentario[]) ?? [])
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !texto.trim() || submitting) return
    setSubmitting(true)
    await createClient().from('comentarios').insert({
      produto_id: produtoId,
      nome: nome.trim(),
      texto: texto.trim(),
    })
    setSubmitting(false)
    setSent(true)
    setNome('')
    setTexto('')
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <div className="pb-3">
      {/* Toggle */}
      <button
        onClick={handleToggle}
        className="px-4 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors block w-full text-left py-1"
      >
        {count > 0
          ? expanded
            ? `↑ Ocultar comentários`
            : `Ver ${count} comentário${count !== 1 ? 's' : ''}`
          : 'Adicionar comentário ou pergunta…'}
      </button>

      {expanded && (
        <div className="px-4 mt-2 space-y-3">
          {/* List */}
          {loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Carregando…</p>
          )}
          {comments.map((c) => (
            <div key={c.id}>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2.5">
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{c.nome}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.texto}</p>
              </div>
              {c.resposta_admin && (
                <div className="ml-4 mt-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-2xl px-3 py-2">
                  <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 block mb-0.5">
                    ✨ Glow Maker 3D
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.resposta_admin}</p>
                </div>
              )}
            </div>
          ))}

          {/* Success message */}
          {sent && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-2xl px-3 py-2.5 text-sm text-green-700 dark:text-green-400 text-center">
              ✅ Enviado! Seu comentário será publicado em breve.
            </div>
          )}

          {/* Form */}
          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-2 pt-1">
              <input
                ref={nameRef}
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={60}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <div className="flex gap-2">
                <textarea
                  placeholder={`Pergunta ou comentário sobre ${titulo}…`}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={submitting || !nome.trim() || !texto.trim()}
                  className="self-end bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl p-2.5 transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
