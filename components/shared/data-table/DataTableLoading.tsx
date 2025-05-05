import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface DataTableLoadingProps {
  colSpan: number
  message?: string
}

/**
 * Component to display while data is loading in a table
 */
export function DataTableLoading({
  colSpan,
  message = "Loading data..."
}: DataTableLoadingProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center"
      >
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
} 