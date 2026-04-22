'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Pencil, Power, X, Save, ImagePlus, Trash2, Palette } from 'lucide-react'
import type { ProdutoImagem, ProdutoVariacao } from '@/types'

const STORAGE_BUCKET = 'produtos-3d'

interface Props {
  id: string
  titulo: string
  descricao: string | null
  preco: number
  ativo: boolean
  imagens: ProdutoImagem[]
  variacoes: ProdutoVariacao[]
}

export default function ProductActions({
  id, titulo, descricao, preco, ativo, imagens, variacoes: initialVarList,
}: Props) {
  const router = useRouter()
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [tab, setTab] = useState<'dados' | 'fotos' | 'cores'>('dados')

  // Edit form state
  const [editTitulo, setEditTitulo] = useState(titulo)
  const [editDescricao, setEditDescricao] = useState(descricao ?? '')
  const [editPreco, setEditPreco] = useState(String(preco).replace('.', ','))
  const [loadingSave, setLoadingSave] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Images state
  const [localImagens, setLocalImagens] = useState<ProdutoImagem[]>(
    [...imagens].sort((a, b) => a.ordem - b.ordem)
  )
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Variations state
  const [localVarList, setLocalVarList] = useState<ProdutoVariacao[]>(
    [...initialVarList].sort((a, b) => a.ordem - b.ordem)
  )
  const [removingVarId, setRemovingVarId] = useState<string | null>(null)
  const [novaVarNome, setNovaVarNome] = useState('')
  const [novaVarFile, setNovaVarFile] = useState<File | null>(null)
  const [novaVarPreview, setNovaVarPreview] = useState<string | null>(null)
  const [savingVar, setSavingVar] = useState(false)
  const [varError, setVarError] = useState<string | null>(null)

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
    if (error) { setEditError('Erro ao salvar: ' + error.message); return }
    setEditOpen(false)
    router.refresh()
  }

  async function handleRemoveImage(img: ProdutoImagem) {
    setRemovingId(img.id)
    const supabase = createClient()
    const marker = `/${STORAGE_BUCKET}/`
    const storagePath = img.url.includes(marker) ? img.url.split(marker)[1].split('?')[0] : null
    await supabase.from('produto_imagens').delete().eq('id', img.id)
    if (storagePath) await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    setLocalImagens((prev) =>
      prev.filter((i) => i.id !== img.id).map((i, idx) => ({ ...i, ordem: idx }))
    )
    setRemovingId(null)
    router.refresh()
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return
    const slots = 6 - localImagens.length
    if (slots <= 0) { setPhotoError('Limite de 6 fotos atingido.'); return }
    const toUpload = selected.slice(0, slots)
    setUploadingPhotos(true)
    setPhotoError(null)
    const supabase = createClient()
    const novasImagens: ProdutoImagem[] = []
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i]
        const ext = file.name.split('.').pop()
        const ordem = localImagens.length + i
        const fileName = `${id}/${ordem}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
        const { data: inserted, error: insertError } = await supabase
          .from('produto_imagens').insert({ produto_id: id, url: pub.publicUrl, ordem }).select().single()
        if (insertError || !inserted) throw new Error('Erro ao registrar imagem.')
        novasImagens.push(inserted as ProdutoImagem)
      }
      setLocalImagens((prev) => [...prev, ...novasImagens])
      router.refresh()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setUploadingPhotos(false)
    }
  }

  async function handleRemoveVariacao(v: ProdutoVariacao) {
    setRemovingVarId(v.id)
    const supabase = createClient()
    const marker = `/${STORAGE_BUCKET}/`
    const storagePath = v.imagem_url.includes(marker) ? v.imagem_url.split(marker)[1].split('?')[0] : null
    await supabase.from('produto_variacoes').delete().eq('id', v.id)
    if (storagePath) await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    setLocalVarList((prev) => prev.filter((i) => i.id !== v.id).map((i, idx) => ({ ...i, ordem: idx })))
    setRemovingVarId(null)
    router.refresh()
  }

  async function handleAddVariacao() {
    if (!novaVarNome.trim() || !novaVarFile) {
      setVarError('Informe o nome e selecione uma imagem.')
      return
    }
    setSavingVar(true)
    setVarError(null)
    const supabase = createClient()
    try {
      const ext = novaVarFile.name.split('.').pop()
      const ordem = localVarList.length
      const fileName = `variacoes/${id}/${ordem}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET).upload(fileName, novaVarFile, { cacheControl: '3600', upsert: false })
      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
      const { data: inserted, error: insertError } = await supabase
        .from('produto_variacoes')
        .insert({ produto_id: id, nome: novaVarNome.trim(), imagem_url: pub.publicUrl, ordem })
        .select().single()
      if (insertError || !inserted) throw new Error('Erro ao registrar variação.')
      setLocalVarList((prev) => [...prev, inserted as ProdutoVariacao])
      setNovaVarNome('')
      setNovaVarFile(null)
      setNovaVarPreview(null)
      router.refresh()
    } catch (err) {
      setVarError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSavingVar(false)
    }
  }

  function handleVarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    setNovaVarFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setNovaVarPreview(url)
    } else {
      setNovaVarPreview(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setEditOpen(true)}
          title="Editar produto"
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={handleToggle}
          disabled={loadingToggle}
          title={ativo ? 'Desativar produto' : 'Ativar produto'}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60 ${
            ativo ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Power size={12} />
          {ativo ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false) }}
        >
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Editar Produto</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-300 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex gap-1 bg-rose-50 rounded-xl p-1 mb-5">
              {(['dados', 'fotos', 'cores'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors capitalize ${
                    tab === t ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'dados' && 'Dados'}
                  {t === 'fotos' && `Fotos (${localImagens.length}/6)`}
                  {t === 'cores' && `Cores (${localVarList.length})`}
                </button>
              ))}
            </div>

            {/* ── Aba Dados ── */}
            {tab === 'dados' && (
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
                <div className="flex gap-3 pt-2">
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
            )}

            {/* ── Aba Fotos ── */}
            {tab === 'fotos' && (
              <div className="space-y-4">
                {localImagens.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-4">Nenhuma foto ainda.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {localImagens.map((img, idx) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-rose-50">
                        <Image src={img.url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="120px" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-rose-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            Capa
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveImage(img)}
                          disabled={removingId === img.id}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-60"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {localImagens.length < 6 && (
                  <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-rose-200 rounded-xl py-3 text-sm text-rose-400 font-semibold cursor-pointer hover:bg-rose-50 transition-colors ${uploadingPhotos ? 'opacity-60 pointer-events-none' : ''}`}>
                    <ImagePlus size={16} />
                    {uploadingPhotos ? 'Enviando...' : `Adicionar fotos (${6 - localImagens.length} restante${6 - localImagens.length !== 1 ? 's' : ''})`}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                  </label>
                )}
                {photoError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{photoError}</p>
                )}
                <p className="text-xs text-gray-400 text-center">A primeira foto é a capa. Máximo 6 imagens.</p>
              </div>
            )}

            {/* ── Aba Cores / Variações ── */}
            {tab === 'cores' && (
              <div className="space-y-4">
                {localVarList.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-4">Nenhuma cor cadastrada.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {localVarList.map((v) => (
                      <div key={v.id} className="relative group flex flex-col items-center gap-1">
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-rose-50">
                          <Image src={v.imagem_url} alt={v.nome} fill className="object-cover" sizes="120px" />
                          <button
                            onClick={() => handleRemoveVariacao(v)}
                            disabled={removingVarId === v.id}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-60"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <span className="text-[11px] text-gray-600 font-medium text-center truncate w-full">
                          {v.nome}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar nova cor */}
                <div className="border border-rose-100 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Palette size={13} /> Nova cor / variação
                  </p>
                  <input
                    type="text"
                    placeholder="Nome da cor (ex: Rosa, Branco)"
                    value={novaVarNome}
                    onChange={(e) => setNovaVarNome(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-rose-200 rounded-xl py-2 text-xs text-rose-400 font-semibold cursor-pointer hover:bg-rose-50 transition-colors">
                      <ImagePlus size={14} />
                      {novaVarFile ? novaVarFile.name.slice(0, 16) + '…' : 'Selecionar imagem'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleVarFileChange} />
                    </label>
                    {novaVarPreview && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-rose-100">
                        <Image src={novaVarPreview} alt="preview" fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                  </div>
                  {varError && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{varError}</p>
                  )}
                  <button
                    onClick={handleAddVariacao}
                    disabled={savingVar || !novaVarNome.trim() || !novaVarFile}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-400 hover:bg-rose-500 text-white text-sm font-bold transition-colors disabled:opacity-60"
                  >
                    <Palette size={14} />
                    {savingVar ? 'Adicionando...' : 'Adicionar cor'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}


  // Edit form state
  const [editTitulo, setEditTitulo] = useState(titulo)
  const [editDescricao, setEditDescricao] = useState(descricao ?? '')
  const [editPreco, setEditPreco] = useState(String(preco).replace('.', ','))
  const [loadingSave, setLoadingSave] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Images state (local copy so UI updates instantly)
  const [localImagens, setLocalImagens] = useState<ProdutoImagem[]>(
    [...imagens].sort((a, b) => a.ordem - b.ordem)
  )
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

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

  async function handleRemoveImage(img: ProdutoImagem) {
    setRemovingId(img.id)
    const supabase = createClient()

    // Extract storage path from URL (everything after /produtos-3d/)
    const marker = `/${STORAGE_BUCKET}/`
    const storagePath = img.url.includes(marker)
      ? img.url.split(marker)[1].split('?')[0]
      : null

    await supabase.from('produto_imagens').delete().eq('id', img.id)
    if (storagePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    }

    // Reorder remaining
    setLocalImagens((prev) => {
      const remaining = prev.filter((i) => i.id !== img.id)
        .map((i, idx) => ({ ...i, ordem: idx }))
      return remaining
    })
    setRemovingId(null)
    router.refresh()
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return
    const slots = 6 - localImagens.length
    if (slots <= 0) {
      setPhotoError('Limite de 6 fotos atingido.')
      return
    }
    const toUpload = selected.slice(0, slots)
    setUploadingPhotos(true)
    setPhotoError(null)
    const supabase = createClient()
    const novasImagens: ProdutoImagem[] = []

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i]
        const ext = file.name.split('.').pop()
        const ordem = localImagens.length + i
        const fileName = `${id}/${ordem}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)

        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)

        const { data: inserted, error: insertError } = await supabase
          .from('produto_imagens')
          .insert({ produto_id: id, url: pub.publicUrl, ordem })
          .select()
          .single()

        if (insertError || !inserted) throw new Error('Erro ao registrar imagem.')
        novasImagens.push(inserted as ProdutoImagem)
      }
      setLocalImagens((prev) => [...prev, ...novasImagens])
      router.refresh()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setUploadingPhotos(false)
    }
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Editar Produto</h3>
              <button onClick={() => setEditOpen(false)} className="text-gray-300 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* Abas */}
            <div className="flex gap-1 bg-rose-50 rounded-xl p-1 mb-5">
              <button
                onClick={() => setTab('dados')}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors ${tab === 'dados' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Dados
              </button>
              <button
                onClick={() => setTab('fotos')}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors ${tab === 'fotos' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Fotos ({localImagens.length}/6)
              </button>
            </div>

            {/* Aba Dados */}
            {tab === 'dados' && (
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

                <div className="flex gap-3 pt-2">
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
            )}

            {/* Aba Fotos */}
            {tab === 'fotos' && (
              <div className="space-y-4">
                {localImagens.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-4">Nenhuma foto ainda.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {localImagens.map((img, idx) => (
                      <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-rose-50">
                        <Image src={img.url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="120px" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-rose-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Capa</span>
                        )}
                        <button
                          onClick={() => handleRemoveImage(img)}
                          disabled={removingId === img.id}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-60"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {localImagens.length < 6 && (
                  <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-rose-200 rounded-xl py-3 text-sm text-rose-400 font-semibold cursor-pointer hover:bg-rose-50 transition-colors ${uploadingPhotos ? 'opacity-60 pointer-events-none' : ''}`}>
                    <ImagePlus size={16} />
                    {uploadingPhotos ? 'Enviando...' : `Adicionar fotos (${6 - localImagens.length} restante${6 - localImagens.length !== 1 ? 's' : ''})`}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddPhotos}
                    />
                  </label>
                )}

                {photoError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{photoError}</p>
                )}

                <p className="text-xs text-gray-400 text-center">
                  A primeira foto é a capa. Máximo 6 imagens.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
