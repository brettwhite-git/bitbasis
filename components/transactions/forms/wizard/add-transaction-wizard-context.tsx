"use client"

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  NewTransaction, 
  StagedTransaction, 
  WizardStep, 
  AddTransactionWizardContext,
  TransactionWizardData 
} from '@/types/add-transaction'

interface AddTransactionWizardProviderProps {
  children: React.ReactNode
  onSuccess?: () => void
  onClose?: () => void
}

const WizardContext = createContext<AddTransactionWizardContext | null>(null)

// LocalStorage key for persisting staged transactions
const STAGED_TRANSACTIONS_KEY = 'bitbasis-staged-transactions'

// Helper functions for localStorage persistence
const saveToLocalStorage = (transactions: StagedTransaction[]) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STAGED_TRANSACTIONS_KEY, JSON.stringify(transactions))
    }
  } catch (error) {
    console.warn('Failed to save staged transactions to localStorage:', error)
  }
}

const loadFromLocalStorage = (): StagedTransaction[] => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STAGED_TRANSACTIONS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    }
  } catch (error) {
    console.warn('Failed to load staged transactions from localStorage:', error)
    // Clear corrupted data
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STAGED_TRANSACTIONS_KEY)
    }
  }
  return []
}

const clearFromLocalStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STAGED_TRANSACTIONS_KEY)
    }
  } catch (error) {
    console.warn('Failed to clear staged transactions from localStorage:', error)
  }
}

// Debug function to check localStorage status - not currently used
/*
const getLocalStorageInfo = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STAGED_TRANSACTIONS_KEY)
      return {
        hasStored: !!stored,
        count: stored ? JSON.parse(stored).length : 0,
        data: stored ? JSON.parse(stored) : null
      }
    }
  } catch (error) {
    console.warn('Failed to get localStorage info:', error)
  }
  return { hasStored: false, count: 0, data: null }
}
*/

