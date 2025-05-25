import { useState, useCallback } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'
import { TransactionLimitService, TransactionLimitResult } from '@/lib/subscription'

export interface UseTransactionLimitsReturn {
  validateSingleTransaction: () => Promise<TransactionLimitResult>
  validateBulkTransactions: (count: number) => Promise<TransactionLimitResult>
  isValidating: boolean
  lastValidation: TransactionLimitResult | null
}

export function useTransactionLimits(): UseTransactionLimitsReturn {
  const { user } = useAuth()
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<TransactionLimitResult | null>(null)

  const validateSingleTransaction = useCallback(async (): Promise<TransactionLimitResult> => {
    if (!user?.id) {
      const result: TransactionLimitResult = {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Please log in to continue'
      }
      setLastValidation(result)
      return result
    }

    try {
      setIsValidating(true)
      const result = await TransactionLimitService.validateTransactionAdd(user.id)
      setLastValidation(result)
      return result
    } catch (error) {
      console.error('Error validating single transaction:', error)
      const result: TransactionLimitResult = {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Unable to verify transaction limit. Please try again.'
      }
      setLastValidation(result)
      return result
    } finally {
      setIsValidating(false)
    }
  }, [user?.id])

  const validateBulkTransactions = useCallback(async (count: number): Promise<TransactionLimitResult> => {
    if (!user?.id) {
      const result: TransactionLimitResult = {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Please log in to continue'
      }
      setLastValidation(result)
      return result
    }

    try {
      setIsValidating(true)
      const result = await TransactionLimitService.validateBulkTransactionAdd(user.id, count)
      setLastValidation(result)
      return result
    } catch (error) {
      console.error('Error validating bulk transactions:', error)
      const result: TransactionLimitResult = {
        allowed: false,
        reason: 'limit_reached',
        currentCount: 0,
        maxAllowed: 50,
        message: 'Unable to verify transaction limit for import. Please try again.'
      }
      setLastValidation(result)
      return result
    } finally {
      setIsValidating(false)
    }
  }, [user?.id])

  return {
    validateSingleTransaction,
    validateBulkTransactions,
    isValidating,
    lastValidation
  }
} 