"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import { getTransactionIcon } from "@/lib/utils/transaction-utils"
import { TransactionBadgeProps } from "@/types/transactions"

/**
 * A badge component that displays a transaction type with appropriate styling and icon
 */
export function TransactionBadge({ type, className }: TransactionBadgeProps) {
  // Get inline styles based on type - modern dark theme with glowing edges
  const getInlineStyles = () => {
    switch (type.toLowerCase()) {
      case 'buy':
        return {
          backgroundColor: 'rgba(247, 147, 26, 0.05)',
          borderColor: 'rgba(247, 147, 26, 0.4)',
          color: 'rgba(247, 147, 26, 0.85)',
          boxShadow: '0 0 8px rgba(247, 147, 26, 0.05)'
        };
      case 'sell':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          color: 'rgba(239, 68, 68, 0.85)',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.05)'
        };
      case 'deposit':
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          borderColor: 'rgba(34, 197, 94, 0.4)',
          color: 'rgba(34, 197, 94, 0.85)',
          boxShadow: '0 0 8px rgba(34, 197, 94, 0.05)'
        };
      case 'withdrawal':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          color: 'rgba(59, 130, 246, 0.85)',
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.05)'
        };
      case 'interest':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          borderColor: 'rgba(168, 85, 247, 0.4)',
          color: 'rgba(168, 85, 247, 0.85)',
          boxShadow: '0 0 8px rgba(168, 85, 247, 0.05)'
        };
      default:
        return {};
    }
  };

  // Capitalize first letter only
  const formatText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center justify-center rounded-full border shadow-sm transition-all duration-200 px-3 py-1 gap-1.5 font-medium text-sm",
        className
      )}
      style={getInlineStyles()}
    >
      {getTransactionIcon(type)}
      {formatText(type)}
    </Badge>
  )
} 