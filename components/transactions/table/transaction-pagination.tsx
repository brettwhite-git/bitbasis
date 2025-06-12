"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface TransactionPaginationProps {
  // Pagination state
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  setItemsPerPage: (items: number) => void
  
  // Data
  totalItems: number
  currentPageItems: number
}

export function TransactionPagination({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  currentPageItems,
}: TransactionPaginationProps) {
  
  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    setItemsPerPage(newItemsPerPage)
    
    // Adjust current page if needed
    const newTotalPages = Math.ceil(totalItems / newItemsPerPage)
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages))
    }
  }



  // Don't render pagination if there's only one page or no items
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {totalItems === 0 ? 'No transactions' : `${totalItems} transaction${totalItems === 1 ? '' : 's'}`}
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px] bg-gray-800 border-gray-600">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-gray-800 border-gray-600">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-2">
      {/* Left: Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} transaction{totalItems === 1 ? '' : 's'}
      </div>

      {/* Right: All controls grouped together */}
      <div className="flex items-center space-x-6">
        {/* Rows per page selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-300">Rows per page</p>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px] bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-gray-800 border-gray-600">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <div className="text-sm font-medium text-gray-300">
          Page {currentPage} of {totalPages}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
          onClick={() => {
            console.log('Going to first page')
            setCurrentPage(1)
          }}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to first page</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="11,17 6,12 11,7"/>
            <polyline points="18,17 13,12 18,7"/>
          </svg>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
          onClick={() => {
            console.log('Going to previous page:', currentPage - 1)
            setCurrentPage(Math.max(1, currentPage - 1))
          }}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to previous page</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
          onClick={() => {
            console.log('Going to next page:', currentPage + 1)
            setCurrentPage(Math.min(totalPages, currentPage + 1))
          }}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Go to next page</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"/>
          </svg>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
          onClick={() => {
            console.log('Going to last page:', totalPages)
            setCurrentPage(totalPages)
          }}
          disabled={currentPage === totalPages}
        >
          <span className="sr-only">Go to last page</span>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="13,17 18,12 13,7"/>
            <polyline points="6,17 11,12 6,7"/>
          </svg>
                 </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing pagination state
export function useTransactionPagination(initialItemsPerPage = 20) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage)

  // Get paginated data
  const getPaginatedData = React.useCallback(<T,>(data: T[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    console.log('getPaginatedData:', { currentPage, itemsPerPage, startIndex, endIndex, totalItems: data.length })
    return data.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage])

  // Get pagination info
  const getPaginationInfo = React.useCallback((totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)
    
    return {
      totalPages,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    }
  }, [currentPage, itemsPerPage])

  // Reset to first page (useful when filters change)
  const resetToFirstPage = React.useCallback(() => {
    console.log('Resetting to first page, current page was:', currentPage)
    setCurrentPage(1)
  }, [currentPage])

  // Auto-adjust page if current page exceeds total pages
  const adjustPageIfNeeded = React.useCallback((totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    console.log('Adjusting page if needed:', { currentPage, totalPages, totalItems, itemsPerPage })
    if (currentPage > totalPages && totalPages > 0) {
      console.log('Adjusting page from', currentPage, 'to', totalPages)
      setCurrentPage(totalPages)
    }
  }, [currentPage, itemsPerPage])

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    getPaginatedData,
    getPaginationInfo,
    resetToFirstPage,
    adjustPageIfNeeded,
  }
} 