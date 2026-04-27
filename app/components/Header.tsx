'use client'

import Image from 'next/image'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function Header() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex-1" /> {/* Spacer for centering */}
        
        <Image
          src="/logo.png"
          alt="Glow Maker 3D"
          width={130}
          height={44}
          className="h-9 w-auto object-contain"
          priority
        />
        
        <div className="flex-1 flex justify-end">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
