import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('🔄 Auth callback started')
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const token = requestUrl.searchParams.get('token')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'
    
    console.log('📋 Callback params:', { code: !!code, token: !!token, next })

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    if (code) {
      // Handle auth code (normal OAuth flow)
      console.log('🔑 Exchanging auth code for session')
      await supabase.auth.exchangeCodeForSession(code)
      console.log('✅ Auth code exchanged successfully')
    } else if (token) {
      // Handle magic link token (OTP flow)
      console.log('🪄 Received magic link token, session should be automatically set')
    } else {
      console.log('⚠️ No code or token found in callback')
    }
    
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

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  } catch (error) {
    console.error('💥 Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }
} 