'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function CheckoutCancelPage() {
  const [reason, setReason] = useState<string>('cancelled')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Determine cancellation reason from URL params
    const sessionId = searchParams.get('session_id')
    const error = searchParams.get('error')
    const errorType = searchParams.get('error_type')

    if (error === 'payment_failed') {
      setReason('payment_failed')
    } else if (errorType === 'card_declined') {
      setReason('card_declined')
    } else if (sessionId) {
      setReason('session_expired')
    } else {
      setReason('cancelled')
    }
  }, [searchParams])

  const getContent = () => {
    switch (reason) {
      case 'payment_failed':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Payment Failed',
          description: 'Your payment could not be processed. This might be due to insufficient funds, an expired card, or a temporary issue with your payment method.',
          actionText: 'Try Again',
          secondaryText: 'Update Payment Method'
        }
      
      case 'card_declined':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Card Declined',
          description: 'Your card was declined by your bank. Please check your card details or try a different payment method.',
          actionText: 'Try Different Card',
          secondaryText: 'Contact Your Bank'
        }
      
      case 'session_expired':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-orange-500" />,
          title: 'Session Expired',
          description: 'Your checkout session has expired. This happens if the payment page is left open for too long.',
          actionText: 'Start New Checkout',
          secondaryText: 'Back to Dashboard'
        }
      
      default: // cancelled
        return {
          icon: <ArrowLeft className="h-12 w-12 text-gray-500" />,
          title: 'Checkout Cancelled',
          description: 'You cancelled the checkout process. No payment was charged to your account.',
          actionText: 'Try Again',
          secondaryText: 'Back to Dashboard'
        }
    }
  }

  const content = getContent()

  const handleRetry = () => {
    // Redirect back to upgrade flow
    router.push('/dashboard?upgrade=true')
  }

  const handleSecondaryAction = () => {
    if (reason === 'card_declined') {
      // Could open a help article or contact form
      window.open('mailto:support@bitbasis.com?subject=Card Declined Issue', '_blank')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {content.icon}
          <CardTitle className="mt-4">{content.title}</CardTitle>
          <CardDescription className="mt-2">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {content.actionText}
          </Button>
          
          <Button 
            onClick={handleSecondaryAction}
            className="w-full"
            variant="outline"
          >
            {content.secondaryText}
          </Button>

          {/* Help Section */}
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Need help? <a href="mailto:support@bitbasis.com" className="text-primary hover:underline">Contact Support</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 