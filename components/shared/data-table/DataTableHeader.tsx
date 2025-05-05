"use client"

import React from "react"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ColumnConfig<T> {
  key: string
  label: string
  className?: string
  sortable?: boolean
  renderHeader?: (column: ColumnConfig<T>) => React.ReactNode
}

export interface SortConfig {
  key: string
  direction: "asc" | "desc" | null
}

interface DataTableHeaderProps<T> {
  columns: ColumnConfig<T>[]
  sortConfig?: SortConfig
  onSort?: (key: string) => void
  className?: string
}

/**
 * A reusable table header component with sorting functionality
 */
export function DataTableHeader<T>({
  columns,
  sortConfig,
  onSort,
  className,
}: DataTableHeaderProps<T>) {
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />
    }
    
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  return (
    <TableHeader className={cn("bg-muted/50", className)}>
      <TableRow>
        {columns.map((column) => (
          <TableHead
            key={column.key}
            className={cn(
              "font-semibold text-xs uppercase tracking-wider",
              column.className
            )}
          >
            {column.renderHeader ? (
              column.renderHeader(column)
            ) : column.sortable && onSort ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 data-[state=open]:bg-accent"
                onClick={() => onSort(column.key)}
              >
                <span>{column.label}</span>
                {getSortIcon(column.key)}
              </Button>
            ) : (
              <span>{column.label}</span>
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
} 