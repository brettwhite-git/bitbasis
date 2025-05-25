import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'
import { SubscriptionService, TransactionLimitService, UserSubscriptionInfo } from '@/lib/subscription'

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

  const fetchSubscriptionStatus = async () => {
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
  }

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [user?.id])

  const refreshStatus = async () => {
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