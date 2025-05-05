"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { createRoot } from "react-dom/client"
import Papa from 'papaparse'
import { format } from "date-fns"

// Import custom hooks
import { useTransactions } from "@/hooks/useTransactions"
import { useTransactionFilters } from "@/hooks/useTransactionFilters"
import { useTransactionSorting } from "@/hooks/useTransactionSorting"
import { useTransactionSelection } from "@/hooks/useTransactionSelection"
import { useIsMobile } from "@/hooks/use-mobile"

// Import components
import { TransactionFilters } from "@/components/transactions/filters/TransactionFilters"
import { TransactionHeaders } from "@/components/transactions/table/TransactionHeaders"
import { TransactionRow } from "@/components/transactions/table/TransactionRow"
import { TransactionsMobileView } from "@/components/transactions/table/TransactionsMobileView"
import { DataTablePagination } from "@/components/shared/data-table/DataTablePagination"
import { DeleteDialog } from "@/components/transactions/dialogs/DeleteDialog"
import { SuccessDialog } from "@/components/transactions/dialogs/SuccessDialog"
import { DataTableEmpty } from "@/components/shared/data-table/DataTableEmpty"
import { DataTableLoading } from "@/components/shared/data-table/DataTableLoading"
import { DataTableError } from "@/components/shared/data-table/DataTableError"
import { TransactionsActions } from "@/components/transactions/actions/TransactionsActions"
import { Button } from "@/components/ui/button"

// Import types
import { TransactionsTableProps, UnifiedTransaction } from "@/types/transactions"
import { formatBTC, formatCurrency, formatDate } from "@/lib/utils/format"

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
 * @param {string} paginationContainerId - DOM ID for the container where pagination controls will be rendered
 * @param {string} transactionCountContainerId - DOM ID for the container where the transaction count will be displayed
 */
export function TransactionsTable({ 
  currentDateISO, 
  paginationContainerId,
  transactionCountContainerId 
}: TransactionsTableProps) {
  // Check if we're on mobile
  const isMobile = useIsMobile()
  
  // State for managing various modal dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  
  // Store pagination root in a ref to avoid synchronous unmounting issues
  const paginationRootRef = useRef<any>(null)
  
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
  
  /**
   * Exports all transactions to a CSV file
   * 
   * Creates a CSV file with all transaction data and triggers a download
   * in the user's browser.
   */
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      const csvData = transactions.map(prepareTransactionForCSV)
      
      const csv = Papa.unparse(csvData, {
        quotes: true,
        header: true
      })
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      // @todo: Add user-facing error notification for export failures
      console.error('Failed to export transactions:', error)
    } finally {
      setIsExporting(false)
    }
  }
  
  /**
   * Prepares a transaction object for CSV export
   * 
   * Transforms the unified transaction object into a format suitable for CSV export,
   * including proper formatting for dates, numbers, and currencies.
   * 
   * @param {UnifiedTransaction} transaction - The transaction to format for CSV
   * @returns {Object} A plain object with properly formatted fields for CSV export
   */
  const prepareTransactionForCSV = (transaction: UnifiedTransaction) => {
    return {
      Date: formatDate(transaction.date),
      Type: transaction.type,
      Asset: transaction.asset,
      "Amount (BTC)": formatBTC(transaction.btc_amount, 8, false),
      "Price at Tx (USD)": formatCurrency(transaction.price_at_tx),
      "Value (USD)": formatCurrency(transaction.usd_value),
      "Fees (USD)": formatCurrency(transaction.fee_usd),
      Exchange: transaction.exchange || "-",
      "Fees (BTC)": formatBTC(transaction.network_fee_btc, 8, false),
      "Transaction ID": transaction.txid || "-"
    }
  }
  
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
  
  // Update transaction count container if provided
  useEffect(() => {
    const countContainer = document.getElementById(transactionCountContainerId)
    if (countContainer) {
      if (filteredTransactions.length === transactions.length) {
        countContainer.textContent = `${transactions.length} Total Transactions`
      } else {
        countContainer.textContent = `${filteredTransactions.length} / ${transactions.length} Transactions`
      }
    }
  }, [filteredTransactions.length, transactions.length, transactionCountContainerId])
  
  /**
   * Renders pagination and action controls in the specified container
   * 
   * This effect creates and manages a separate React root in the DOM element
   * specified by paginationContainerId. This approach allows the pagination
   * and action buttons to be rendered in a different part of the page than
   * the main table component.
   */
  useEffect(() => {
    const container = document.getElementById(paginationContainerId);
    if (container) {
      // Use ReactDOM to render the pagination controls
      if (!paginationRootRef.current) {
        try {
          paginationRootRef.current = createRoot(container);
        } catch (e) {
          // @notice: Critical rendering error - keep this log
          console.error("Failed to create React root for pagination:", e); 
          return;
        }
      }
      
      // Check if root still exists before rendering
      if (paginationRootRef.current) {
        try {
          paginationRootRef.current.render(
            <div className="flex items-center gap-2">
              <TransactionsActions
                onExport={handleExport}
                onDelete={() => setDeleteDialogOpen(true)}
                selectedCount={selectedCount}
                isExporting={isExporting}
                disabled={isLoading || transactions.length === 0}
              />
              {!isMobile && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  disabled={isLoading || transactions.length === 0}
                  showExport={false}
                />
              )}
            </div>
          );
        } catch (e) {
          // @notice: Critical rendering error - keep this log
          console.error("Error rendering pagination in container:", e);
        }
      }
    }
    
    // Do nothing here - we'll handle unmount in a separate effect
  }, [currentPage, totalPages, paginationContainerId, isExporting, transactions.length, isLoading, selectedCount, isMobile]);
  
  /**
   * Cleans up the pagination root on component unmount
   * 
   * This separate effect safely unmounts the React root created for pagination
   * when the component unmounts, preventing memory leaks. Using setTimeout helps
   * avoid synchronous unmounting issues.
   */
  useEffect(() => {
    return () => {
      // Safely unmount the root when component unmounts
      if (paginationRootRef.current) {
        // Use setTimeout to defer unmounting slightly
        setTimeout(() => {
          try {
            // Check again inside timeout if it still exists
            if (paginationRootRef.current) { 
              paginationRootRef.current.unmount();
              paginationRootRef.current = null;
            }
          } catch (e) {
            // @notice: Critical unmounting error - keep this log
            console.error("Error unmounting pagination component:", e);
          }
        }, 0);
      }
    };
  }, []);
  
  // Render the mobile view for small screens
  if (isMobile) {
    return (
      <div className="space-y-4">
        <TransactionFilters
          searchQuery={filters.searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={filters.dateRange}
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
        
        <TransactionsMobileView
          transactions={paginatedTransactions}
          isLoading={isLoading}
          error={error}
          selectedTransactions={selectedTransactions}
          toggleSelection={toggleSelection}
          currentDate={currentDate}
          onRetry={refetch}
        />
        
        {!isLoading && !error && paginatedTransactions.length > 0 && (
          <div className="py-3 flex justify-center">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              disabled={isLoading}
              showExport={false}
              size="sm"
            />
          </div>
        )}
        
        {/* Modals */}
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
      </div>
    )
  }
  
  // Render the desktop table view
  return (
    <div className="space-y-4">
      <TransactionFilters
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={filters.dateRange}
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
      
      {/* Modals */}
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
    </div>
  )
} 