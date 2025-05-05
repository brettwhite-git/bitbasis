import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Ghost } from "lucide-react"

interface DataTableEmptyProps {
  colSpan: number
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

/**
 * Component displayed when a data table has no data
 */
export function DataTableEmpty({
  colSpan,
  message = "No data available",
  icon,
  action
}: DataTableEmptyProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center"
      >
        <div className="flex flex-col items-center justify-center py-6">
          <div className="rounded-full bg-muted p-3 mb-2">
            {icon || <Ghost className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {message}
          </p>
          {action && (
            <div>{action}</div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
} 