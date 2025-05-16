import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    if (code) {
      // Handle auth code (normal OAuth flow)
      await supabase.auth.exchangeCodeForSession(code)
      console.log('Auth code exchanged successfully')
    } else if (token) {
      // Handle magic link token (OTP flow)
      console.log('Received magic link token, session should be automatically set')
    }
    
    // Log for debugging
    console.log('Auth callback successful, redirecting to:', next)

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
} 