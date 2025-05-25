"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Crown, MousePointerClick, AlertTriangle, Zap, X } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"
import { TransactionLimitService, SubscriptionService } from "@/lib/subscription"
import { cn } from "@/lib/utils/utils"
import { useToast } from "@/lib/hooks/use-toast"

export function SubscriptionTierBadge() {
  const { subscriptionInfo, loading } = useSubscription()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true)
    try {
      const { CheckoutService } = await import('@/lib/stripe/checkout-service')
      
      if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID) {
        await CheckoutService.upgradeToProMonthly()
      } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID) {
        await CheckoutService.upgradeToLifetime()
      } else {
        throw new Error('Invalid price ID')
      }
      
      // If we reach here without redirect, something went wrong
      setModalOpen(false)
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to start upgrade process",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setUpgrading(false)
    }
  }

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
    console.log('Subscription status:', subscriptionInfo.subscription_status)
    
    switch (subscriptionInfo.subscription_status) {
      case 'active':
      case 'trialing':
        console.log('Displaying PRO badge')
        return {
          label: 'PRO',
          icon: <Crown className="mr-1 h-4 w-4" />,
          style: {
            backgroundImage: 'linear-gradient(135deg, #F7931A 0%, #FF6B35 50%, #F7931A 100%)',
            borderColor: 'rgba(247, 147, 26, 0.3)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(247, 147, 26, 0.3)'
          }
        }
      case 'free':
      default:
        console.log('Displaying FREE badge')
        return {
          label: 'FREE',
          icon: null,
          style: {
            backgroundImage: 'linear-gradient(135deg, #6B7280 0%, #374151 50%, #6B7280 100%)',
            borderColor: 'rgba(107, 114, 128, 0.5)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
          }
        }
    }
  }

  // Transaction count logic for modal styling
  const count = subscriptionInfo.transaction_count
  const limits = SubscriptionService.getSubscriptionLimits(subscriptionInfo.subscription_status)
  
  // Updated thresholds: warning at 25+, limit at 50+, over limit at 50+
  const isWarning = count >= 25 && count < 50
  const isAtLimit = count === 50
  const isOverLimit = count > 50
  const showUpgradeNow = count >= 25

  const getModalType = (): 'warning' | 'limit-reached' | 'over-limit' => {
    if (isOverLimit) return 'over-limit'
    if (isAtLimit) return 'limit-reached'
    return 'warning'
  }

  const getModalConfig = () => {
    const modalType = getModalType()
    switch (modalType) {
      case 'warning':
        return {
          title: "Approaching Transaction Limit",
          description: `You have ${count}/50 transactions. Consider upgrading soon to continue tracking your Bitcoin portfolio.`,
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          persistent: false
        }
      case 'limit-reached':
        return {
          title: "Transaction Limit Reached",
          description: `You've reached your limit of 50 transactions. Upgrade to continue adding transactions to your portfolio.`,
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
          iconColor: "text-red-600 dark:text-red-400",
          persistent: true
        }
      case 'over-limit':
        return {
          title: "Over Transaction Limit",
          description: `You have ${count} transactions, which exceeds the free limit of 50. Upgrade to maintain full access to your portfolio.`,
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-800",
          iconColor: "text-red-600 dark:text-red-400",
          persistent: true
        }
      default:
        return {
          title: "Upgrade to Pro",
          description: "Upgrade to unlock unlimited transactions and premium features for your Bitcoin portfolio tracking.",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          persistent: false
        }
    }
  }

  const tierInfo = getTierDisplay()
  const showUpgradeButton = subscriptionInfo.subscription_status === 'free'
  const modalConfig = getModalConfig()

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

        {/* Tier Badge */}
        <Badge
          variant="outline"
          className={cn(
            "w-[75px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none text-xs font-medium"
          )}
          style={tierInfo.style}
        >
          {tierInfo.icon}
          {tierInfo.label}
        </Badge>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg ${modalConfig.bgColor} ${modalConfig.borderColor} border-2`}>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600">
                <AlertTriangle className={`h-7 w-7 ${modalConfig.iconColor}`} />
              </div>
              <DialogTitle className="text-2xl font-bold text-foreground mb-2 text-center">
                {modalConfig.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 pt-2">
              <p className="text-center text-muted-foreground">
                {modalConfig.description}
              </p>

              {/* Pricing Options */}
              <div className="space-y-4">
                {/* Pro Monthly */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bitcoin-orange/10 dark:bg-bitcoin-orange/20 rounded-lg">
                      <Crown className="h-5 w-5 text-bitcoin-orange" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Pro Monthly</div>
                      <div className="text-sm text-muted-foreground">Unlimited transactions</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">$4.99</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                  </div>
                </div>

                {/* Lifetime */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-200 dark:border-green-700 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                      <Zap className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Lifetime Access</div>
                      <div className="text-sm text-muted-foreground">One-time payment</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-2 py-1 shadow-lg">
                      Best Value
                    </Badge>
                    <div>
                      <div className="text-lg font-bold text-foreground">$210</div>
                      <div className="text-xs text-muted-foreground">forever</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleUpgrade('price_1RS3KAPMa0k9vRKSpRxl72ju')}
                  disabled={upgrading}
                  className="w-full h-12 border-bitcoin-orange text-bitcoin-orange hover:bg-bitcoin-orange hover:text-white font-semibold"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Go Pro
                </Button>
                <Button
                  onClick={() => handleUpgrade('price_1RS3KBPMa0k9vRKSk7vG0GKO')}
                  disabled={upgrading}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold shadow-lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get Lifetime
                </Button>
              </div>

              {/* Close button */}
              <Button 
                variant="ghost" 
                onClick={() => setModalOpen(false)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                {modalConfig.persistent ? 'Continue with Limited Access' : 'Continue with Free Plan'}
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  )
} 