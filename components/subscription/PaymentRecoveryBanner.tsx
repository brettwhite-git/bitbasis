"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CreditCard, RefreshCw, X } from "lucide-react"
import { useSubscription } from "@/lib/hooks"

export function PaymentRecoveryBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { subscriptionInfo } = useSubscription()

  if (!subscriptionInfo || dismissed) return null

  const isPastDue = subscriptionInfo.subscription_status === 'past_due'
  const subscriptionData = subscriptionInfo.subscription_data

  if (!isPastDue || !subscriptionData) return null

  // Type assertion for subscription data fields
  const subscriptionDataWithDates = subscriptionData as typeof subscriptionData & {
    period_end_date?: string;
    id?: string;
  }
  
  const periodEndDate = subscriptionDataWithDates.period_end_date 
    ? new Date(subscriptionDataWithDates.period_end_date)
    : null

  const daysLeft = periodEndDate 
    ? Math.ceil((periodEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const handleUpdatePayment = async () => {
    try {
      // Redirect to Stripe customer portal to update payment method
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
    }
  }

  const handleRetryPayment = async () => {
    try {
      // Trigger a retry of the latest invoice
      const response = await fetch('/api/subscription/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscriptionDataWithDates.id,
        }),
      })

      if (response.ok) {
        // Refresh the page or show success message
        window.location.reload()
      } else {
        const error = await response.json()
        console.error('Payment retry failed:', error)
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
    }
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertDescription className="text-orange-800">
            <div className="font-medium mb-2">Payment Failed - Action Required</div>
            <p className="text-sm mb-3">
              Your last payment couldn&#39;t be processed. You have {daysLeft > 0 ? `${daysLeft} days` : 'limited time'} 
              {' '}left to update your payment method before losing access to Pro features.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                onClick={handleUpdatePayment}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment Method
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetryPayment}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payment
              </Button>
            </div>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
} 