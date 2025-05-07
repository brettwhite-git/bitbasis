"use client"

import { useState, useMemo } from 'react'
import { UnifiedTransaction, TransactionFilterState } from '@/types/transactions'
import { isShortTerm } from '@/lib/utils/transaction-utils'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'

/**
 * Hook for managing and applying transaction filters
 */
export function useTransactionFilters(transactions: UnifiedTransaction[]) {
  // Initialize filter state
  const [filters, setFilters] = useState<TransactionFilterState>({
    searchQuery: "",
    dateRange: undefined,
    typeFilter: "all",
    termFilter: "all",
    exchangeFilter: "all"
  })

  // Get unique exchanges for filter options
  const uniqueExchanges = useMemo(() => {
    const exchanges = new Set(transactions.map(t => t.exchange || '-'))
    return Array.from(exchanges).sort()
  }, [transactions])

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search query filter
      const matchesSearch = filters.searchQuery
        ? Object.values(transaction).some((value) =>
            value?.toString().toLowerCase().includes(filters.searchQuery.toLowerCase())
          )
        : true

      // Date range filter
      let matchesDateRange = true
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const transactionDate = new Date(transaction.date)
        const start = filters.dateRange.from ? startOfDay(filters.dateRange.from) : new Date(0)
        const end = filters.dateRange.to ? endOfDay(filters.dateRange.to) : new Date()
        matchesDateRange = isWithinInterval(transactionDate, { start, end })
      }

      // Type filter
      const matchesType = filters.typeFilter === "all" || 
        transaction.type.toLowerCase() === filters.typeFilter.toLowerCase()

      // Term filter
      const matchesTerm = filters.termFilter === "all" || 
        (filters.termFilter === 'SHORT' && isShortTerm(transaction.date)) ||
        (filters.termFilter === 'LONG' && !isShortTerm(transaction.date))

      // Exchange filter
      const matchesExchange = filters.exchangeFilter === "all" || 
        (filters.exchangeFilter === '-' ? !transaction.exchange : transaction.exchange?.toLowerCase() === filters.exchangeFilter.toLowerCase())

      return matchesSearch && matchesDateRange && matchesType && matchesTerm && matchesExchange
    })
  }, [transactions, filters])

  // Update individual filters
  const setSearchQuery = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }))
  }

  const setDateRange = (dateRange: TransactionFilterState['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }))
  }

  const setTypeFilter = (typeFilter: string) => {
    setFilters(prev => ({ ...prev, typeFilter }))
  }

  const setTermFilter = (termFilter: string) => {
    setFilters(prev => ({ ...prev, termFilter }))
  }

  const setExchangeFilter = (exchangeFilter: string) => {
    setFilters(prev => ({ ...prev, exchangeFilter }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      dateRange: undefined,
      typeFilter: "all",
      termFilter: "all",
      exchangeFilter: "all"
    })
  }

  return {
    filters,
    filteredTransactions,
    uniqueExchanges,
    setSearchQuery,
    setDateRange,
    setTypeFilter,
    setTermFilter,
    setExchangeFilter,
    resetFilters
  }
} 