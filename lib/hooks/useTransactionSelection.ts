"use client"

import { useState, useCallback } from 'react'
import { UnifiedTransaction } from '@/types/transactions'

/**
 * Hook for managing transaction selections
 */
export function useTransactionSelection() {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  // Select/deselect a single transaction
  const toggleSelection = useCallback((transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }, [])

  // Toggle selection for all provided transactions
  const toggleSelectAll = useCallback((transactions: UnifiedTransaction[]) => {
    setSelectedTransactions(prev => {
      const transactionIds = transactions.map(t => t.id)
      const allSelected = transactionIds.every(id => prev.has(id))
      
      if (allSelected) {
        // If all are selected, deselect all
        const newSet = new Set(prev)
        transactionIds.forEach(id => newSet.delete(id))
        return newSet
      } else {
        // Otherwise, select all
        const newSet = new Set(prev)
        transactionIds.forEach(id => newSet.add(id))
        return newSet
      }
    })
  }, [])

  // Check if all provided transactions are selected
  const areAllSelected = useCallback((transactions: UnifiedTransaction[]) => {
    return transactions.length > 0 && transactions.every(t => selectedTransactions.has(t.id))
  }, [selectedTransactions])

  // Check if a transaction is selected
  const isSelected = useCallback((transactionId: string) => {
    return selectedTransactions.has(transactionId)
  }, [selectedTransactions])

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedTransactions(new Set())
  }, [])

  return {
    selectedTransactions,
    toggleSelection,
    toggleSelectAll,
    areAllSelected,
    isSelected,
    clearSelections,
    selectedCount: selectedTransactions.size
  }
} 