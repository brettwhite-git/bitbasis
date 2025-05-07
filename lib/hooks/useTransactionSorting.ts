"use client"

import { useState, useMemo, useCallback } from 'react'
import { UnifiedTransaction, SortConfig } from '@/types/transactions'

/**
 * Hook for managing transaction sorting
 */
export function useTransactionSorting(transactions: UnifiedTransaction[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    column: 'date', 
    direction: 'desc' 
  })

  // Sort transactions based on the current sort configuration
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.column) return transactions

    return [...transactions].sort((a, b) => {
      const aValue = a[sortConfig.column!]
      const bValue = b[sortConfig.column!]

      // Handle nulls - sort them to the end or beginning based on direction
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1

      // Handle different types of values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle date strings
      if (sortConfig.column === 'date') {
        const aDate = new Date(aValue as string).getTime()
        const bDate = new Date(bValue as string).getTime()
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Convert to strings for string comparison
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aString.localeCompare(bString)
      }
      return bString.localeCompare(aString)
    })
  }, [transactions, sortConfig])

  // Toggle sort for a column
  const handleSort = useCallback((column: keyof UnifiedTransaction) => {
    setSortConfig(currentConfig => ({
      column,
      direction: currentConfig.column === column && currentConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }, [])

  // Reset sort to default
  const resetSort = useCallback(() => {
    setSortConfig({ column: 'date', direction: 'desc' })
  }, [])

  return {
    sortConfig,
    sortedTransactions,
    handleSort,
    resetSort
  }
} 