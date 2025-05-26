"use client"

import React, { useEffect, useState } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { DateRange } from "react-day-picker"

// Import custom hooks
import { useTransactions } from "@/lib/hooks/useTransactions"
import { useTransactionFilters } from "@/lib/hooks/useTransactionFilters"
import { useTransactionSorting } from "@/lib/hooks/useTransactionSorting"
import { useTransactionSelection } from "@/lib/hooks/useTransactionSelection"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"

// Import components
import { UnifiedFilterDropdown } from "@/components/transactions/filters/UnifiedFilterDropdown"
import { TransactionHeaders } from "@/components/transactions/table/TransactionHeaders"
import { TransactionRow } from "@/components/transactions/table/TransactionRow"
import { TransactionsMobileView } from "@/components/transactions/table/TransactionsMobileView"
import { TransactionsPagination } from "@/components/transactions/table/TransactionsPagination"
import { DeleteDialog } from "@/components/transactions/dialogs/DeleteDialog"
import { DataTableEmpty } from "@/components/shared/data-table/DataTableEmpty"
import { DataTableLoading } from "@/components/shared/data-table/DataTableLoading"
import { DataTableError } from "@/components/shared/data-table/DataTableError"
import { Button } from "@/components/ui/button"
import { Trash2, Upload, Ghost } from "lucide-react"
import { TransactionsActions } from "@/components/transactions/actions/TransactionsActions"
import { TransactionFormValues } from "@/components/transactions/dialogs/AddTransactionDialog"

// Import types
import { TransactionsTableProps } from "@/types/transactions"

// Import modals
import { ImportModal } from "@/components/transactions/dialogs/import/ImportModal"
import { TransactionCountDisplay } from "@/components/subscription/TransactionCountDisplay"
import { useSubscription } from "@/hooks/use-subscription"

