"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/providers/supabase-auth-provider"
import { Crown, Star } from "lucide-react"
import { TransactionCountDisplay } from "@/components/subscription/TransactionCountDisplay"
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal"
import { DowngradeModal } from "@/components/subscription/DowngradeModal"

export function SubscriptionManagement() {
  const { user } = useAuth()
  const { subscriptionInfo, loading, refreshStatus } = useSubscription()
  const [modalOpen, setModalOpen] = useState(false)
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false)

  // Handle successful cancellation
  const handleCancellationSuccess = async () => {
    await refreshStatus()
  }

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
      const currentPriceId = subscription_data?.price_id

      const isLifetime = currentPriceId === lifetimePriceId || 
                        (subscription_data?.metadata?.type === 'lifetime')

      if (isLifetime) {
        return {
          status: "Active",
          description: "One-time payment • Unlimited forever",
          badge: { text: "LIFETIME", variant: "default" as const, icon: Star },
          isLifetime: true,
          isPro: false,
          isFree: false
        }
      } else {
        return {
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
        status: "Active",
        description: "Limited to 50 transactions",
        badge: { text: "FREE", variant: "secondary" as const, icon: null },
        isLifetime: false,
        isPro: false,
        isFree: true
      }
    }
  }

  const displayInfo = getSubscriptionDisplayInfo()

  return (
    <>
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg">Subscription</CardTitle>
        <CardDescription>
          Manage your BitBasis subscription plan and billing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h4 className="font-medium">Subscription Plan:</h4>
              <Badge variant={displayInfo.badge.variant} className="flex items-center gap-1">
                {displayInfo.badge.icon && <displayInfo.badge.icon className="h-3 w-3" />}
                {displayInfo.badge.text}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{displayInfo.description}</p>
            <p className="text-xs text-muted-foreground">Status: {displayInfo.status}</p>
              
              {/* Show transaction progress for free users in greyed container */}
              {displayInfo.isFree && (
                <div className="flex items-center px-3 py-2 bg-muted/50 rounded-md border">
                  <TransactionCountDisplay showProgress={true} />
          </div>
              )}
        </div>
            <div className="flex gap-2">
              {(displayInfo.isPro || displayInfo.isLifetime) && (
              <Button 
                variant="outline"
                  onClick={() => setDowngradeModalOpen(true)}
              >
                  Cancel Subscription
              </Button>
              )}
              <Button 
                variant="orange-outline" 
                onClick={() => setModalOpen(true)}
              >
                {displayInfo.isFree ? 'Upgrade' : 'Manage Subscription'}
              </Button>
            </div>
                </div>
              </CardContent>
            </Card>

      {/* Unified Subscription Modal */}
      <SubscriptionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />

      {/* Downgrade Modal */}
      <DowngradeModal 
        open={downgradeModalOpen} 
        onOpenChange={setDowngradeModalOpen}
        onSuccess={handleCancellationSuccess}
      />
    </>
  )
} 