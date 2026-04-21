import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Cria uma resposta base que preserva o request original
  let supabaseResponse = NextResponse.next({ request })

  // Instancia o cliente Supabase lendo/escrevendo cookies no request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão (importante para manter o token fresco)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protege rotas /admin: redireciona para /login se não autenticado
  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redireciona /login para /admin se já estiver autenticado
  if (user && request.nextUrl.pathname === '/login') {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = '/admin'
    return NextResponse.redirect(adminUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