/**
 * The main transactions table component that displays transaction data
 * 
 * This component renders a complete transactions table with:
 * - Filters for searching, date range, transaction type, term and exchange
 * - Sortable column headers
 * - Paginated transaction rows
 * - Selection functionality for batch operations
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
  const { toast } = useToast()
  const { subscriptionInfo, loading: subscriptionLoading } = useSubscription()
  
  // State for managing various modal dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  
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
   * selected. Shows a success toast on success, or an error message on failure.
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
        // Success case - show toast notification
        toast({
          title: "Success!",
          description: result.message,
          variant: "default",
        });
        
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
  
  /**
   * Handles adding new transactions
   */
  const handleAddTransactions = async (transactions: TransactionFormValues[]) => {
    try {
      const response = await fetch('/api/transactions/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add transactions');
      }

      // Refetch the transactions
      await refetch();

      // Return success
      return result;
    } catch (error: any) {
      console.error('Error adding transactions:', error);
      throw error;
    }
  }
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortConfig])
  
  // Handle import success
  const handleImportSuccess = async (count: number) => {
    // Show toast for import success
    toast({
      title: "Import Successful",
      description: `Successfully imported ${count} transactions.`,
      variant: "success" as any,
    });
    
    await refetch();
  }
  
  // Check if user can import transactions
  const canImportTransactions = React.useMemo(() => {
    if (subscriptionLoading || !subscriptionInfo) return false
    
    // Pro users can always import
    if (subscriptionInfo.subscription_status === 'active' || subscriptionInfo.subscription_status === 'trialing') {
      return true
    }
    
    // Free users can import if under limit (import validation happens in PreviewStep)
    return subscriptionInfo.can_add_transaction
  }, [subscriptionInfo, subscriptionLoading])

  const handleImportClick = () => {
    if (canImportTransactions) {
      setImportModalOpen(true)
    } else {
      const message = (subscriptionInfo?.transaction_count ?? 0) >= 50 
        ? `You've reached your limit of 50 transactions. Upgrade to Pro for unlimited imports.`
        : 'Unable to import transactions. Please check your subscription status.'
        
      toast({
        title: "Import Blocked",
        description: message,
        variant: "destructive",
        duration: 5000,
      })
    }
  }
  
  // Update the actionButtons to use the simplified TransactionsActions
  const actionButtons = (
    <div className="flex items-center justify-end gap-2">
      <TransactionsActions
        onAddTransactions={handleAddTransactions}
        disabled={isLoading}
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleImportClick}
        disabled={isLoading || subscriptionLoading}
        className="h-9 flex items-center justify-center bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/60 hover:to-gray-600/60 border-gray-600/50"
      >
        <div className="flex items-center justify-center">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Import</span>
        </div>
      </Button>
    </div>
  )
  
  const filterSection = (
    <div className="flex items-center gap-4">
      <UnifiedFilterDropdown
        searchQuery={filters.searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={filters.dateRange as DateRange | undefined}
        onDateRangeChange={setDateRange}
        typeFilter={filters.typeFilter}
        onTypeFilterChange={setTypeFilter}
        termFilter={filters.termFilter}
        onTermFilterChange={setTermFilter}
        exchanges={uniqueExchanges}
        exchangeFilter={filters.exchangeFilter}
        onExchangeFilterChange={setExchangeFilter}
        onReset={resetFilters}
      />
      
      {/* Transaction count display - only show for free users */}
      {!subscriptionLoading && subscriptionInfo && 
       subscriptionInfo.subscription_status !== 'active' && 
       subscriptionInfo.subscription_status !== 'trialing' && (
        <>
          {/* Desktop */}
          <div className="hidden sm:flex items-center px-3 py-2 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-700/50">
            <TransactionCountDisplay showProgress={true} />
          </div>
          
          {/* Mobile */}
          <div className="flex sm:hidden items-center px-2 py-1 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm rounded text-xs border border-gray-700/50">
            <TransactionCountDisplay showProgress={false} />
          </div>
        </>
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
        error={deleteError}
        count={selectedCount}
      />
      
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={handleImportSuccess}
      />
    </>
  )
  
  // Render the component based on device size
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {filterSection}
        {actionButtons}
      </div>

      {/* Handle loading, error, and empty states */}
      {isLoading ? (
        <DataTableLoading colSpan={7} />
      ) : error ? (
        <DataTableError message={error} onRetry={refetch} colSpan={7} />
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-gray-800/30 via-gray-900/40 to-gray-800/30 p-3 mb-2">
              <Ghost className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {transactions.length === 0
                ? "No transactions found. Import transactions to get started."
                : "No transactions match your filters."
            }
            </p>
            {transactions.length === 0 ? (
              <Button onClick={() => setImportModalOpen(true)}>
                Import Transactions
              </Button>
            ) : (
              <Button onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Delete selected button - shown when transactions are selected */}
          {selectedCount > 0 && (
            <div className="bg-gradient-to-br from-gray-800/40 via-gray-900/50 to-gray-800/40 backdrop-blur-sm p-3 px-4 rounded-xl flex items-center border border-gray-700/50">
              <span className="text-sm font-medium text-white">
                {selectedCount} {selectedCount === 1 ? 'transaction' : 'transactions'} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-1 ml-4"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected</span>
              </Button>
            </div>
          )}

          {/* Desktop view */}
          {!isMobile && (
            <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <Table>
                <TransactionHeaders
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  areAllSelected={areAllSelected(paginatedTransactions)}
                  onSelectAll={() => toggleSelectAll(paginatedTransactions)}
                  hasTransactions={paginatedTransactions.length > 0}
                />
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedTransactions.has(transaction.id)}
                      onSelect={() => toggleSelection(transaction.id)}
                      currentDate={currentDate}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile view */}
          {isMobile && (
            <TransactionsMobileView
              transactions={paginatedTransactions}
              isLoading={false}
              error={null}
              selectedTransactions={selectedTransactions}
              toggleSelection={toggleSelection}
              currentDate={currentDate}
              onRetry={refetch}
            />
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-end">
            <TransactionsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            </div>
          )}
        </>
      )}
      
      {dialogsSection}
    </div>
  )
} 