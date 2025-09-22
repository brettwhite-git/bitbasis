import { SubscriptionService } from './subscription-service'

export interface TransactionLimitResult {
  allowed: boolean
  reason?: 'limit_reached' | 'would_exceed_limit' | 'over_limit'
  currentCount: number
  maxAllowed: number
  message: string
}

export interface WarningInfo {
  shouldShow: boolean
  message: string
  transactionsLeft: number
}

export class TransactionLimitService {
  /**
   * Validate if user can add a single transaction
   */
  static async validateTransactionAdd(userId: string): Promise<TransactionLimitResult> {
    try {
      const status = await SubscriptionService.getUserSubscriptionStatus(userId)
      const limits = SubscriptionService.getSubscriptionLimits(status.subscription_status)

      if (status.subscription_status === 'active' || status.subscription_status === 'trialing') {
        return {
          allowed: true,
          currentCount: status.transaction_count,
          maxAllowed: limits.maxTransactions,
          message: 'Unlimited transactions available'
        }
      }

      if (status.transaction_count >= limits.maxTransactions) {
        return {
          allowed: false,
          reason: 'over_limit',
          currentCount: status.transaction_count,
          maxAllowed: limits.maxTransactions,
          message: `You've reached the limit of ${limits.maxTransactions} transactions. Upgrade to Pro for unlimited access.`
        }
      }

      const transactionsLeft = limits.maxTransactions - status.transaction_count
      return {
        allowed: true,
        currentCount: status.transaction_count,
        maxAllowed: limits.maxTransactions,
        message: `${transactionsLeft} transactions remaining`
      }
    } catch (error) {
      console.error('Error validating transaction add:', error)
      return {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Unable to verify transaction limit. Please try again.'
      }
    }
  }

  /**
   * Validate if user can add multiple transactions (for CSV import)
   */
  static async validateBulkTransactionAdd(userId: string, count: number): Promise<TransactionLimitResult> {
    try {
      const status = await SubscriptionService.getUserSubscriptionStatus(userId)
      const limits = SubscriptionService.getSubscriptionLimits(status.subscription_status)

      if (status.subscription_status === 'active' || status.subscription_status === 'trialing') {
        return {
          allowed: true,
          currentCount: status.transaction_count,
          maxAllowed: limits.maxTransactions,
          message: `Unlimited transactions available. Adding ${count} transactions.`
        }
      }

      const newTotal = status.transaction_count + count
      if (newTotal > limits.maxTransactions) {
        const canAdd = limits.maxTransactions - status.transaction_count
        return {
          allowed: false,
          reason: 'would_exceed_limit',
          currentCount: status.transaction_count,
          maxAllowed: limits.maxTransactions,
          message: `Cannot import ${count} transactions. You can only add ${canAdd} more to stay within the ${limits.maxTransactions} transaction limit.`
        }
      }

      const transactionsLeft = limits.maxTransactions - newTotal
      return {
        allowed: true,
        currentCount: status.transaction_count,
        maxAllowed: limits.maxTransactions,
        message: `Importing ${count} transactions. ${transactionsLeft} remaining after import.`
      }
    } catch (error) {
      console.error('Error validating bulk transaction add:', error)
      return {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Unable to verify transaction limit for import. Please try again.'
      }
    }
  }

  /**
   * Check if user should see warning about approaching limit
   */
  static async shouldShowWarning(userId: string): Promise<WarningInfo> {
    try {
      const status = await SubscriptionService.getUserSubscriptionStatus(userId)
      const limits = SubscriptionService.getSubscriptionLimits(status.subscription_status)

      // Only active and lifetime users don't need warnings (trialing users are treated as free)
      if (status.subscription_status === 'active' || status.subscription_status === 'lifetime') {
        return {
          shouldShow: false,
          message: '',
          transactionsLeft: Infinity
        }
      }

      const transactionsLeft = limits.maxTransactions - status.transaction_count

      if (status.should_show_warning) {
        return {
          shouldShow: true,
          message: `You're approaching your transaction limit. Only ${transactionsLeft} transactions remaining before you'll need to upgrade.`,
          transactionsLeft
        }
      }

      return {
        shouldShow: false,
        message: '',
        transactionsLeft
      }
    } catch (error) {
      console.error('Error checking warning status:', error)
      return {
        shouldShow: false,
        message: '',
        transactionsLeft: 0
      }
    }
  }

  /**
   * Check if user should see persistent blocking modal
   */
  static async shouldBlockTransaction(userId: string): Promise<boolean> {
    try {
      const status = await SubscriptionService.getUserSubscriptionStatus(userId)
      return !status.can_add_transaction && status.subscription_status === 'free'
    } catch (error) {
      console.error('Error checking block status:', error)
      return true // Safe default - block if unsure
    }
  }

  /**
   * Get upgrade messaging based on current status
   */
  static async getUpgradeMessage(userId: string): Promise<string> {
    try {
      const status = await SubscriptionService.getUserSubscriptionStatus(userId)
      const limits = SubscriptionService.getSubscriptionLimits(status.subscription_status)

      if (status.subscription_status === 'active' || status.subscription_status === 'trialing') {
        return 'You have unlimited transactions with your current plan.'
      }

      if (status.transaction_count >= limits.maxTransactions) {
        return `You've reached your limit of ${limits.maxTransactions} transactions. Upgrade to Pro ($4.99/month) or get Lifetime access ($210) for unlimited transactions.`
      }

      const transactionsLeft = limits.maxTransactions - status.transaction_count
      if (transactionsLeft <= 5) {
        return `Only ${transactionsLeft} transactions remaining. Upgrade to Pro ($4.99/month) or get Lifetime access ($210) to continue tracking your Bitcoin portfolio.`
      }

      return `You have ${transactionsLeft} transactions remaining in your free plan.`
    } catch (error) {
      console.error('Error getting upgrade message:', error)
      return 'Upgrade to Pro for unlimited transactions and full portfolio tracking.'
    }
  }

  /**
   * Format transaction count display
   */
  static formatTransactionCount(current: number, max: number): string {
    if (max === Infinity) {
      return `${current.toLocaleString()} transactions`
    }
    return `${current}/${max} transactions`
  }

  /**
   * Get progress percentage for UI displays
   */
  static getProgressPercentage(current: number, max: number): number {
    if (max === Infinity) return 0
    return Math.min((current / max) * 100, 100)
  }
} 