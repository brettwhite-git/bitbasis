"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/utils"
import { isShortTerm, getTermStyles } from "@/lib/utils/transaction-utils"
import { TermBadgeProps } from "@/types/transactions"

/**
 * A badge component that displays whether a transaction is short-term or long-term
 */
export function TermBadge({ date, currentDate, className }: TermBadgeProps) {
  const shortTerm = isShortTerm(date, currentDate)
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-[70px] inline-flex items-center justify-center",
        getTermStyles(shortTerm),
        className
      )}
    >
      {shortTerm ? "SHORT" : "LONG"}
    </Badge>
  )
} 