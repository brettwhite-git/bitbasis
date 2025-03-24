import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh session if expired - required for Server Components
    const { data: { session }, error } = await supabase.auth.getSession()

    // Handle authentication for protected routes
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard')

    if (isAuthPage && session) {
      // If user is signed in and the current path starts with /auth redirect the user to /dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (isProtectedRoute && !session) {
      // If user is not signed in and the current path starts with /dashboard redirect the user to /auth/sign-in
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }

    return res
  } catch (e) {
    console.error('Middleware error:', e)
    // On error, redirect to sign-in page
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/sign-in', req.url))
    }
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
} 