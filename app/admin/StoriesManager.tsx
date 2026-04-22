'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { ImagePlus, Trash2, Power, Plus } from 'lucide-react'
import type { Story } from '@/types'

const BUCKET = 'produtos-3d'

interface Props {
  stories: Story[]
}

const TIPO_LABELS = {
  destaque: '✨ Destaque',
  produto: '🛍️ Produto',
  depoimento: '💖 Depoimento',
}

export default function StoriesManager({ stories: initialStories }: Props) {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form state
  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [tipo, setTipo] = useState<Story['tipo']>('destaque')
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [capaPreview, setCapaPreview] = useState<string | null>(null)
  const [midiaFile, setMidiaFile] = useState<File | null>(null)
  const [midiaPreview, setMidiaPreview] = useState<string | null>(null)
  const [midiaIsVideo, setMidiaIsVideo] = useState(false)

  function handleCapaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    setCapaFile(f)
    setCapaPreview(f ? URL.createObjectURL(f) : null)
  }

  function handleMidiaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    setMidiaFile(f)
    setMidiaIsVideo(f?.type.startsWith('video/') ?? false)
    setMidiaPreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSave() {
    if (!titulo.trim() || !capaFile) {
      setError('Título e imagem de capa são obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    try {
      const ts = Date.now()
      // Upload capa
      const capaExt = capaFile.name.split('.').pop()
      const capaPath = `stories/capa-${ts}.${capaExt}`
      const { error: capaErr } = await supabase.storage.from(BUCKET).upload(capaPath, capaFile, { upsert: false })
      if (capaErr) throw new Error('Erro no upload da capa: ' + capaErr.message)
      const { data: capaPub } = supabase.storage.from(BUCKET).getPublicUrl(capaPath)

      // Upload mídia (opcional — se não enviada, usa a capa)
      let midiaUrl: string | null = null
      let midiaTipo: Story['midia_tipo'] = 'imagem'
      if (midiaFile) {
        const midiaExt = midiaFile.name.split('.').pop()
        const midiaPath = `stories/midia-${ts}.${midiaExt}`
        const { error: midiaErr } = await supabase.storage.from(BUCKET).upload(midiaPath, midiaFile, { upsert: false })
        if (midiaErr) throw new Error('Erro no upload da mídia: ' + midiaErr.message)
        const { data: midiaPub } = supabase.storage.from(BUCKET).getPublicUrl(midiaPath)
        midiaUrl = midiaPub.publicUrl
        midiaTipo = midiaIsVideo ? 'video' : 'imagem'
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('stories')
        .insert({
          titulo: titulo.trim(),
          subtitulo: subtitulo.trim() || null,
          tipo,
          capa_url: capaPub.publicUrl,
          midia_url: midiaUrl,
          midia_tipo: midiaTipo,
          ordem: stories.length,
        })
        .select()
        .single()
      if (insertErr || !inserted) throw new Error('Erro ao salvar story.')

      setStories((prev) => [...prev, inserted as Story])
      setCreating(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(s: Story) {
    setTogglingId(s.id)
    await createClient().from('stories').update({ ativo: !s.ativo }).eq('id', s.id)
    setStories((prev) => prev.map((x) => x.id === s.id ? { ...x, ativo: !s.ativo } : x))
    setTogglingId(null)
    router.refresh()
  }

  async function handleRemove(s: Story) {
    if (!confirm(`Remover story "${s.titulo}"?`)) return
    setRemovingId(s.id)
    const supabase = createClient()
    const marker = `/${BUCKET}/`
    const paths = [s.capa_url, s.midia_url]
      .filter(Boolean)
      .map((u) => u!.includes(marker) ? u!.split(marker)[1].split('?')[0] : null)
      .filter(Boolean) as string[]
    await supabase.from('stories').delete().eq('id', s.id)
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)
    setStories((prev) => prev.filter((x) => x.id !== s.id))
    setRemovingId(null)
    router.refresh()
  }

  function resetForm() {
    setTitulo(''); setSubtitulo(''); setTipo('destaque')
    setCapaFile(null); setCapaPreview(null)
    setMidiaFile(null); setMidiaPreview(null); setMidiaIsVideo(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Lista de stories existentes */}
      {stories.length === 0 && !creating ? (
        <p className="text-sm text-center text-gray-400 py-4">Nenhum story criado ainda.</p>
      ) : (
        <div className="space-y-2">
          {stories.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${s.ativo ? 'border-rose-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-rose-50">
                <Image src={s.capa_url} alt={s.titulo} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.titulo}</p>
                <p className="text-xs text-gray-400">{TIPO_LABELS[s.tipo]} {s.midia_tipo === 'video' ? '· 🎥 Vídeo' : '· 🖼 Imagem'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(s)}
                  disabled={togglingId === s.id}
                  title={s.ativo ? 'Desativar' : 'Ativar'}
                  className={`p-1.5 rounded-full border text-xs transition-colors disabled:opacity-50 ${s.ativo ? 'border-green-200 text-green-500 hover:bg-green-50' : 'border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                >
                  <Power size={13} />
                </button>
                <button
                  onClick={() => handleRemove(s)}
                  disabled={removingId === s.id}
                  title="Remover story"
                  className="p-1.5 rounded-full border border-red-100 text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de criação */}
      {creating ? (
        <div className="border border-rose-100 rounded-2xl p-4 space-y-3 bg-rose-50/30">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-wide">Novo Story</p>

          {/* Tipo */}
          <div className="flex gap-2">
            {(['destaque', 'produto', 'depoimento'] as Story['tipo'][]).map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  tipo === t ? 'bg-rose-400 text-white border-rose-400' : 'border-rose-200 text-rose-400 hover:bg-rose-50'
                }`}
              >
                {TIPO_LABELS[t]}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Título *"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={60}
            className="w-full px-3 py-2 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <input
            type="text"
            placeholder="Subtítulo / descrição (opcional)"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            maxLength={120}
            className="w-full px-3 py-2 border border-rose-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
          />

          {/* Capa (obrigatória) */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Foto de capa * <span className="text-gray-400">(círculo exibido na fila)</span></p>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-rose-200 rounded-xl py-2 text-xs text-rose-400 font-semibold cursor-pointer hover:bg-rose-50">
                <ImagePlus size={14} />
                {capaFile ? capaFile.name.slice(0, 18) + '…' : 'Selecionar imagem'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCapaChange} />
              </label>
              {capaPreview && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-rose-200 flex-shrink-0">
                  <Image src={capaPreview} alt="capa" fill className="object-cover" sizes="48px" />
                </div>
              )}
            </div>
          </div>

          {/* Mídia do story (opcional) */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Foto ou vídeo do story <span className="text-gray-400">(se vazio, usa a capa)</span></p>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-1.5 border-2 border-dashed border-rose-200 rounded-xl py-2 text-xs text-rose-400 font-semibold cursor-pointer hover:bg-rose-50">
                <ImagePlus size={14} />
                {midiaFile ? midiaFile.name.slice(0, 18) + '…' : 'Imagem ou vídeo'}
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMidiaChange} />
              </label>
              {midiaPreview && !midiaIsVideo && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-rose-100 flex-shrink-0">
                  <Image src={midiaPreview} alt="mídia" fill className="object-cover" sizes="48px" />
                </div>
              )}
              {midiaPreview && midiaIsVideo && (
                <span className="text-xs text-rose-400 font-medium">🎥 Vídeo selecionado</span>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setCreating(false); resetForm() }}
              className="flex-1 py-2 rounded-xl border border-rose-100 text-sm text-gray-500 hover:bg-rose-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !titulo.trim() || !capaFile}
              className="flex-1 py-2 rounded-xl bg-rose-400 hover:bg-rose-500 text-white text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {saving ? 'Salvando…' : 'Publicar Story'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-rose-200 rounded-2xl py-3 text-sm text-rose-400 font-semibold hover:bg-rose-50 transition-colors"
        >
          <Plus size={16} />
          Novo Story
        </button>
      )}
    </div>
  )
}
