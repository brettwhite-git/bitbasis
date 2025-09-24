"use client"

import React, { useEffect, useState } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Ghost, Upload } from "lucide-react"
import { toast } from 'sonner'

// Import hooks that we'll need
import { useIsMobile } from "@/lib/hooks"

// Import existing components we can reuse
import { DataTableLoading } from "@/components/shared/data-table/data-table-loading"
import { DataTableError } from "@/components/shared/data-table/data-table-error"

// Import our new extracted components (local to table folder)
import { 
  TransactionFilters, 
  useTransactionFilters,
  type FilterCounts 
} from "./transaction-filters"
import { 
  TransactionSelection,
  useTransactionSelection 
} from "./transaction-selection"
import { 
  TransactionPagination,
  useTransactionPagination 
} from "./transaction-pagination"

// Import existing components from local table folder
import { TransactionHeaders } from "./transaction-headers"
import { TransactionRow } from "./transaction-row"
import { TransactionMobileView } from "./transaction-mobile-view"

// Import the wizard from its new location
import { AddTransactionWizard } from "../forms/wizard"

// Import the import wizard from the new organized location
import { ImportWizard } from "../import"

// Import utilities
import { UnifiedTransaction } from '@/types/transactions'
import { DateRange } from "react-day-picker"

// Import confirmation dialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Types
interface SortConfig {
  column: keyof UnifiedTransaction
  direction: 'asc' | 'desc'
}

