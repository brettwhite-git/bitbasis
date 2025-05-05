"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Download, Loader2 } from "lucide-react"

interface TransactionsActionsProps {
  onExport: () => void
  onDelete: () => void
  selectedCount: number
  isExporting: boolean
  disabled?: boolean
}

/**
 * Component that provides export and delete actions for transactions
 */
export function TransactionsActions({
  onExport,
  onDelete,
  selectedCount,
  isExporting,
  disabled = false
}: TransactionsActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={disabled || isExporting}
        className="h-8"
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={disabled || selectedCount === 0}
        className={`h-8 ${selectedCount > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 border-red-200 dark:border-red-800" : ""}`}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
        {selectedCount > 0 && ` (${selectedCount})`}
      </Button>
    </div>
  )
} 