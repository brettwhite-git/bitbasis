"use client"

import { useEffect, useState } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { DateRange } from "react-day-picker"

// Import custom hooks
import { useTransactions } from "@/hooks/useTransactions"
import { useTransactionFilters } from "@/hooks/useTransactionFilters"
import { useTransactionSorting } from "@/hooks/useTransactionSorting"
import { useTransactionSelection } from "@/hooks/useTransactionSelection"
import { useIsMobile } from "@/hooks/use-mobile"

// Import components
import { UnifiedFilterDropdown } from "@/components/transactions/filters/UnifiedFilterDropdown"
import { TransactionHeaders } from "@/components/transactions/table/TransactionHeaders"
import { TransactionRow } from "@/components/transactions/table/TransactionRow"
import { TransactionsMobileView } from "@/components/transactions/table/TransactionsMobileView"
import { TransactionsPagination } from "@/components/transactions/table/TransactionsPagination"
import { DeleteDialog } from "@/components/transactions/dialogs/DeleteDialog"
import { SuccessDialog } from "@/components/transactions/dialogs/SuccessDialog"
import { DataTableEmpty } from "@/components/shared/data-table/DataTableEmpty"
import { DataTableLoading } from "@/components/shared/data-table/DataTableLoading"
import { DataTableError } from "@/components/shared/data-table/DataTableError"
import { Button } from "@/components/ui/button"
import { Trash2, PlusCircle, FileDown } from "lucide-react"

// Import types
import { TransactionsTableProps } from "@/types/transactions"

// Import the new ImportExportModal
import { ImportExportModal } from "@/components/transactions/dialogs/ImportExportModal"

/**
 * The main transactions table component that displays transaction data
 * 
 * This component renders a complete transactions table with:
 * - Filters for searching, date range, transaction type, term and exchange
 * - Sortable column headers
 * - Paginated transaction rows
 * - Selection functionality for batch operations
 * - Export to CSV capability
 * - Delete functionality
 * - Responsive design with dedicated mobile view
 * 
 * @param {string} currentDateISO - The current date in ISO format for calculating short/long term
 */
