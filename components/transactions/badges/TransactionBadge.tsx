"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import { getTransactionIcon, getTransactionTypeStyles } from "@/lib/utils/transaction-utils"
import { TransactionBadgeProps } from "@/types/transactions"

/**
 * A badge component that displays a transaction type with appropriate styling and icon
 */
export function TransactionBadge({ type, className }: TransactionBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-[125px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none",
        getTransactionTypeStyles(type),
        className
      )}
    >
      {getTransactionIcon(type)}
      {type.toUpperCase()}
    </Badge>
  )
} 