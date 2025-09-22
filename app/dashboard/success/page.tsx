'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        console.log('🎉 Checkout success page loaded')
        
        // Retry auth check a few times in case session is still loading
        let retryCount = 0
        const maxRetries = 5
        let user = null
        let authError = null

        while (retryCount < maxRetries && !user) {
          console.log(`Auth attempt ${retryCount + 1}/${maxRetries}`)
          
          const { data: { user: currentUser }, error: currentError } = await supabase.auth.getUser()
          
          if (currentUser) {
            user = currentUser
            break
          }
          
          authError = currentError
          retryCount++
          
          if (retryCount < maxRetries) {
            console.log(`Waiting 1 second before retry...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        if (authError || !user) {
          console.log('❌ User not authenticated after retries, redirecting to login')
          console.log('Auth error:', authError)
          
          // Store a flag in localStorage to help with debugging
          localStorage.setItem('stripe_checkout_completed', 'true')
          
          // Redirect with a more specific message
          router.push('/auth/sign-in?message=Please%20sign%20in%20to%20view%20your%20subscription%20status&checkout=completed')
          return
        }
        
        console.log('✅ User authenticated on success page:', user.id)
        
        // Get URL parameters to check for session info
        const sessionId = searchParams.get('session_id')
        const priceId = searchParams.get('price_id') || searchParams.get('priceId')
        
        console.log('🔍 URL params - session_id:', sessionId, 'price_id:', priceId)
        
        // Check if subscription was created successfully
        console.log('🔍 Checking subscription status...')
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created', { ascending: false })
          .limit(1)
          .single()
        
        if (subscription) {
          console.log('✅ Subscription found:', subscription.status)
        } else {
          console.log('⚠️ No subscription found yet, checking if this was a $0 lifetime payment...')
          
          // Check if this might be a $0 lifetime payment that didn't trigger webhook
          const lifetimePriceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID
          if (sessionId && priceId === lifetimePriceId) {
            console.log('🎯 Detected potential $0 lifetime payment, creating subscription manually...')
            
            try {
              // Create lifetime subscription manually for $0 payments
              const { data: newSubscription, error: createError } = await supabase
                .from('subscriptions')
                .insert({
                  id: `lifetime_${user.id}`,
                  user_id: user.id,
                  status: 'active',
                  metadata: {
                    type: 'lifetime',
                    checkout_session_id: sessionId,
                    amount_paid: 0,
                    promo_applied: true
                  },
                  price_id: priceId,
                  quantity: 1,
                  cancel_at_period_end: false,
                  current_period_start: new Date().toISOString(),
                  current_period_end: new Date('2099-12-31').toISOString(),
                  created: new Date().toISOString(),
                  ended_at: null,
                  cancel_at: null,
                  canceled_at: null,
                  trial_start: null,
                  trial_end: null,
                })
                .select()
                .single()
              
              if (createError) {
                console.error('❌ Error creating manual lifetime subscription:', createError)
                if (createError.code === '23505') {
                  console.log('ℹ️ Lifetime subscription already exists')
                }
              } else {
                console.log('✅ Manually created lifetime subscription:', newSubscription.id)
              }
            } catch (err) {
              console.error('❌ Exception creating manual subscription:', err)
            }
          }
        }
        
        // Wait a moment for any webhooks to process
        setTimeout(() => {
          console.log('⏰ Redirecting to dashboard after success')
          router.push('/dashboard')
        }, 3000) // Increased to 3 seconds to allow webhook processing
        
      } catch (err) {
        console.error('❌ Error handling checkout success:', err)
        setError('Something went wrong. Please check your account or contact support.')
      } finally {
        setLoading(false)
      }
    }

    handleSuccess()
  }, [router, supabase, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-500" />
            <CardTitle>Processing Your Subscription</CardTitle>
            <CardDescription>
              Please wait while we confirm your payment...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Subscription Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          <CardTitle>Subscription Successful!</CardTitle>
          <CardDescription>
            Your payment was processed successfully. Redirecting to your dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
} 