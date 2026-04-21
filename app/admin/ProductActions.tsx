'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Pencil, Power, X, Save } from 'lucide-react'

interface Props {
  id: string
  titulo: string
  descricao: string | null
  preco: number
  ativo: boolean
}

export default function ProductActions({ id, titulo, descricao, preco, ativo }: Props) {
  const router = useRouter()
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Edit form state
  const [editTitulo, setEditTitulo] = useState(titulo)
  const [editDescricao, setEditDescricao] = useState(descricao ?? '')
  const [editPreco, setEditPreco] = useState(String(preco).replace('.', ','))
  const [loadingSave, setLoadingSave] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  async function handleToggle() {
    setLoadingToggle(true)
    const supabase = createClient()
    await supabase.from('produtos').update({ ativo: !ativo }).eq('id', id)
    setLoadingToggle(false)
    router.refresh()
  }

  async function handleSave() {
    setLoadingSave(true)
    setEditError(null)
    const precoNum = parseFloat(editPreco.replace(',', '.'))
    if (isNaN(precoNum) || precoNum <= 0) {
      setEditError('Preço inválido.')
      setLoadingSave(false)
      return
    }
    const supabase = createClient()
    const { error } = await supabase
      .from('produtos')
      .update({ titulo: editTitulo.trim(), descricao: editDescricao.trim() || null, preco: precoNum })
      .eq('id', id)
    setLoadingSave(false)
    if (error) {
      setEditError('Erro ao salvar: ' + error.message)
      return
    }
    setEditOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Botão Editar */}
        <button
          onClick={() => setEditOpen(true)}
          title="Editar produto"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>

        {/* Botão Ativar/Desativar */}
        <button
          onClick={handleToggle}
          disabled={loadingToggle}
          title={ativo ? 'Desativar produto' : 'Ativar produto'}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
            ativo
              ? 'border-green-200 text-green-600 hover:bg-green-50'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Power size={12} />
          {ativo ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      {/* Modal de edição */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false) }}
        >
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Editar Produto</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-300 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Título <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
                <textarea
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Preço (R$) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPreco}
                  onChange={(e) => setEditPreco(e.target.value)}
                  placeholder="29,90"
                  className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>

              {editError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{editError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-rose-100 text-sm text-gray-500 hover:bg-rose-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loadingSave || !editTitulo.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-400 hover:bg-rose-500 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                <Save size={15} />
                {loadingSave ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
