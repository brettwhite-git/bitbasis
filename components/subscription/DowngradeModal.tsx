"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/providers/supabase-auth-provider"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface DowngradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void // Callback to refresh subscription data
}

export function DowngradeModal({ open, onOpenChange, onSuccess }: DowngradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'warning' | 'confirm' | 'success'>('warning')
  const { subscriptionInfo } = useSubscription()
  const { user } = useAuth()

  const transactionCount = subscriptionInfo?.transaction_count || 0
  const isOverLimit = transactionCount > 50
  
  // Get subscription ID from the subscription service
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  
  // Fetch subscription ID when modal opens
  useEffect(() => {
    if (open && user) {
      const fetchSubscriptionId = async () => {
        try {
          const supabase = createClientComponentClient()
          const { data, error } = await supabase
            .from('subscriptions')
            .select('id, metadata')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .order('created', { ascending: false })
          
          if (data && data.length > 0 && !error) {
            // Prioritize lifetime subscriptions, otherwise take the most recent
            const lifetimeSubscription = data.find(sub => 
              sub.metadata?.type === 'lifetime' || sub.id.startsWith('lifetime_')
            )
            const subscriptionToUse = lifetimeSubscription || data[0]
            
            if (subscriptionToUse) {
              setSubscriptionId(subscriptionToUse.id)
              console.log('Found subscription ID:', subscriptionToUse.id)
            }
          } else {
            console.log('No active subscription found for user')
          }
        } catch (error) {
          console.error('Error fetching subscription ID:', error)
        }
      }
      fetchSubscriptionId()
    }
  }, [open, user])

  const handleCancel = async () => {
    if (!user) {
      console.error('Missing user')
      return
    }
    
    if (!subscriptionId) {
      console.error('Missing subscription ID - subscription may not be loaded yet')
      // Try to fetch it again
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, metadata')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created', { ascending: false })
      
      if (!data || data.length === 0 || error) {
        console.error('Could not find subscription to cancel')
        return
      }
      
      // Prioritize lifetime subscriptions, otherwise take the most recent
      const lifetimeSubscription = data.find(sub => 
        sub.metadata?.type === 'lifetime' || sub.id.startsWith('lifetime_')
      )
      const subscriptionToUse = lifetimeSubscription || data[0]
      
      if (!subscriptionToUse) {
        console.error('Could not determine subscription to cancel')
        return
      }
      
      setSubscriptionId(subscriptionToUse.id)
      console.log('Found subscription ID on retry:', subscriptionToUse.id)
    }

    setLoading(true)
    try {
      // Use the current subscriptionId (might have been set in the retry above)
      const currentSubscriptionId = subscriptionId
      console.log('Cancelling subscription:', currentSubscriptionId)
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: currentSubscriptionId,
          cancelOption: 'immediate',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Cancel API error:', errorData)
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      setStep('success')
      // Call the success callback to refresh subscription data
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      // Handle error - could show error state
    } finally {
      setLoading(false)
    }
  }



  const renderWarningStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Cancel Subscription
        </DialogTitle>
        <DialogDescription>
          You're about to cancel your subscription. Here's what you need to know:
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Current Transactions</span>
          <Badge variant={isOverLimit ? "destructive" : "secondary"}>
            {transactionCount} / 50 (Free limit)
          </Badge>
        </div>

        {isOverLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {transactionCount - 50} transactions over the free limit. 
              After cancellation, you won't be able to add new transactions until you're under 50.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">What happens when you cancel:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Your subscription will be cancelled immediately</li>
            <li>• All existing data remains safe and accessible</li>
            <li>• You can re-subscribe anytime to regain full access</li>
            {isOverLimit && (
              <li className="text-orange-600">• New transactions will be blocked immediately if over 50 total</li>
            )}
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Keep Subscription
          </Button>
          <Button 
            onClick={() => setStep('confirm')} 
            variant="destructive" 
            className="flex-1"
          >
            Cancel Subscription
          </Button>
        </div>
      </div>
    </>
  )



  const renderConfirmStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogDescription>
          Are you sure you want to cancel your subscription?
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">This will:</h4>
          <ul className="text-sm space-y-1">
            <li>• Cancel your subscription immediately</li>
            <li>• Remove access to Pro features</li>
            {isOverLimit && (
              <li className="text-orange-600">• Block new transactions (you have {transactionCount - 50} over the free limit)</li>
            )}
            <li>• Keep all your existing data safe</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setStep('warning')} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={handleCancel} 
            variant="destructive" 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </>
  )

  const renderSuccessStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Subscription Cancelled
        </DialogTitle>
        <DialogDescription>
          Your subscription has been cancelled successfully.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            Your subscription has been cancelled immediately. You can re-subscribe anytime to regain access to Pro features.
          </p>
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Close
        </Button>
      </div>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      // Reset step when modal closes
      if (!newOpen) {
        setStep('warning')
      }
    }}>
      <DialogContent className="sm:max-w-md">
        {step === 'warning' && renderWarningStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  )
} 