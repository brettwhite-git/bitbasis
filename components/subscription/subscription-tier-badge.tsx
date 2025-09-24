"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Crown, MousePointerClick, Star } from "lucide-react"
import { useSubscription } from "@/lib/hooks"
import { cn } from "@/lib/utils/utils"
import { SubscriptionModal } from "./subscription-modal"

export function SubscriptionTierBadge() {
  const { subscriptionInfo, loading, refreshStatus } = useSubscription()
  const [modalOpen, setModalOpen] = useState(false)
  const searchParams = useSearchParams()

  // Force refresh when returning from cancellation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh')
    if (refreshParam) {
      console.log('🔄 Detected refresh parameter, forcing subscription status refresh')
      refreshStatus()
      
      // Clean up the URL parameter after refresh
      const url = new URL(window.location.href)
      url.searchParams.delete('refresh')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, refreshStatus])

  if (loading) {
    return (
      <Badge
        variant="outline"
        className="w-[75px] inline-flex items-center justify-center rounded-full border shadow-sm text-xs font-medium bg-gray-200 animate-pulse"
      >
        Loading...
      </Badge>
    )
  }

  if (!subscriptionInfo) {
    return (
      <Badge
        variant="outline"
        className="w-[75px] inline-flex items-center justify-center rounded-full border shadow-sm text-xs font-medium bg-red-200 text-red-800"
      >
        Error
      </Badge>
    )
  }

  const getTierDisplay = () => {
    // Check if user has active paid subscription (excluding trialing)
    if (subscriptionInfo.subscription_status === 'active') {
      // Check if it's a lifetime subscription
      const isLifetime = subscriptionInfo.subscription_data?.metadata?.type === 'lifetime' ||
                        subscriptionInfo.subscription_data?.price_id === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID

      if (isLifetime) {
        return {
          label: 'LIFETIME',
          icon: <Star className="mr-1 h-3 w-3" />,
          variant: 'default' as const,
          useCustomStyle: false
        }
      } else {
        return {
          label: 'PRO',
          icon: <Crown className="mr-1 h-3 w-3" />,
          variant: 'default' as const,
          useCustomStyle: false
        }
      }
    } else {
      // Trialing, free, and all other statuses show as FREE
      return {
        label: 'FREE',
        icon: null,
        variant: 'secondary' as const,
        useCustomStyle: true,
        style: {
          backgroundImage: 'linear-gradient(135deg, #6B7280 0%, #374151 50%, #6B7280 100%)',
          borderColor: 'rgba(107, 114, 128, 0.5)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
        }
      }
    }
  }

  const tierInfo = getTierDisplay()
  const showUpgradeButton = subscriptionInfo.subscription_status === 'free' || subscriptionInfo.subscription_status === 'trialing'

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Upgrade Button (only show for free users) */}
        {showUpgradeButton && (
          <Badge 
            className="text-xs px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity bg-green-500 hover:bg-green-600 text-white border-green-500"
            onClick={() => setModalOpen(true)}
          >
            <div className="flex items-center gap-1">
              <MousePointerClick className="h-3 w-3" />
              <span>UPGRADE NOW</span>
            </div>
          </Badge>
        )}

        {/* Tier Badge (only show for Pro and Lifetime users) */}
        {!showUpgradeButton && (
        <Badge
            variant={tierInfo.variant}
          className={cn(
              "min-w-[75px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none text-xs font-medium px-3",
              tierInfo.label === 'LIFETIME' && "min-w-[90px]"
          )}
        >
          {tierInfo.icon}
          {tierInfo.label}
        </Badge>
        )}
      </div>

      {/* Unified Subscription Modal */}
      <SubscriptionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  )
} 