'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Package, X, ZoomIn } from 'lucide-react'

interface Props {
  imagens: string[]
  titulo: string
  overrideImage?: string
  priority?: boolean
  objectFit?: 'cover' | 'contain'
}

export default function ProductCarousel({ imagens, titulo, overrideImage, priority, objectFit = 'cover' }: Props) {
  const [idx, setIdx] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  // Reset carousel when a variation is selected/deselected
  useEffect(() => { setIdx(0) }, [overrideImage])

  const currentImage = overrideImage || imagens[idx]

  if (overrideImage) {
    return (
      <>
        <button
          onClick={() => setZoomOpen(true)}
          className="relative h-full w-full group cursor-zoom-in"
          title="Clique para ampliar"
        >
          <Image
            src={overrideImage}
            alt={titulo}
            fill
            className={`object-${objectFit}`}
            sizes="(max-width: 640px) 100vw, 512px"
            loading="eager"
            quality={85}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
        </button>
        {zoomOpen && (
          <ImageZoomModal
            src={overrideImage}
            alt={titulo}
            onClose={() => setZoomOpen(false)}
          />
        )}
      </>
    )
  }

  if (imagens.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 text-gray-200 dark:text-gray-700">
        <Package size={48} strokeWidth={1} />
      </div>
    )
  }

  const prev = () => setIdx((i) => (i - 1 + imagens.length) % imagens.length)
  const next = () => setIdx((i) => (i + 1) % imagens.length)

  return (
    <>
      <div className="relative h-full w-full">
        <button
          onClick={() => setZoomOpen(true)}
          className="relative h-full w-full group cursor-zoom-in"
          title="Clique para ampliar"
        >
          <Image
            src={imagens[idx]}
            alt={`${titulo} — foto ${idx + 1}`}
            fill
            className={`object-${objectFit}`}
            sizes="(max-width: 640px) 100vw, 512px"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            quality={85}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
        </button>

        {/* Preload adjacent images for instant navigation */}
        {priority && (
          <div className="hidden" aria-hidden="true">
            {imagens.slice(0, 3).map((src, i) => (
              i !== idx && (
                <Image
                  key={src}
                  src={src}
                  alt=""
                  width={640}
                  height={640}
                  priority
                />
              )
            ))}
          </div>
        )}

        {imagens.length > 1 && (
          <>
            {/* Setas sempre visíveis no mobile */}
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 active:bg-black/70 text-white rounded-full p-2.5 md:p-2 transition-colors z-20 [touch-action:manipulation]"
            >
              <ChevronLeft size={24} className="md:w-5 md:h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 active:bg-black/70 text-white rounded-full p-2.5 md:p-2 transition-colors z-20 [touch-action:manipulation]"
            >
              <ChevronRight size={24} className="md:w-5 md:h-5" />
            </button>

            {/* Dots estilo Instagram — no topo */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {imagens.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
                  aria-label={`Foto ${i + 1}`}
                  className={`rounded-full transition-all [touch-action:manipulation] ${
                    i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                  } p-1 -m-1`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {zoomOpen && (
        <ImageZoomModal
          src={currentImage}
          alt={titulo}
          allImages={imagens}
          currentIndex={idx}
          onClose={() => setZoomOpen(false)}
          onNavigate={(newIdx) => setIdx(newIdx)}
        />
      )}
    </>
  )
}

function ImageZoomModal({
  src,
  alt,
  allImages,
  currentIndex,
  onClose,
  onNavigate,
}: {
  src: string
  alt: string
  allImages?: string[]
  currentIndex?: number
  onClose: () => void
  onNavigate?: (idx: number) => void
}) {
  const hasMultiple = allImages && allImages.length > 1
  const canPrev = hasMultiple && currentIndex! > 0
  const canNext = hasMultiple && currentIndex! < allImages!.length - 1

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (hasMultiple && e.key === 'ArrowLeft' && canPrev) onNavigate!(currentIndex! - 1)
      if (hasMultiple && e.key === 'ArrowRight' && canNext) onNavigate!(currentIndex! + 1)
    }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose, hasMultiple, canPrev, canNext, onNavigate, currentIndex])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      onTouchEnd={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 text-white/70 hover:text-white active:text-white transition-colors z-50 p-2 [touch-action:manipulation]"
        aria-label="Fechar"
      >
        <X size={32} />
      </button>

      <div
        className="relative w-full h-full max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 1024px"
          quality={100}
        />
      </div>

      {hasMultiple && (
        <>
          {canPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate!(currentIndex! - 1); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate!(currentIndex! - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full p-3 md:p-4 transition-colors z-50 [touch-action:manipulation]"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={28} />
            </button>
          )}
          {canNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate!(currentIndex! + 1); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate!(currentIndex! + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full p-3 md:p-4 transition-colors z-50 [touch-action:manipulation]"
              aria-label="Próxima foto"
            >
              <ChevronRight size={28} />
            </button>
          )}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {currentIndex! + 1} / {allImages!.length}
          </div>
        </>
      )}
    </div>
  )
}
