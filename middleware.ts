import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const path = req.nextUrl.pathname
  
  // Protect dashboard routes - redirect to sign-in if not authenticated
  if (path.startsWith('/dashboard')) {
    try {
      const supabase = createMiddlewareClient<Database>({ req, res })
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // If no session and trying to access dashboard, redirect to sign-in
      if (!session || error) {
        const signInUrl = new URL('/auth/sign-in', req.url)
        // Preserve the intended destination for redirect after login
        signInUrl.searchParams.set('redirectTo', path)
        return NextResponse.redirect(signInUrl)
      }
      
      // Session exists, refresh it and continue
      return res
    } catch (error) {
      console.error(`[Middleware] Auth middleware error for ${path}:`, error)
      // On error, redirect to sign-in
      const signInUrl = new URL('/auth/sign-in', req.url)
      signInUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(signInUrl)
    }
  }
  
  // For non-dashboard routes, just refresh session if it exists
  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    await supabase.auth.getSession()
    return res
  } catch (error) {
    console.error(`[Middleware] Auth middleware error:`, error)
    return res
  }
}

// Specify which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth (auth pages)
     * - account-deleted (public success page)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth|account-deleted).*)',
  ],
} 