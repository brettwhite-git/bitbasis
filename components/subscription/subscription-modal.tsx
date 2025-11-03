"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Star, Zap, Check, ExternalLink } from "lucide-react"
import { useSubscription } from "@/lib/hooks"
import { useToast } from "@/lib/hooks/use-toast"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const { subscriptionInfo, loading } = useSubscription()
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)

  const handleUpgrade = async (type: 'pro-monthly' | 'lifetime') => {
    // Prevent multiple rapid clicks
    if (processing) {
      console.log('Upgrade already in progress, ignoring click')
      return
    }

    setProcessing(true)
    try {
      console.log(`Starting ${type} upgrade process...`)
      const { CheckoutService } = await import('@/lib/stripe/checkout-service')
      
      if (type === 'pro-monthly') {
        await CheckoutService.upgradeToProMonthly({
          successUrl: `${window.location.origin}/dashboard/success`,
          cancelUrl: `${window.location.origin}/dashboard/settings`
        })
      } else {
        await CheckoutService.upgradeToLifetime({
          successUrl: `${window.location.origin}/dashboard/success`,
          cancelUrl: `${window.location.origin}/dashboard/settings`
        })
      }
      
      // Don't close modal immediately - user will be redirected to Stripe
      console.log('Redirecting to Stripe checkout...')
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to start upgrade process",
        variant: "destructive",
        duration: 5000,
      })
      setProcessing(false) // Only reset on error
    }
    // Note: Don't reset processing on success - user will be redirected
  }

  const handleManageSubscription = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/settings`
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to open billing portal')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = result.url
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast({
        title: "Error",
        description: "Unable to open billing portal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading || !subscriptionInfo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const isLifetime = subscriptionInfo.subscription_status === 'active' && 
    subscriptionInfo.subscription_data?.price_id === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID
  const isPro = subscriptionInfo.subscription_status === 'active' && !isLifetime
  const isFree = subscriptionInfo.subscription_status === 'free'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-800/20 via-gray-900/40 to-gray-800/20 backdrop-blur-md border-gray-700/30 [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:hover:bg-gray-700/50">
        <DialogHeader className="text-center">
          <DialogTitle>
            {isFree ? "Choose Your Plan" :
             isPro ? "Manage Subscription" :
             "Subscription Management"}
          </DialogTitle>
          <DialogDescription>
            {isFree ? "Upgrade to unlock unlimited transactions and premium features." :
             isPro ? "Upgrade to Lifetime or manage your current subscription." :
             "Manage your subscription and billing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Free Users: Show upgrade options */}
          {isFree && (
            <>
              {/* Pro Monthly Option */}
              <Card className="border-gray-700/30 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Pro Monthly</CardTitle>
                    <Badge variant="default" className="bg-bitcoin-orange border-bitcoin-orange/20">
                      <Crown className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">$9.99</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Unlimited transactions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Premium portfolio analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority customer support</span>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleUpgrade('pro-monthly')}
                    disabled={processing}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {processing ? "Processing..." : "Start Pro Plan"}
                  </Button>
                </CardContent>
              </Card>

              {/* Lifetime Option */}
              <Card className="border-gray-700/30 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Lifetime</CardTitle>
                    <Badge variant="default" className="bg-green-600 border-green-600/20">
                      <Star className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">$210</span>
                    <span className="text-gray-400">one-time</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>No recurring payments</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => handleUpgrade('lifetime')}
                    disabled={processing}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {processing ? "Processing..." : "Get Lifetime Access"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Pro Users: Show lifetime upgrade and manage options */}
          {isPro && (
            <>
              <Card className="border-gray-700/30 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white">Upgrade to Lifetime</CardTitle>
                  <p className="text-sm text-gray-400">
                    One-time payment, unlimited forever
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">$210</span>
                    <span className="text-gray-400">one-time</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgrade('lifetime')}
                    disabled={processing}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {processing ? "Processing..." : "Upgrade to Lifetime"}
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button 
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={processing}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {processing ? "Opening..." : "Manage Billing & Cancel"}
                </Button>
              </div>
            </>
          )}

          {/* Lifetime Users: Show current status and portal access */}
          {isLifetime && (
            <>
              <Card className="border-gray-700/30 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-600/20">
                    <Star className="h-6 w-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg text-white">Lifetime Plan Active</CardTitle>
                  <p className="text-sm text-gray-400">
                    You have unlimited access to all BitBasis features forever.
                  </p>
                </CardHeader>
              </Card>

              <div className="text-center">
                <Button 
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={processing}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {processing ? "Opening..." : "View Billing History"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 