export function AddTransactionWizardProvider({ 
  children, 
  onSuccess,
  onClose: _onClose // Parameter not currently used 
}: AddTransactionWizardProviderProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('type')
  const [transactionData, setTransactionData] = useState<TransactionWizardData>({
    date: new Date().toISOString().slice(0, 16), // Default to current date/time
    asset: 'BTC',
    type: 'buy',
    sent_currency: 'USD', // Default fiat currency to USD
    received_currency: 'BTC', // Default crypto currency to BTC
    fee_currency: 'USD' // Default fee currency to USD
  })
  const [stagedTransactions, setStagedTransactions] = useState<StagedTransaction[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize staged transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = loadFromLocalStorage()
    if (savedTransactions.length > 0) {
      setStagedTransactions(savedTransactions)
      toast.success(`Restored ${savedTransactions.length} staged transaction(s)`, {
        description: 'Your previous staged transactions have been restored.'
      })
    }
  }, [])

  // Save staged transactions to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(stagedTransactions)
  }, [stagedTransactions])

  // Navigation functions
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step)
    setErrors({}) // Clear errors when navigating
  }, [])

  const nextStep = useCallback(() => {
    const steps: WizardStep[] = ['type', 'details', 'review', 'submit']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      const nextStepValue = steps[currentIndex + 1]
      if (nextStepValue) {
        setCurrentStep(nextStepValue)
        setErrors({})
      }
    }
  }, [currentStep])

  const prevStep = useCallback(() => {
    const steps: WizardStep[] = ['type', 'details', 'review', 'submit']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      const prevStepValue = steps[currentIndex - 1]
      if (prevStepValue) {
        setCurrentStep(prevStepValue)
        setErrors({})
      }
    }
  }, [currentStep])

  // Data management functions
  const updateTransactionData = useCallback((data: Partial<TransactionWizardData>) => {
    setTransactionData(prev => ({ ...prev, ...data }))
    setErrors({}) // Clear errors when data changes
  }, [])

  const clearTransactionData = useCallback(() => {
    setTransactionData({
      date: new Date().toISOString().slice(0, 16),
      asset: 'BTC',
      type: 'buy',
      sent_currency: 'USD', // Default fiat currency to USD
      received_currency: 'BTC', // Default crypto currency to BTC
      fee_currency: 'USD' // Default fee currency to USD
    })
    setErrors({})
  }, [])

  // Staging functions
  const addToStaging = useCallback((transaction: NewTransaction) => {
    const stagedTransaction: StagedTransaction = {
      ...transaction,
      tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    }
    
    setStagedTransactions(prev => [...prev, stagedTransaction])
    
    toast.success('Transaction added to staging', {
      description: `${transaction.type.toUpperCase()} transaction has been staged for submission.`
    })
    
    // Clear current transaction data for next entry
    clearTransactionData()
    
    // Go back to type selection or details step for next transaction
    setCurrentStep('type')
  }, [clearTransactionData])

  const removeFromStaging = useCallback((tempId: string) => {
    setStagedTransactions(prev => prev.filter(t => t.tempId !== tempId))
    
    toast.success('Transaction removed from staging')
  }, [])

  const clearStaging = useCallback(() => {
    setStagedTransactions([])
    clearFromLocalStorage()
    toast.success('All staged transactions cleared')
  }, [])

  const editStagedTransaction = useCallback((tempId: string) => {
    const transaction = stagedTransactions.find(t => t.tempId === tempId)
    if (transaction) {
      // Load into current transaction data, excluding temp fields
      const { tempId: _, created_at: __, ...transactionDataToLoad } = transaction
      
      // Properly handle the discriminated union by ensuring type safety
      setTransactionData(transactionDataToLoad)
      
      // Go to details step
      setCurrentStep('details')
      
      toast.success('Transaction loaded for editing')
      
      // Remove from staging
      setStagedTransactions(prev => prev.filter(t => t.tempId !== tempId))
    }
  }, [stagedTransactions])

  // Submission function
  const submitTransactions = useCallback(async () => {
    if (stagedTransactions.length === 0) {
      setErrors({ submit: 'No transactions to submit' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare transactions for submission
      const transactionsToSubmit = stagedTransactions.map((stagedTransaction) => {
        // Base transaction data
        const baseTransaction = {
          date: new Date(stagedTransaction.date).toISOString(),
          type: stagedTransaction.type,
          asset: stagedTransaction.asset || 'BTC',
          price: stagedTransaction.price,
          comment: stagedTransaction.comment,
        }

        // Add type-specific fields - use spread to include all possible fields
        const fullTransaction = {
          ...baseTransaction,
          ...stagedTransaction, // This spreads all fields from the staged transaction
          // Remove temp fields that shouldn't be sent to API
          tempId: undefined,
          created_at: undefined,
        }

        return fullTransaction
      })

      // Submit to API
              const response = await fetch('/api/transaction-history/add-unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactionsToSubmit
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to submit transactions')
      }

      // Success - clear everything and reset
      toast.success('Transactions submitted successfully!', {
        description: `${result.count || stagedTransactions.length} transaction(s) have been added to your portfolio.`
      })
      
      setStagedTransactions([])
      clearFromLocalStorage() // Clear persisted staged transactions
      setTransactionData({
        date: new Date().toISOString().slice(0, 16),
        asset: 'BTC',
        type: 'buy',
        sent_currency: 'USD',
        received_currency: 'BTC',
        fee_currency: 'USD'
      })
      setCurrentStep('type')
      setErrors({})
      
      // Call success callback
      onSuccess?.()
      
    } catch (error: unknown) {
      console.error('Error submitting transactions:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit transactions. Please try again.'
      setErrors({ 
        submit: errorMessage 
      })
      
      toast.error('Failed to submit transactions', {
        description: error instanceof Error ? error.message : 'Please check your data and try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [stagedTransactions, onSuccess])

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStep('type')
    setTransactionData({
      date: new Date().toISOString().slice(0, 16),
      asset: 'BTC',
      type: 'buy'
    })
    setStagedTransactions([])
    setErrors({})
    setIsSubmitting(false)
  }, [])

  const contextValue = useMemo(() => ({
    // State
    currentStep,
    transactionData,
    stagedTransactions,
    isSubmitting,
    errors,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // Data management
    updateTransactionData,
    clearTransactionData,
    
    // Staging
    addToStaging,
    removeFromStaging,
    clearStaging,
    editStagedTransaction,
    
    // Submission
    submitTransactions,
    
    // Reset
    resetWizard,
  }), [
    currentStep,
    transactionData,
    stagedTransactions,
    isSubmitting,
    errors,
    goToStep,
    nextStep,
    prevStep,
    updateTransactionData,
    clearTransactionData,
    addToStaging,
    removeFromStaging,
    clearStaging,
    editStagedTransaction,
    submitTransactions,
    resetWizard,
  ])

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  )
}

export function useAddTransactionWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useAddTransactionWizard must be used within AddTransactionWizardProvider')
  }
  return context
} 