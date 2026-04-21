'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-rose-50/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo.png"
              alt="Glow Maker 3D"
              width={160}
              height={64}
              className="h-16 w-auto object-contain mx-auto mb-2"
              priority
            />
            <p className="text-rose-300 text-sm">Acesso ao painel administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent
                           transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-rose-100 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent
                           transition-shadow"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2
                         bg-rose-400 hover:bg-rose-500 disabled:opacity-60
                         text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Área restrita — somente administradores autorizados.
        </p>
      </div>
    </div>
  )
}
