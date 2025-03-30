import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // const path = req.nextUrl.pathname // Remove log
  // console.log(`[Middleware] Running for path: ${path}`) // Remove log
  
  try {
    // console.log(`[Middleware] Creating Supabase client for path: ${path}`) // Remove log
    const supabase = createMiddlewareClient<Database>({ req, res })

    // console.log(`[Middleware] Attempting to get/refresh session for path: ${path}`) // Remove log
    // Refresh session if expired - will throw if refresh token is invalid
    // Revert to original simpler call if detailed logging isn't needed
    await supabase.auth.getSession()
    /* // Remove detailed session logging
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error(`[Middleware] Error getting session for path ${path}:`, error)
    } else {
      // console.log(`[Middleware] Session found/refreshed successfully for path: ${path}, User ID: ${session?.user?.id ?? 'None'}`) 
    }
    */

    return res
  } catch (error) {
    console.error(`[Middleware] Auth middleware error:`, error) // Keep generic error log
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