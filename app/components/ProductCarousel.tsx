'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'

interface Props {
  imagens: string[]
  titulo: string
}

export default function ProductCarousel({ imagens, titulo }: Props) {
  const [idx, setIdx] = useState(0)

  if (imagens.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-rose-50 text-rose-200">
        <Package size={48} strokeWidth={1} />
      </div>
    )
  }

  const prev = () => setIdx((i) => (i - 1 + imagens.length) % imagens.length)
  const next = () => setIdx((i) => (i + 1) % imagens.length)

  return (
    <div className="relative h-full group">
      <Image
        src={imagens[idx]}
        alt={`${titulo} — foto ${idx + 1}`}
        fill
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {imagens.length > 1 && (
        <>
          {/* Setas */}
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2
                       bg-white/80 hover:bg-white text-rose-500 rounded-full p-1
                       opacity-0 group-hover:opacity-100 transition-opacity shadow"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2
                       bg-white/80 hover:bg-white text-rose-500 rounded-full p-1
                       opacity-0 group-hover:opacity-100 transition-opacity shadow"
          >
            <ChevronRight size={18} />
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagens.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir para foto ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === idx ? 'bg-rose-400' : 'bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
