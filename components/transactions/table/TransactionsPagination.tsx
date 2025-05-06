"use client"

import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(currentPage - 1)
            }}
            className={disabled || currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(page as number)
                }}
                isActive={currentPage === page}
                className={disabled ? "pointer-events-none" : ""}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(currentPage + 1)
            }}
            className={disabled || currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
} 