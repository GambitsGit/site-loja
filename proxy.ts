import { NextResponse, type NextRequest } from 'next/server'

async function handler(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se existe algum cookie de sessão do Supabase
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  // Protege /admin — redireciona para /login se não há sessão
  if (!hasSession && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redireciona /login para /admin se já autenticado
  if (hasSession && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Next.js 16 usa "proxy", versões anteriores usam "middleware"
export { handler as proxy, handler as middleware }

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
