"use client"

import React, { useEffect } from "react"
import { TransactionsTable } from "./TransactionsTable"
import { TransactionsActions } from "./actions/TransactionsActions"

interface TransactionsContainerProps {
  paginationContainerId: string
  transactionCountContainerId: string
  currentDateISO: string
}

/**
 * Main container component for the transactions page
 */
export function TransactionsContainer({
  paginationContainerId,
  transactionCountContainerId,
  currentDateISO
}: TransactionsContainerProps) {
  // Create header elements for count and pagination
  useEffect(() => {
    // Create transaction count element if it doesn't exist
    let countElement = document.getElementById(transactionCountContainerId)
    if (!countElement) {
      countElement = document.createElement("div")
      countElement.id = transactionCountContainerId
      countElement.className = "text-sm text-muted-foreground"
      
      const parent = document.querySelector("[data-transactions-count]")
      if (parent) {
        parent.appendChild(countElement)
      }
    }
    
    // Create pagination container if it doesn't exist
    let paginationElement = document.getElementById(paginationContainerId)
    if (!paginationElement) {
      paginationElement = document.createElement("div")
      paginationElement.id = paginationContainerId
      
      const parent = document.querySelector("[data-transactions-pagination]")
      if (parent) {
        parent.appendChild(paginationElement)
      }
    }
    
    // Cleanup on unmount
    return () => {
      const countEl = document.getElementById(transactionCountContainerId)
      if (countEl) countEl.remove()
      
      const paginationEl = document.getElementById(paginationContainerId)
      if (paginationEl) paginationEl.remove()
    }
  }, [paginationContainerId, transactionCountContainerId])
  
  return (
    <div className="space-y-4">
      <TransactionsTable
        currentDateISO={currentDateISO}
        paginationContainerId={paginationContainerId}
        transactionCountContainerId={transactionCountContainerId}
      />
    </div>
  )
} 