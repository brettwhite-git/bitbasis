"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTransactionDialog } from "../dialogs/AddTransactionDialog"
import { TransactionFormValues } from "../dialogs/AddTransactionDialog"

interface TransactionsActionsProps {
  onAddTransactions?: (transactions: TransactionFormValues[]) => Promise<void>
  disabled?: boolean
}

/**
 * Component that provides actions for transactions
 */
export function TransactionsActions({
  onAddTransactions,
  disabled = false
}: TransactionsActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onAddTransactions && (
        <AddTransactionDialog 
          onSubmitTransactions={onAddTransactions}
          triggerButton={
            <Button size="sm" className="h-8">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          }
        />
      )}
    </div>
  )
} 