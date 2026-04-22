'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Star, Heart, ShoppingBag } from 'lucide-react'
import type { Story } from '@/types'

const WHATSAPP_NUMBER = '5541992533439'

const TYPE_LABELS: Record<Story['tipo'], string> = {
  produto: '🛍️ Produto',
  depoimento: '💖 Depoimento',
  destaque: '✨ Destaque',
}

// Gradient ring colors per type — matches Instagram stories ring
const RING_CLASSES: Record<Story['tipo'], string> = {
  produto: 'from-rose-400 via-pink-400 to-orange-300',
  depoimento: 'from-purple-400 via-pink-400 to-rose-400',
  destaque: 'from-yellow-400 via-rose-400 to-pink-500',
}

function StoryModal({
  stories,
  startIndex,
  onClose,
}: {
  stories: Story[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 5000 // ms per story

  const story = stories[idx]

  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        if (idx < stories.length - 1) {
          setIdx((i) => i + 1)
        } else {
          onClose()
        }
      }
    }, 50)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  function prev() { if (idx > 0) setIdx(idx - 1) }
  function next() { if (idx < stories.length - 1) setIdx(idx + 1); else onClose() }

  const whatsAppHref = story.produto_id
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Vi o story "${story.titulo}" e quero saber mais!`)}`
    : `https://wa.me/${WHATSAPP_NUMBER}`

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm h-full max-h-[100dvh] overflow-hidden bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-20 px-4 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 bg-rose-100">
              <Image src="/logo.png" alt="Glow Maker 3D" width={32} height={32} className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-none drop-shadow">glowmaker3d</p>
              <p className="text-white/70 text-[10px] drop-shadow">{TYPE_LABELS[story.tipo]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X size={22} />
          </button>
        </div>

        {/* Media */}
        <div className="w-full h-full">
          {story.midia_tipo === 'video' && story.midia_url ? (
            <video
              key={story.midia_url}
              src={story.midia_url}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={story.midia_url ?? story.capa_url}
              alt={story.titulo}
              fill
              className="object-cover"
              sizes="448px"
              priority
            />
          )}
          {/* Overlay gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-8 space-y-3">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{story.titulo}</h3>
            {story.subtitulo && (
              <p className="text-white/80 text-sm mt-1 leading-snug">{story.subtitulo}</p>
            )}
          </div>
          {story.tipo !== 'depoimento' && (
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white hover:bg-rose-50 active:scale-[0.98] text-rose-500 font-bold py-3 rounded-2xl transition-all text-sm"
            >
              <ShoppingBag size={15} />
              Quero saber mais!
            </a>
          )}
          {story.tipo === 'depoimento' && (
            <div className="flex items-center gap-1 justify-center">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={14} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          )}
        </div>

        {/* Tap zones for prev/next */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 w-1/3 h-full z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Story anterior"
        >
          <ChevronLeft size={28} className="text-white drop-shadow" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-0 w-1/3 h-full z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Próximo story"
        >
          <ChevronRight size={28} className="text-white drop-shadow" />
        </button>
      </div>
    </div>
  )
}

export default function StoriesRow({ stories }: { stories: Story[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (stories.length === 0) return null

  return (
    <>
      <div className="max-w-lg mx-auto">
        <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-none border-b border-gray-100">
          {stories.map((story, i) => (
            <button
              key={story.id}
              onClick={() => setOpenIdx(i)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
            >
              {/* Gradient ring */}
              <div className={`w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-br ${RING_CLASSES[story.tipo]}`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-rose-50">
                  <Image
                    src={story.capa_url}
                    alt={story.titulo}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-600 font-medium text-center leading-tight line-clamp-2 w-full">
                {story.titulo}
              </span>
            </button>
          ))}
        </div>
      </div>

      {openIdx !== null && (
        <StoryModal stories={stories} startIndex={openIdx} onClose={() => setOpenIdx(null)} />
      )}
    </>
  )
}
