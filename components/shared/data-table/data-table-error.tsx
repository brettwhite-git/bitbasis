import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DataTableErrorProps {
  colSpan: number
  message?: string
  onRetry?: () => void
}

/**
 * Component to display when an error occurs loading data in a table
 */
export function DataTableError({
  colSpan,
  message = "An error occurred while loading data.",
  onRetry
}: DataTableErrorProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center"
      >
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-2">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {message}
          </p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
} 