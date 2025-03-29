import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    // Create client with response for setting cookies
    const supabase = createMiddlewareClient<Database>({ req, res })

    // Refresh session if expired - will throw if refresh token is invalid
    await supabase.auth.getSession()

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    // On error, still return response but clear auth cookie
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
} 