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
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-200">
        <Package size={48} strokeWidth={1} />
      </div>
    )
  }

  const prev = () => setIdx((i) => (i - 1 + imagens.length) % imagens.length)
  const next = () => setIdx((i) => (i + 1) % imagens.length)

  return (
    <div className="relative h-full w-full">
      <Image
        src={imagens[idx]}
        alt={`${titulo} — foto ${idx + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 512px"
      />

      {imagens.length > 1 && (
        <>
          {/* Setas sempre visíveis no mobile */}
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            aria-label="Próxima foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots estilo Instagram — no topo */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imagens.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Foto ${i + 1}`}
                className={`rounded-full transition-all ${
                  i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
