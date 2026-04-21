'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
    >
      <LogOut size={16} />
      Sair
    </button>
  )
}
