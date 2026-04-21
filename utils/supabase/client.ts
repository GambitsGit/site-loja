import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso em Client Components ('use client').
 * Usa o browser para gerenciar cookies/sessão automaticamente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
