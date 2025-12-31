import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Protect dashboard routes - redirect to sign-in if not authenticated
  if (path.startsWith('/dashboard')) {
    try {
      const { supabaseResponse, user } = await updateSession(req)

      // If no user and trying to access dashboard, redirect to sign-in
      if (!user) {
        const signInUrl = new URL('/auth/sign-in', req.url)
        // Preserve the intended destination for redirect after login
        signInUrl.searchParams.set('redirectTo', path)
        return NextResponse.redirect(signInUrl)
      }

      // User exists, continue with the supabaseResponse
      return supabaseResponse
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
    const { supabaseResponse } = await updateSession(req)
    return supabaseResponse
  } catch (error) {
    console.error(`[Middleware] Auth middleware error:`, error)
    return NextResponse.next()
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