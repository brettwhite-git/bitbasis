"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useToast } from "@/lib/hooks/use-toast"
import { CheckoutService } from "@/lib/stripe/checkout-service"
import { Crown, CreditCard, ArrowUpRight, AlertTriangle, Check, Star, Zap } from "lucide-react"

export function SubscriptionManagement() {
  const { user } = useAuth()
  const { subscriptionInfo, loading } = useSubscription()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  if (loading) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>Loading subscription details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!subscriptionInfo) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>Unable to load subscription information.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getSubscriptionDisplayInfo = () => {
    const { subscription_status, transaction_count, subscription_data } = subscriptionInfo

    if (subscription_status === 'active' || subscription_status === 'trialing') {
      // Check price ID to determine if it's Lifetime or Pro Monthly
      const lifetimePriceId = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID
      const proMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
      
      // Try to get price_id from subscription_data if available
      const currentPriceId = subscription_data?.price_id

      const isLifetime = currentPriceId === lifetimePriceId || 
                        (subscription_data?.metadata?.type === 'lifetime')

      if (isLifetime) {
        return {
          plan: "Lifetime Plan",
          status: "Active",
          description: "One-time payment • Unlimited forever",
          badge: { text: "LIFETIME", variant: "default" as const, icon: Star },
          isLifetime: true,
          isPro: false,
          isFree: false
        }
      } else {
        return {
          plan: "Pro Plan",
          status: "Active",
          description: "$4.99/month • Unlimited transactions",
          badge: { text: "PRO", variant: "default" as const, icon: Crown },
          isLifetime: false,
          isPro: true,
          isFree: false
        }
      }
    } else {
      return {
        plan: "Free Plan",
        status: "Active",
        description: `${transaction_count}/50 transactions used`,
        badge: { text: "FREE", variant: "secondary" as const, icon: null },
        isLifetime: false,
        isPro: false,
        isFree: true
      }
    }
  }

  const displayInfo = getSubscriptionDisplayInfo()

  const handleManageSubscription = async () => {
    if (displayInfo.isFree) {
      setShowUpgradeDialog(true)
      return
    }

    try {
      setIsProcessing(true)
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
      setIsProcessing(false)
    }
  }

  const handleUpgradeToLifetime = async () => {
    try {
      setIsProcessing(true)
      await CheckoutService.upgradeToLifetime({
        successUrl: `${window.location.origin}/dashboard/success`,
        cancelUrl: `${window.location.origin}/dashboard/settings`
      })
    } catch (error) {
      console.error('Error starting Lifetime upgrade:', error)
      toast({
        title: "Error",
        description: "Unable to start upgrade process. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleUpgradeToProMonthly = async () => {
    try {
      setIsProcessing(true)
      await CheckoutService.upgradeToProMonthly({
        successUrl: `${window.location.origin}/dashboard/success`,
        cancelUrl: `${window.location.origin}/dashboard/settings`
      })
    } catch (error) {
      console.error('Error starting Pro upgrade:', error)
      toast({
        title: "Error",
        description: "Unable to start upgrade process. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const handleDowngradeToFree = async () => {
    try {
      setIsProcessing(true)
      
      // Check if user has more than 50 transactions
      if (subscriptionInfo.transaction_count > 50) {
        toast({
          title: "Cannot Downgrade",
          description: `You have ${subscriptionInfo.transaction_count} transactions. Please delete some transactions to get under the 50 transaction limit before downgrading.`,
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Cancel subscription via Stripe Customer Portal
      await handleManageSubscription()
    } catch (error) {
      console.error('Error downgrading subscription:', error)
      toast({
        title: "Error",
        description: "Unable to process downgrade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setShowDowngradeDialog(false)
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg">Subscription</CardTitle>
        <CardDescription>
          Manage your BitBasis subscription plan and billing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{displayInfo.plan}</h4>
              <Badge variant={displayInfo.badge.variant} className="flex items-center gap-1">
                {displayInfo.badge.icon && <displayInfo.badge.icon className="h-3 w-3" />}
                {displayInfo.badge.text}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{displayInfo.description}</p>
            <p className="text-xs text-muted-foreground">Status: {displayInfo.status}</p>
          </div>
          <Button 
            variant="orange-outline" 
            onClick={handleManageSubscription}
            disabled={isProcessing}
          >
            {isProcessing ? "Opening..." : displayInfo.isFree ? "Upgrade Plan" : "Manage Subscription"}
          </Button>
        </div>

        {/* Pro user actions */}
        {displayInfo.isPro && !displayInfo.isLifetime && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Upgrade to Lifetime</h5>
                <p className="text-sm text-muted-foreground">One-time payment, unlimited forever</p>
              </div>
              <Button 
                variant="outline"
                onClick={handleUpgradeToLifetime}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                $210 Lifetime
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-red-600">Downgrade to Free</h5>
                <p className="text-sm text-muted-foreground">Cancel your subscription</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowDowngradeDialog(true)}
                disabled={isProcessing}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Downgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Upgrade Dialog for Free Users */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Upgrade to unlock unlimited transactions and premium features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card className="border-orange-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pro Monthly</CardTitle>
                  <Badge variant="default" className="bg-orange-600">
                    <Crown className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">$4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Unlimited transactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Premium portfolio analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Priority customer support</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleUpgradeToProMonthly}
                  disabled={isProcessing}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Start Pro Monthly
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lifetime</CardTitle>
                  <Badge variant="outline" className="border-yellow-400 text-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">$210</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Everything in Pro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Lifetime access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>No recurring fees</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Save $149.76 vs 3 years of Pro
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleUpgradeToLifetime}
                  disabled={isProcessing}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get Lifetime Access
                </Button>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Downgrade to Free Plan?</DialogTitle>
            <DialogDescription>
              You're about to cancel your Pro subscription and downgrade to the Free plan.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>What happens when you downgrade:</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <div>• You'll be limited to 50 transactions</div>
              <div>• Your subscription will cancel at the end of the current billing period</div>
              <div>• You can upgrade again at any time</div>
              {subscriptionInfo.transaction_count > 50 && (
                <div className="text-red-600 font-medium">
                  • You currently have {subscriptionInfo.transaction_count} transactions. You'll need to delete some to get under 50.
                </div>
              )}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Keep Pro Plan
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDowngradeToFree}
              disabled={isProcessing || subscriptionInfo.transaction_count > 50}
            >
              {isProcessing ? "Processing..." : "Downgrade to Free"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 