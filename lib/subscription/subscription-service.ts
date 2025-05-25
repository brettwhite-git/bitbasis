import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface UserSubscriptionInfo {
  subscription_status: string
  transaction_count: number
  can_add_transaction: boolean
  should_show_warning: boolean
  subscription_data?: {
    price_id?: string
    metadata?: Record<string, any>
    current_period_end?: string
    cancel_at_period_end?: boolean
  }
}

export interface SubscriptionLimits {
  maxTransactions: number
  warningThreshold: number
}

export class SubscriptionService {
  private static supabase = createClientComponentClient()

  /**
   * Get user's subscription status and transaction limits
   */
  static async getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionInfo> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_subscription_info', { user_uuid: userId })
        .single()

      if (error) {
        console.error('Error getting user subscription info:', error)
        // Return safe defaults for free user
        return {
          subscription_status: 'free',
          transaction_count: 0,
          can_add_transaction: true,
          should_show_warning: false
        }
      }

      return data as UserSubscriptionInfo
    } catch (error) {
      console.error('Error in getUserSubscriptionStatus:', error)
      // Return safe defaults
      return {
        subscription_status: 'free',
        transaction_count: 0,
        can_add_transaction: true,
        should_show_warning: false
      }
    }
  }

  /**
   * Check if user can add a single transaction
   */
  static async canAddTransaction(userId: string): Promise<boolean> {
    try {
      const status = await this.getUserSubscriptionStatus(userId)
      return status.can_add_transaction
    } catch (error) {
      console.error('Error checking if user can add transaction:', error)
      return false // Safe default - block if unsure
    }
  }

  /**
   * Get user's current transaction count
   */
  static async getTransactionCount(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_transaction_count', { user_uuid: userId })

      if (error) {
        console.error('Error getting transaction count:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in getTransactionCount:', error)
      return 0
    }
  }

  /**
   * Check if user can add multiple transactions (for CSV import)
   */
  static async checkTransactionLimit(userId: string, additionalCount: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('can_user_add_transactions', { 
          user_uuid: userId, 
          transaction_count: additionalCount 
        })

      if (error) {
        console.error('Error checking transaction limit:', error)
        return false // Safe default - block if unsure
      }

      return data || false
    } catch (error) {
      console.error('Error in checkTransactionLimit:', error)
      return false
    }
  }

  /**
   * Get subscription limits based on status
   */
  static getSubscriptionLimits(subscriptionStatus: string): SubscriptionLimits {
    switch (subscriptionStatus) {
      case 'active':
      case 'trialing':
        return {
          maxTransactions: Infinity,
          warningThreshold: Infinity
        }
      case 'free':
      default:
        return {
          maxTransactions: 50,
          warningThreshold: 45
        }
    }
  }

  /**
   * Check if user should see upgrade warning
   */
  static async shouldShowWarning(userId: string): Promise<boolean> {
    try {
      const status = await this.getUserSubscriptionStatus(userId)
      return status.should_show_warning
    } catch (error) {
      console.error('Error checking warning status:', error)
      return false
    }
  }

  /**
   * Check if user is at or over limit
   */
  static async isAtLimit(userId: string): Promise<boolean> {
    try {
      const status = await this.getUserSubscriptionStatus(userId)
      return !status.can_add_transaction
    } catch (error) {
      console.error('Error checking limit status:', error)
      return true // Safe default - assume at limit if unsure
    }
  }

  /**
   * Get user's active subscription from Stripe tables
   */
  static async getActiveSubscription(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select(`
          *,
          prices (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error getting active subscription:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getActiveSubscription:', error)
      return null
    }
  }

  /**
   * Check if user has any subscription (active or inactive)
   */
  static async hasAnySubscription(userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) {
        console.error('Error checking for subscriptions:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Error in hasAnySubscription:', error)
      return false
    }
  }
} 