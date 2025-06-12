"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubscription } from "@/lib/hooks"
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white mb-2">Subscription</h3>
          <p className="text-gray-400 text-sm mb-4">Loading subscription details...</p>
          <div className="animate-pulse h-20 bg-gray-700/50 rounded" />
        </div>
      </div>
    )
  }

  if (!subscriptionInfo) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white mb-2">Subscription</h3>
          <p className="text-gray-400 text-sm">Unable to load subscription information.</p>
        </div>
      </div>
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
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
      <div className="relative z-10 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Subscription</h3>
          <p className="text-gray-400 text-sm">
            Manage your BitBasis subscription plan and billing.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white">Subscription Plan:</h4>
              <Badge variant={displayInfo.badge.variant} className="flex items-center gap-1">
                {displayInfo.badge.icon && <displayInfo.badge.icon className="h-3 w-3" />}
                {displayInfo.badge.text}
              </Badge>
            </div>
            <p className="text-sm text-gray-400">{displayInfo.description}</p>
            <p className="text-xs text-gray-400">Status: {displayInfo.status}</p>
              
            {/* Show transaction progress for free users in greyed container */}
            {displayInfo.isFree && (
              <div className="flex items-center px-3 py-2 bg-gray-800/50 rounded-md border border-gray-700/50">
                <TransactionCountDisplay showProgress={true} />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold hover:shadow-lg hover:shadow-bitcoin-orange/30 transition-all duration-300"
            >
              {displayInfo.isFree ? 'Upgrade' : 'Manage Subscription'}
            </Button>
            {(displayInfo.isPro || displayInfo.isLifetime) && (
              <Button 
                variant="outline"
                onClick={() => setDowngradeModalOpen(true)}
                className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-500/50 transition-all duration-300"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>

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