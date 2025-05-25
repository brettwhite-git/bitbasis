"use client"

import { useSubscription } from "@/hooks/use-subscription"
import { TransactionLimitService, SubscriptionService } from "@/lib/subscription"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface TransactionCountDisplayProps {
  totalTransactions?: number // Allow override for specific views
  showProgress?: boolean     // Show progress bar
}

export function TransactionCountDisplay({ 
  totalTransactions, 
  showProgress = false 
}: TransactionCountDisplayProps) {
  const { subscriptionInfo, loading } = useSubscription()

  if (loading) {
    return (
      <span className="text-sm text-muted-foreground">
        Loading transaction count...
      </span>
    )
  }

  if (!subscriptionInfo) {
    return (
      <span className="text-sm text-muted-foreground">
        Transaction count unavailable
      </span>
    )
  }

  // Note: Pro/Lifetime filtering is now handled by parent components
  const count = totalTransactions ?? subscriptionInfo.transaction_count
  const limits = SubscriptionService.getSubscriptionLimits(subscriptionInfo.subscription_status)
  const formattedCount = TransactionLimitService.formatTransactionCount(count, limits.maxTransactions)
  const progressPercentage = TransactionLimitService.getProgressPercentage(count, limits.maxTransactions)
  
  // Updated thresholds: warning at 25+, limit at 50+, over limit at 50+
  const isWarning = count >= 25 && count < 50
  const isAtLimit = count === 50
  const isOverLimit = count > 50
  const shouldShowBadge = isWarning || isAtLimit || isOverLimit

  return (
    <div className="flex items-center gap-3">
      {/* 1. Progress Bar First */}
      {showProgress && limits.maxTransactions !== Infinity && (
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isOverLimit || isAtLimit ? 'bg-red-500' : 
              isWarning ? 'bg-yellow-500' : 
              'bg-bitcoin-orange'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      )}
      
      {/* 2. Transaction Count Second */}
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {formattedCount}
      </span>
      
      {/* 3. Warning Badge Last */}
      {shouldShowBadge && (
        <Badge 
          variant={isAtLimit || isOverLimit ? "destructive" : "outline"}
          className={`text-xs px-2 py-1 ${
            isWarning ? 'border-yellow-500 text-yellow-600' :
            isOverLimit ? '' : 'hover:bg-red-50'
          }`}
        >
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>
              {isOverLimit ? 'Over Limit' : 
               isAtLimit ? 'Limit Reached' : 
               'Warning'}
            </span>
          </div>
        </Badge>
      )}
    </div>
  )
} 