export function TransactionsTable({ 
  currentDateISO
}: TransactionsTableProps) {
  // Check if we're on mobile
  const isMobile = useIsMobile()
  
  // State for managing various modal dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [importExportOpen, setImportExportOpen] = useState(false)
  
  // Parse the current date from the ISO string
  const currentDate = new Date(currentDateISO)
  
  // Custom hooks for data fetching, filtering, sorting, and selection
  const { transactions, isLoading, error, refetch } = useTransactions()
  const { 
    filters, 
    filteredTransactions, 
    uniqueExchanges,
    setSearchQuery,
    setDateRange,
    setTypeFilter,
    setTermFilter,
    setExchangeFilter,
    resetFilters
  } = useTransactionFilters(transactions)
  const { sortConfig, sortedTransactions, handleSort } = useTransactionSorting(filteredTransactions)
  const { 
    selectedTransactions,
    toggleSelection,
    toggleSelectAll,
    areAllSelected,
    clearSelections,
    selectedCount
  } = useTransactionSelection()
  
  // Calculate pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  )
  
  // Prepare transaction count text
  const transactionCountText = filteredTransactions.length === transactions.length
    ? `Showing ${transactions.length} Total Transactions`
    : `Showing ${filteredTransactions.length} / ${transactions.length} Total Transactions`;
  
  /**
   * Deletes all selected transactions
   * 
   * Sends a request to the API to delete all transactions that are currently
   * selected. Shows a success dialog on success, or an error message on failure.
   */
  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    const transactionIdsToDelete = Array.from(selectedTransactions);

    try {
      const response = await fetch('/api/transactions/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionIds: transactionIdsToDelete }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.message || 'Failed to delete transactions.';
        // @notice: Keep this error log for debugging API responses
        console.error('API returned error:', result);
        setDeleteError(`${errorMsg}${result.errors ? ` Details: ${JSON.stringify(result.errors)}` : ''}`);
      } else {
        // Success case - no need to log to console
        setSuccessMessage(result.message);
        setSuccessDialogOpen(true);
        
        // Clear selection and close delete confirmation dialog
        clearSelections();
        setDeleteDialogOpen(false);
        
        // Refetch data to update the table
        await refetch();
      }
    } catch (error: any) {
      // @notice: Keep this error log for exception debugging
      console.error('Exception during API call:', error);
      setDeleteError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsDeleting(false);
    }
  }
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortConfig])
  
  // Add a handleAddTransaction function
  const handleAddTransaction = () => {
    // TODO: Implement add transaction functionality
    console.log("Add transaction clicked")
  }
  
  // Update the actionButtons to show the modal
  const actionButtons = (
    <div className="flex items-center gap-2 sm:gap-4">
      <Button
        variant="default"
        size="sm"
        onClick={handleAddTransaction}
        className="flex items-center gap-1"
      >
        <PlusCircle className="h-4 w-4" />
        <span>Add Transaction</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setImportExportOpen(true)}
        disabled={isLoading}
        className="flex items-center gap-1 whitespace-nowrap"
      >
        <FileDown className="h-4 w-4" />
        <span>Import/Export</span>
      </Button>
    </div>
  )
  
  const filterSection = (
    <div className="flex items-center gap-2">
      <UnifiedFilterDropdown
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={filters.dateRange as DateRange | undefined}
        onDateRangeChange={setDateRange}
        typeFilter={filters.typeFilter}
        onTypeFilterChange={setTypeFilter}
        termFilter={filters.termFilter}
        onTermFilterChange={setTermFilter}
        exchangeFilter={filters.exchangeFilter}
        onExchangeFilterChange={setExchangeFilter}
        exchanges={uniqueExchanges}
        onReset={resetFilters}
      />
      
      {selectedCount > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="flex items-center gap-1"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete ({selectedCount})</span>
        </Button>
      )}
    </div>
  )
  
  const paginationSection = !isLoading && !error && paginatedTransactions.length > 0 && (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground whitespace-nowrap pl-2">{transactionCountText}</span>
      <TransactionsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        disabled={isLoading}
      />
    </div>
  )
  
  const dialogsSection = (
    <>
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteSelected}
        isDeleting={isDeleting}
        count={selectedCount}
        error={deleteError}
      />
      
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        message={successMessage}
      />
      
      <ImportExportModal
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
        transactions={transactions}
        onImportSuccess={(count) => {
          setSuccessMessage(`Successfully imported ${count} transactions.`);
          setSuccessDialogOpen(true);
          refetch();
        }}
      />
    </>
  )
  
  // Render the component based on device size
  return (
    <div className="space-y-4">
      {isMobile ? (
        // Mobile View
        <>
          <div className="flex items-center justify-between">
            {filterSection}
          </div>
          
          <div className="flex justify-end items-center">
            {actionButtons}
          </div>
          
          <TransactionsMobileView
            transactions={paginatedTransactions}
            isLoading={isLoading}
            error={error}
            selectedTransactions={selectedTransactions}
            toggleSelection={toggleSelection}
            currentDate={currentDate}
            onRetry={refetch}
          />
          
          {paginationSection}
        </>
      ) : (
        // Desktop View
        <>
          <div className="flex items-center justify-between">
            {filterSection}
            {actionButtons}
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TransactionHeaders
                sortConfig={sortConfig}
                onSort={handleSort}
                areAllSelected={areAllSelected(paginatedTransactions)}
                onSelectAll={() => toggleSelectAll(paginatedTransactions)}
                hasTransactions={paginatedTransactions.length > 0}
              />
              <TableBody>
                {isLoading ? (
                  <DataTableLoading colSpan={11} />
                ) : error ? (
                  <DataTableError 
                    colSpan={11} 
                    message={`Error: ${error}`}
                    onRetry={refetch}
                  />
                ) : paginatedTransactions.length === 0 ? (
                  <DataTableEmpty 
                    colSpan={11} 
                    message="No transactions found matching your filters."
                    action={
                      filters.searchQuery || filters.dateRange || 
                      filters.typeFilter !== "all" || filters.termFilter !== "all" || 
                      filters.exchangeFilter !== "all" ? (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Clear Filters
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  paginatedTransactions.map(transaction => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedTransactions.has(transaction.id)}
                      onSelect={toggleSelection}
                      currentDate={currentDate}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {paginationSection}
        </>
      )}
      
      {dialogsSection}
    </div>
  )
} 