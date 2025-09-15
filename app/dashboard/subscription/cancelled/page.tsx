'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, /* CardContent, */ CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
export default function SubscriptionCancelledPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const subscriptionType = searchParams.get('type') || 'subscription'

  useEffect(() => {
    const handleCancellation = async () => {
      console.log('🚫 Subscription cancelled page loaded')
      
      setLoading(false)
      
      // Wait longer for webhooks to process, then redirect with refresh flag
      setTimeout(() => {
        console.log('⏰ Redirecting to dashboard after cancellation')
        // Add timestamp to force a fresh page load and clear any cached data
        router.push('/dashboard?refresh=' + Date.now())
      }, 5000) // Increased to 5 seconds to ensure webhook processing
    }

    handleCancellation()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-500" />
            <CardTitle>Processing Cancellation</CardTitle>
            <CardDescription>
              Please wait while we update your subscription status...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          <CardTitle>Subscription Cancelled!</CardTitle>
          <CardDescription>
            Your {subscriptionType === 'lifetime' ? 'lifetime' : 'Pro'} subscription has been cancelled successfully. Redirecting to your dashboard...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
} 