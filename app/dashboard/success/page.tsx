'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // useSearchParams not used
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // const searchParams = useSearchParams()
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
          console.log('⚠️ No subscription found yet, but user is authenticated')
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
  }, [router, supabase])

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