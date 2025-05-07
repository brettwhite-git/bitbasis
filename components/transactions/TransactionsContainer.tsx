"use client"

import React from "react"
import { TransactionsTable } from "./TransactionsTable"

interface TransactionsContainerProps {
  currentDateISO: string
}

/**
 * Main container component for the transactions page
 */
export function TransactionsContainer({
  currentDateISO
}: TransactionsContainerProps) {
  return (
    <div className="space-y-4">
      <TransactionsTable
        currentDateISO={currentDateISO}
        paginationContainerId="pagination-container"
        transactionCountContainerId="transaction-count-container"
      />
    </div>
  )
} 