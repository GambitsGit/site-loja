'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { PlusCircle, Upload, X, ImagePlus } from 'lucide-react'

const STORAGE_BUCKET = 'produtos-3d'

export default function ProductForm() {
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const novos = selected.slice(0, 6 - files.length) // max 6 fotos
    setFiles((prev) => [...prev, ...novos])
    setPreviews((prev) => [...prev, ...novos.map((f) => URL.createObjectURL(f))])
    e.target.value = '' // permite re-selecionar o mesmo arquivo
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      const precoNumerico = parseFloat(preco.replace(',', '.'))
      if (isNaN(precoNumerico) || precoNumerico <= 0) {
        throw new Error('Informe um preço válido (ex: 29,90).')
      }

      // 1. Inserir produto (sem imagem_url — usamos produto_imagens)
      const { data: produtoInserido, error: insertError } = await supabase
        .from('produtos')
        .insert({
          titulo,
          descricao: descricao.trim() || null,
          preco: precoNumerico,
          object_fit: objectFit,
        })
        .select('id')
        .single()

      if (insertError || !produtoInserido) {
        throw new Error(`Erro ao salvar o produto: ${insertError?.message}`)
      }

      // 2. Upload de cada imagem e INSERT em produto_imagens
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()
        const fileName = `${produtoInserido.id}/${i}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`Erro no upload da foto ${i + 1}: ${uploadError.message}`)

        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)

        await supabase.from('produto_imagens').insert({
          produto_id: produtoInserido.id,
          url: pub.publicUrl,
          ordem: i,
        })
      }

      // 3. Limpar e atualizar
      setTitulo('')
      setDescricao('')
      setPreco('')
      setObjectFit('contain')
      previews.forEach((p) => URL.revokeObjectURL(p))
      setFiles([])
      setPreviews([])
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
        <PlusCircle size={20} className="text-rose-400" />
        Novo Produto
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Título <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Porta-batom giratório"
            className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Descreva materiais, dimensões, diferenciais..."
            className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent resize-none"
          />
        </div>

        {/* Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Preço (R$) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="29,90"
            className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
          />
        </div>

        {/* Ajuste de Imagem */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Como exibir a imagem?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setObjectFit('contain')}
              className={`relative p-4 border-2 rounded-xl transition-all ${
                objectFit === 'contain'
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                <div className="w-2/3 h-2/3 bg-rose-400 rounded" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Ajustar</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Mostra a imagem inteira sem cortar
              </p>
              {objectFit === 'contain' && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-rose-400 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setObjectFit('cover')}
              className={`relative p-4 border-2 rounded-xl transition-all ${
                objectFit === 'cover'
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <div className="w-full h-full bg-rose-400 scale-150" />
              </div>
              <p className="text-xs font-semibold text-gray-700">Preencher</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Preenche o espaço (pode cortar)
              </p>
              {objectFit === 'cover' && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-rose-400 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Upload de Fotos */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Fotos do Produto{' '}
            <span className="text-gray-400 font-normal">({files.length}/6)</span>
          </label>

          {/* Grid de previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-white/90 hover:bg-white text-rose-500
                               rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    aria-label="Remover foto"
                  >
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-xs bg-rose-400 text-white px-1.5 py-0.5 rounded-md leading-none">
                      Capa
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Botão adicionar */}
          {files.length < 6 && (
            <label className="flex items-center justify-center gap-2 w-full py-3
                               border-2 border-dashed border-rose-200 rounded-xl cursor-pointer
                               hover:border-rose-400 hover:bg-rose-50 transition-colors text-rose-400 text-sm">
              <ImagePlus size={18} />
              {files.length === 0 ? 'Adicionar fotos' : 'Adicionar mais fotos'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={handleFilesChange}
              />
            </label>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Primeira foto será a capa. Máximo 6 imagens.
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm bg-green-50 rounded-xl px-3 py-2">
            ✓ Produto cadastrado com sucesso!
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2
                     bg-rose-400 hover:bg-rose-500 disabled:opacity-60
                     text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          {loading ? 'Salvando...' : 'Cadastrar Produto'}
        </button>
      </form>
    </div>
  )
}
