"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import { getTransactionIcon } from "@/lib/utils/transaction-utils"
import { TransactionBadgeProps } from "@/types/transactions"

/**
 * A badge component that displays a transaction type with appropriate styling and icon
 */
export function TransactionBadge({ type, className }: TransactionBadgeProps) {
  // Get inline styles based on type
  const getInlineStyles = () => {
    switch (type.toLowerCase()) {
      case 'buy':
        return {
          backgroundImage: 'linear-gradient(to right, rgba(247, 147, 26, 0.9), rgba(247, 147, 26, 0.7))',
          borderColor: 'rgba(247, 147, 26, 0.4)',
          color: 'white'
        };
      case 'sell':
        return {
          backgroundImage: 'linear-gradient(to right, rgba(239, 68, 68, 0.9), rgba(248, 113, 113, 0.7))',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          color: 'white'
        };
      case 'deposit':
        return {
          backgroundImage: 'linear-gradient(to right, rgba(34, 197, 94, 0.9), rgba(74, 222, 128, 0.7))',
          borderColor: 'rgba(34, 197, 94, 0.4)',
          color: 'white'
        };
      case 'withdrawal':
        return {
          backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.7))',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          color: 'white'
        };
      default:
        return {};
    }
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-[100px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none px-2 gap-1",
        className
      )}
      style={getInlineStyles()}
    >
      {getTransactionIcon(type)}
      {type.toUpperCase()}
    </Badge>
  )
} 