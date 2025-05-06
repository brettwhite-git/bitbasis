"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import { isShortTerm } from "@/lib/utils/transaction-utils"
import { TermBadgeProps } from "@/types/transactions"

/**
 * A badge component that displays whether a transaction is short-term or long-term
 */
export function TermBadge({ date, currentDate, className }: TermBadgeProps) {
  const shortTerm = isShortTerm(date, currentDate)
  
  // Get inline styles based on term
  const getInlineStyles = () => {
    return shortTerm
      ? {
          borderColor: 'rgb(168, 85, 247)', // purple-500
          color: 'rgb(168, 85, 247)'
        }
      : {
          borderColor: 'rgb(34, 197, 94)', // green-500
          color: 'rgb(34, 197, 94)'
        };
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-[70px] inline-flex items-center justify-center",
        className
      )}
      style={getInlineStyles()}
    >
      {shortTerm ? "SHORT" : "LONG"}
    </Badge>
  )
} 