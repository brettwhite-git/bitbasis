import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Auth callback started')
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    // Support both 'next' and 'redirectTo' for compatibility
    const next = requestUrl.searchParams.get('next') ?? requestUrl.searchParams.get('redirectTo') ?? '/dashboard'

    console.log('📋 Callback params:', { code: !!code, token: !!token, next })

    // Create a response object to capture cookies
    const response = NextResponse.next()

    // Create Supabase client with response-based cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            console.log(`🍪 Setting ${cookiesToSet.length} cookies`)
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`  - Cookie: ${name} (${value.substring(0, 20)}...)`)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    if (code) {
      // Handle auth code (OAuth flow OR magic link - Supabase uses code for both)
      console.log('🔑 Exchanging auth code for session')
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        console.error('❌ Auth code exchange failed:', exchangeError)
        throw exchangeError
      }
      console.log('✅ Auth code exchanged successfully')
    } else if (token) {
      // Handle legacy token format (older Supabase versions or passwordless)
      console.log('🪄 Verifying magic link token')
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })
      if (verifyError) {
        console.error('❌ Magic link verification failed:', verifyError)
        throw verifyError
      }
      console.log('✅ Magic link verified successfully')
    } else {
      console.log('⚠️ No code or token found in callback')
      console.log('📋 Full URL:', requestUrl.toString())
      return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin))
    }
    
    // Wait a moment for session to be fully established
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Get the authenticated user
    console.log('👤 Getting authenticated user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error getting user:', userError)
    }
    
    if (user && !userError) {
      console.log('✅ User authenticated in callback:', user.id, user.email)
      
      // Check if this is a new user and track terms acceptance
      try {
        console.log('🔍 Checking for existing terms acceptance...')
        const { data: existingTermsAcceptance, error: termsCheckError } = await supabase
          .from('terms_acceptance')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        
        console.log('📊 Terms check result:', { 
          found: !!existingTermsAcceptance, 
          error: termsCheckError?.code,
          errorMessage: termsCheckError?.message 
        })
        
        // If no existing terms acceptance record (or error means no record), this is a new user
        if (termsCheckError?.code === 'PGRST116' || !existingTermsAcceptance) {
          console.log('🆕 New user detected in callback, tracking terms acceptance')
          
          // Get client info for terms tracking
          const userAgent = request.headers.get('user-agent') || ''
          const forwarded = request.headers.get('x-forwarded-for')
          const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
          
          console.log('📝 Inserting terms acceptance record...')
          const { error: insertError } = await supabase
            .from('terms_acceptance')
            .insert({
              user_id: user.id,
              terms_version: 'v1.0',
              privacy_version: 'v1.0',
              acceptance_method: 'checkbox',
              acceptance_type: 'signup',
              ip_address: ip,
              user_agent: userAgent,
            })
          
          if (insertError) {
            console.error('❌ Failed to track terms acceptance in callback:', insertError)
            // Don't fail the auth flow, just log the error
          } else {
            console.log('✅ Terms acceptance tracked successfully for new user')
          }
        } else {
          console.log('👥 Existing user, terms already accepted')
        }
      } catch (termsError) {
        console.error('❌ Error during terms tracking in callback:', termsError)
        // Don't fail the auth flow
      }
    } else {
      console.log('❌ No user found in callback')
    }
    
    // Log for debugging
    console.log('🚀 Auth callback successful, redirecting to:', next)

    // Verify we have a session before redirecting
    // Get session multiple times to ensure it's persisted in cookies
    let session = null
    let sessionError = null
    for (let i = 0; i < 3; i++) {
      const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession()
      if (currentSession) {
        session = currentSession
        sessionError = null
        break
      }
      if (currentError) {
        sessionError = currentError
      }
      // Small delay before retry
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    if (sessionError || !session) {
      console.error('❌ No session after auth callback, redirecting to sign-in')
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin))
    }

    console.log('✅ Session verified before redirect:', { userId: session.user?.id, email: session.user?.email })

    // SEC-008: Whitelist allowed redirect paths to prevent open redirect attacks
    const ALLOWED_REDIRECTS = [
      '/dashboard',
      '/dashboard/settings',
      '/dashboard/subscription',
      '/dashboard/performance',
      '/dashboard/portfolio',
      '/dashboard/transaction-history',
      '/dashboard/transactions',
      '/dashboard/calculator'
    ]
    
    // Validate redirect path - must be relative, start with /, and be in whitelist
    const isValidRedirect = next.startsWith('/') && 
                           !next.includes('//') && // No protocol-relative URLs
                           !next.includes('..') && // No path traversal
                           ALLOWED_REDIRECTS.includes(next)
    
    const safeRedirectPath = isValidRedirect ? next : '/dashboard'
    const redirectUrl = new URL(safeRedirectPath, requestUrl.origin)
    
    if (!isValidRedirect) {
      console.warn(`⚠️ Invalid redirect path blocked: ${next}, redirecting to /dashboard`)
    }
    
    console.log('📍 Redirecting to:', redirectUrl.toString())

    // Create redirect response and copy cookies from our response object
    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy all cookies from the response (which has auth cookies) to the redirect response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    console.log(`📦 Redirect response has ${redirectResponse.cookies.getAll().length} cookies`)

    return redirectResponse
  } catch (error) {
    console.error('💥 Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
} 