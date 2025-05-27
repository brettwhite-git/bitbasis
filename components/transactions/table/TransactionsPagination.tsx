"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface TransactionsPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function TransactionsPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false
}: TransactionsPaginationProps) {
  const handlePageChange = (page: number) => {
    if (disabled) return
    if (page < 1 || page > totalPages) return
    onPageChange(page)
  }

  // Generate array of pages to show
  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = []
    
    if (totalPages <= 7) {
      // If we have 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)
      
      // Show ellipsis if current page is more than 3
      if (currentPage > 3) {
        pageNumbers.push('ellipsis')
      }
      
      // Calculate start and end of middle section
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Ensure we show at least 3 pages in the middle
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1)
      }
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3)
      }
      
      // Add the middle section pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }
      
      // Show ellipsis if current page is less than totalPages - 2
      if (currentPage < totalPages - 2) {
        pageNumbers.push('ellipsis')
      }
      
      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  if (totalPages <= 1) {
    return null // Hide pagination if only one page
  }

  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className="gap-1 pl-2.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <span className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More pages</span>
              </span>
            ) : (
              <Button
                variant={currentPage === page ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                disabled={disabled}
                className="h-9 w-9 p-0"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className="gap-1 pr-2.5"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 