export function TransactionTable() {
  // Core data state
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'date', direction: 'desc' })

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([])

  // Hooks for extracted functionality
  const isMobile = useIsMobile()
  const filterUtils = useTransactionFilters()
  const selectionState = useTransactionSelection()
  const paginationState = useTransactionPagination(20)

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionsToDelete, setTransactionsToDelete] = useState<string[]>([])

  // Import wizard state
  const [importWizardOpen, setImportWizardOpen] = useState(false)

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/transaction-history')
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchTransactions()
  }, [])

  // Handle import success
  const handleImportSuccess = (count: number) => {
    toast.success("Import Complete", {
      description: `Successfully imported ${count} transaction${count === 1 ? '' : 's'}`,
    })
    fetchTransactions()
    setImportWizardOpen(false)
  }

  // Apply filters using our extracted utility
  const filteredTransactions = React.useMemo(() => {
    return filterUtils.applyFilters(
      transactions,
      searchQuery,
      dateRange,
      selectedTypes,
      selectedTerms,
      selectedExchanges
    )
  }, [transactions, searchQuery, dateRange, selectedTypes, selectedTerms, selectedExchanges, filterUtils])

  // Get unique exchanges and filter counts using our extracted utilities
  const exchanges = React.useMemo(() => {
    return filterUtils.getUniqueExchanges(transactions)
  }, [transactions, filterUtils])

  const filterCounts: FilterCounts = React.useMemo(() => {
    return filterUtils.calculateFilterCounts(transactions)
  }, [transactions, filterUtils])

  // Sorting logic
  const sortedTransactions = React.useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortConfig.column]
      const bValue = b[sortConfig.column]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
    return sorted
  }, [filteredTransactions, sortConfig])

  // Get paginated data using our extracted utility
  const paginatedTransactions = paginationState.getPaginatedData(sortedTransactions)

  // Debug pagination state
  console.log('Pagination Debug:', {
    currentPage: paginationState.currentPage,
    itemsPerPage: paginationState.itemsPerPage,
    totalTransactions: transactions.length,
    filteredTransactions: filteredTransactions.length,
    sortedTransactions: sortedTransactions.length,
    paginatedTransactions: paginatedTransactions.length,
    totalPages: Math.ceil(sortedTransactions.length / paginationState.itemsPerPage)
  })

  // Reset filters function
  const resetFilters = () => {
    setSearchQuery("")
    setDateRange(undefined)
    setSelectedTypes([])
    setSelectedTerms([])
    setSelectedExchanges([])
    paginationState.resetToFirstPage()
  }

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (dateRange?.from || dateRange?.to) count++
    if (selectedTypes.length > 0) count++
    if (selectedTerms.length > 0) count++
    if (selectedExchanges.length > 0) count++
    return count
  }, [searchQuery, dateRange, selectedTypes, selectedTerms, selectedExchanges])

  // Reset page when filters change
  useEffect(() => {
    paginationState.resetToFirstPage()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateRange, selectedTypes, selectedTerms, selectedExchanges])

  // Auto-adjust page if needed
  useEffect(() => {
    paginationState.adjustPageIfNeeded(sortedTransactions.length)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedTransactions.length])

  // Handlers
  const handleSort = (column: keyof UnifiedTransaction) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Delete functions
  const deleteTransactions = async (transactionIds: string[]) => {
    if (transactionIds.length === 0) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/transaction-history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionIds
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transactions')
      }

      const deletedCount = result.deletedCount ?? transactionIds.length

      toast.success("Transactions Deleted", {
        description: `Successfully deleted ${deletedCount} transaction${deletedCount === 1 ? '' : 's'}`,
      })

      // Clear selection and refresh data
      selectionState.clearSelection()
      fetchTransactions()

    } catch (err) {
      console.error('Error deleting transactions:', err)
      toast.error("Delete Failed", {
        description: err instanceof Error ? err.message : 'Failed to delete transactions',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTransactionsToDelete([])
    }
  }

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectionState.selectedTransactions) as string[]
    setTransactionsToDelete(idsToDelete)
    setDeleteDialogOpen(true)
  }

  const handleSingleDelete = async (transactionId: string) => {
    setTransactionsToDelete([transactionId])
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    await deleteTransactions(transactionsToDelete)
  }

  // Action buttons
  const actionButtons = (
    <div className="flex items-center justify-end gap-2">
      {/* Add Transaction Wizard */}
      <AddTransactionWizard onTransactionsAdded={fetchTransactions} />
      
      {/* Import Button */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 flex items-center justify-center bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50"
        onClick={() => setImportWizardOpen(true)}
      >
        <div className="flex items-center justify-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </div>
      </Button>
    </div>
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Table>
            <TableBody>
              <DataTableLoading message="Loading transactions..." colSpan={10} />
            </TableBody>
          </Table>
        </div>

        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Table>
            <TableBody>
              <DataTableError message={error} onRetry={fetchTransactions} colSpan={10} />
            </TableBody>
          </Table>
        </div>

        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  // Empty state
  if (transactions.length === 0) {
    // Get filter components
    const filterComponents = TransactionFilters({
      searchQuery,
      setSearchQuery,
      dateRange,
      setDateRange,
      selectedTypes,
      setSelectedTypes,
      selectedTerms,
      setSelectedTerms,
      selectedExchanges,
      setSelectedExchanges,
      exchanges,
      filterCounts,
      activeFiltersCount,
      resetFilters,
    })

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Left side: Search input and filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {filterComponents.searchInput}
            {filterComponents.filterControls}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2">
            {actionButtons}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-gray-800/30 via-gray-900/40 to-gray-800/30 p-3 mb-2">
              <Ghost className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              No transactions found.
            </p>
            <p className="text-xs text-gray-500">
              Start by adding transactions or importing from an exchange.
            </p>
          </div>
        </div>

        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  // No filtered results
  if (sortedTransactions.length === 0) {
    // Get filter components
    const filterComponents = TransactionFilters({
      searchQuery,
      setSearchQuery,
      dateRange,
      setDateRange,
      selectedTypes,
      setSelectedTypes,
      selectedTerms,
      setSelectedTerms,
      selectedExchanges,
      setSelectedExchanges,
      exchanges,
      filterCounts,
      activeFiltersCount,
      resetFilters,
    })

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Left side: Search input and filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {filterComponents.searchInput}
            {filterComponents.filterControls}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2">
            {actionButtons}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-gray-800/30 via-gray-900/40 to-gray-800/30 p-3 mb-2">
              <Ghost className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              No transactions match your current filters.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetFilters}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  // Get filter components
  const filterComponents = TransactionFilters({
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    selectedTypes,
    setSelectedTypes,
    selectedTerms,
    setSelectedTerms,
    selectedExchanges,
    setSelectedExchanges,
    exchanges,
    filterCounts,
    activeFiltersCount,
    resetFilters,
  })

  return (
    <div className="space-y-4">
      {/* Top row with search, filters, and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Left side: Search input and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {filterComponents.searchInput}
          {filterComponents.filterControls}
        </div>

        {/* Right side: Action buttons with delete button when selected */}
        <div className="flex items-center gap-2">
          {selectionState.selectedTransactions.size > 0 && (
            <TransactionSelection
              selectedTransactions={selectionState.selectedTransactions}
              onBulkDelete={handleBulkDelete}
            />
          )}
          {actionButtons}
        </div>
      </div>

      {/* Desktop view */}
      {!isMobile && (
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Table>
            <TransactionHeaders
              sortConfig={sortConfig}
              onSort={handleSort}
              areAllSelected={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectionState.selectedTransactions.has(String(t.id)))}
              onSelectAll={() => {
                if (paginatedTransactions.every(t => selectionState.selectedTransactions.has(String(t.id)))) {
                  // Deselect all on current page
                  paginatedTransactions.forEach(t => selectionState.toggleTransaction(String(t.id)))
                } else {
                  // Select all on current page
                  paginatedTransactions.forEach(t => {
                    if (!selectionState.selectedTransactions.has(String(t.id))) {
                      selectionState.toggleTransaction(String(t.id))
                    }
                  })
                }
              }}
              hasTransactions={paginatedTransactions.length > 0}
            />
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectionState.selectedTransactions.has(String(transaction.id))}
                  onSelect={() => selectionState.toggleTransaction(String(transaction.id))}
                  onDelete={() => handleSingleDelete(String(transaction.id))}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile view */}
      {isMobile && (
        <TransactionMobileView
          transactions={paginatedTransactions}
          selectedTransactions={selectionState.selectedTransactions}
          toggleSelection={selectionState.toggleTransaction}
          onDelete={handleSingleDelete}
        />
      )}

      {/* Pagination */}
      <TransactionPagination
        currentPage={paginationState.currentPage}
        setCurrentPage={paginationState.setCurrentPage}
        itemsPerPage={paginationState.itemsPerPage}
        setItemsPerPage={paginationState.setItemsPerPage}
        totalItems={sortedTransactions.length}
      />

      {/* Confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-gray-800/90 via-gray-900/95 to-gray-800/90 backdrop-blur-md border-gray-700/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Transactions</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete {transactionsToDelete.length} transaction{transactionsToDelete.length === 1 ? '' : 's'}? 
              This action cannot be undone and will permanently remove the transaction data from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Wizard */}
      <ImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
} 