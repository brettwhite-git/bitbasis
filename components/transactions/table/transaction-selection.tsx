"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { UnifiedTransaction } from '@/types/transactions'

interface TransactionSelectionProps {
  // Selection state
  selectedTransactions: Set<string>
  
  // Actions
  onBulkDelete: () => void
}

export function TransactionSelection({
  selectedTransactions,
  onBulkDelete,
}: TransactionSelectionProps) {

  // Only show bulk actions - no master checkbox or selection info
  return (
    <div className="flex items-center justify-end gap-2">
      <Badge variant="secondary" className="text-xs">
        {selectedTransactions.size} selected
      </Badge>
      
      <Button
        variant="destructive"
        size="sm"
        className="h-8"
        onClick={onBulkDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </div>
  )
}

// Hook for managing transaction selection state
export function useTransactionSelection() {
  const [selectedTransactions, setSelectedTransactions] = React.useState<Set<string>>(new Set())

  // Clear selection
  const clearSelection = React.useCallback(() => {
    setSelectedTransactions(new Set())
  }, [])

  // Select specific transactions
  const selectTransactions = React.useCallback((ids: string[]) => {
    setSelectedTransactions(new Set(ids))
  }, [])

  // Toggle individual transaction
  const toggleTransaction = React.useCallback((id: string) => {
    setSelectedTransactions(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return newSelected
    })
  }, [])

  // Select all filtered transactions
  const selectAllFiltered = React.useCallback((filteredTransactions: UnifiedTransaction[]) => {
    const allIds = new Set(filteredTransactions.map(t => t.id))
    setSelectedTransactions(allIds)
  }, [])

  // Check if transaction is selected
  const isSelected = React.useCallback((id: string) => {
    return selectedTransactions.has(id)
  }, [selectedTransactions])

  return {
    selectedTransactions,
    setSelectedTransactions,
    clearSelection,
    selectTransactions,
    toggleTransaction,
    selectAllFiltered,
    isSelected,
  }
} 