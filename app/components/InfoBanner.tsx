'use client'

import { Package, Rocket, Palette } from 'lucide-react'

export default function InfoBanner() {
  const infos = [
    {
      icon: Package,
      text: 'Entregamos para todo Brasil!',
      emoji: '🎯',
    },
    {
      icon: Rocket,
      text: 'Compras acima de R$100,00 envio grátis',
      emoji: '🚀',
    },
    {
      icon: Palette,
      text: 'Todos nossos produtos tem variações de cores',
      subtext: 'Solicite a cor na hora do seu atendimento',
      emoji: '🎨',
    },
  ]

  return (
    <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 dark:from-rose-600 dark:via-pink-600 dark:to-rose-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Desktop: 3 colunas */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {infos.map((info, index) => (
            <div key={index} className="flex items-center gap-2 justify-center text-center">
              <span className="text-xl flex-shrink-0">{info.emoji}</span>
              <div className="text-sm font-medium">
                <div>{info.text}</div>
                {info.subtext && (
                  <div className="text-xs opacity-90 mt-0.5">{info.subtext}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Carrossel ou stack */}
        <div className="md:hidden space-y-2">
          {infos.map((info, index) => (
            <div key={index} className="flex items-center gap-2 justify-center text-center">
              <span className="text-lg flex-shrink-0">{info.emoji}</span>
              <div className="text-sm font-medium">
                <div>{info.text}</div>
                {info.subtext && (
                  <div className="text-xs opacity-90">{info.subtext}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
