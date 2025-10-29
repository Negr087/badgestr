import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Capturar cualquier ruta que empiece con /amber-callback
  if (pathname.startsWith('/amber-callback')) {
    // Redirigir a la página de callback sin importar lo que venga después
    const url = request.nextUrl.clone()
    url.pathname = '/amber-callback'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/amber-callback:path*',
}