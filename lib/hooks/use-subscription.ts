import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'
import { SubscriptionService, UserSubscriptionInfo } from '@/lib/subscription' // TransactionLimitService not used

export interface UseSubscriptionReturn {
  subscriptionInfo: UserSubscriptionInfo | null
  loading: boolean
  error: string | null
  canAddTransaction: boolean
  shouldShowWarning: boolean
  shouldBlock: boolean
  transactionCount: number
  refreshStatus: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscriptionInfo, setSubscriptionInfo] = useState<UserSubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.id) {
      setSubscriptionInfo(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const info = await SubscriptionService.getUserSubscriptionStatus(user.id)
      setSubscriptionInfo(info)
    } catch (err) {
      console.error('Error fetching subscription status:', err)
      setError('Failed to load subscription status')
      // Set safe defaults
      setSubscriptionInfo({
        subscription_status: 'free',
        transaction_count: 0,
        can_add_transaction: false,
        should_show_warning: false
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [user?.id, fetchSubscriptionStatus])

  const refreshStatus = async () => {
    // Force a fresh fetch by clearing any potential cache
    setSubscriptionInfo(null)
    setLoading(true)
    await fetchSubscriptionStatus()
  }

  return {
    subscriptionInfo,
    loading,
    error,
    canAddTransaction: subscriptionInfo?.can_add_transaction ?? false,
    shouldShowWarning: subscriptionInfo?.should_show_warning ?? false,
    shouldBlock: subscriptionInfo ? !subscriptionInfo.can_add_transaction && subscriptionInfo.subscription_status === 'free' : false,
    transactionCount: subscriptionInfo?.transaction_count ?? 0,
    refreshStatus
  }
} 