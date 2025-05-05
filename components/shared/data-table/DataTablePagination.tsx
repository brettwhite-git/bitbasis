"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react"

interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onExport?: () => void
  isExporting?: boolean
  showExport?: boolean
  disabled?: boolean
}

/**
 * A reusable pagination component for data tables
 */
export function DataTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  onExport,
  isExporting = false,
  showExport = false,
  disabled = false
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm whitespace-nowrap">
          Page {currentPage} of {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0 || disabled}
        >
          <ChevronRight className="h-4 w-6" />
        </Button>
      </div>
      
      {showExport && onExport && (
        <Button 
          variant="outline" 
          size="icon" 
          className="shrink-0"
          onClick={onExport}
          disabled={isExporting || disabled}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
} 