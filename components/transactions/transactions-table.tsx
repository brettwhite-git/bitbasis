"use client"

import { useEffect, useState, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Search, SendHorizontal, ArrowUpDown, ArrowDown, ArrowUp, X, Loader2, Trash2, ArrowDownToLine, ArrowUpFromLine, ExternalLink, CheckCircle2, CircleArrowDown, CircleArrowUp, CircleArrowLeft, CircleArrowRight } from "lucide-react"
import { getTransactions } from "@/lib/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { startOfDay, endOfDay, isWithinInterval, format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Define the structure returned by the updated getTransactions
interface UnifiedTransaction {
  id: string; 
  date: string;
  type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal';
  asset: string;
  btc_amount: number | null;
  usd_value: number | null;
  fee_usd: number | null;
  price_at_tx: number | null;
  exchange: string | null;
  network_fee_btc: number | null;
  txid: string | null;
}

// Define props for the component
interface TransactionsTableProps {
  currentDateISO: string;
  paginationContainerId: string;
  transactionCountContainerId: string;
}

type SortConfig = {
  column: keyof UnifiedTransaction | null
  direction: 'asc' | 'desc'
}

export function TransactionsTable({ 
  currentDateISO, 
  paginationContainerId,
  transactionCountContainerId 
}: TransactionsTableProps) {
  // Log the received prop when the component mounts or the prop changes
  /* useEffect(() => {
    console.log("[Client: TransactionsTable] Received currentDateISO prop:", currentDateISO);
  }, [currentDateISO]); */

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]) // <-- Use UnifiedTransaction
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'date', direction: 'desc' })
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const itemsPerPage = 20
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [termFilter, setTermFilter] = useState<string>("all")
  const [exchangeFilter, setExchangeFilter] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false) // State for delete loading
  const [deleteError, setDeleteError] = useState<string | null>(null) // State for delete error
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Store pagination root in a ref to avoid synchronous unmounting issues
  const paginationRootRef = useRef<any>(null);

  // Define fetchTransactions in the component scope
  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null) // Clear previous errors on fetch
    setDeleteError(null) // Clear delete errors too
    try {
      const supabase = createClientComponentClient<Database>()
      
      // Fetch orders and transfers in parallel
      const [ordersResult, transfersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('transfers')
          .select('*')
          .order('date', { ascending: false })
      ])

      if (ordersResult.error) throw ordersResult.error
      if (transfersResult.error) throw transfersResult.error

      // Map orders to unified format
      const mappedOrders = (ordersResult.data || []).map(order => ({
        id: `order-${order.id}`,
        date: order.date,
        type: order.type === 'buy' ? 'Buy' as const : 'Sell' as const,
        asset: order.asset,
        btc_amount: order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount,
        usd_value: order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount,
        fee_usd: order.service_fee,
        price_at_tx: order.price,
        exchange: order.exchange,
        network_fee_btc: null, // Orders don't typically have network fees in BTC
        txid: null // Orders typically don't have txids
      }))

      // Map transfers to unified format
      const mappedTransfers = (transfersResult.data || []).map(transfer => ({
        id: `transfer-${transfer.id}`,
        date: transfer.date,
        type: transfer.type === 'withdrawal' ? 'Withdrawal' as const : 'Deposit' as const,
        asset: transfer.asset,
        btc_amount: transfer.amount_btc,
        usd_value: transfer.amount_fiat,
        fee_usd: transfer.fee_amount_btc ? transfer.fee_amount_btc * (transfer.price || 0) : null,
        price_at_tx: transfer.price,
        exchange: null,
        network_fee_btc: transfer.fee_amount_btc,
        txid: transfer.hash
      }))

      // Combine and sort by date descending
      const allTransactions = [...mappedOrders, ...mappedTransfers].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setTransactions(allTransactions)

      // Update transaction count container if provided
      /* const countContainer = document.getElementById(transactionCountContainerId);
      if (countContainer) {
        countContainer.textContent = `${allTransactions.length} Total Transactions`;
      } */

    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setError(err.message || 'Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Call fetchTransactions on initial mount
    fetchTransactions()
  }, []) // Keep the empty dependency array

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number | null, includeSuffix: boolean = true) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
      ...(includeSuffix && {
        suffix: ' BTC'
      })
    }).format(amount)
  }

  const getTotalFees = (transaction: UnifiedTransaction) => {
    // Use the pre-calculated fee_usd
    return transaction.fee_usd || 0
  }

  const isShortTerm = (date: string) => {
    const transactionDate = new Date(date);
    // Convert the ISO string prop back to a Date object
    const now = new Date(currentDateISO); 
    // Log the date being used for comparison
    // console.log(`[Client: isShortTerm] Comparing ${transactionDate.toISOString()} against one year before ${now.toISOString()}`);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    // Return true if the transaction date is AFTER one year ago (less than 1 year hold)
    return transactionDate > oneYearAgo;
  }

  const getAmount = (transaction: UnifiedTransaction) => {
    // Use the unified btc_amount field
    return transaction.btc_amount || 0
  }

  const getTotal = (transaction: UnifiedTransaction) => {
    // Use the unified usd_value field
    return transaction.usd_value || 0
  }

  const handleSort = (column: keyof UnifiedTransaction) => {
    setSortConfig(currentConfig => ({
      column,
      direction: currentConfig.column === column && currentConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const getSortedTransactions = (transactions: UnifiedTransaction[]) => {
    if (!sortConfig.column) return transactions

    return [...transactions].sort((a, b) => {
      const aValue = a[sortConfig.column!]
      const bValue = b[sortConfig.column!]

      // Handle nulls - sort them to the end or beginning based on direction
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle different types of values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle date strings
      if (sortConfig.column === 'date') {
        const aDate = new Date(aValue as string).getTime()
        const bDate = new Date(bValue as string).getTime()
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Convert to strings for string comparison
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aString.localeCompare(bString)
      }
      return bString.localeCompare(aString)
    })
  }

  const getSortIcon = (column: keyof UnifiedTransaction) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400 ml-1" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary ml-1" />
    )
  }

  const handleClear = () => {
    setSearchQuery("")
    setDateRange(undefined)
    setTypeFilter("all")
    setTermFilter("all")
    setExchangeFilter("all")
    setSortConfig({ column: 'date', direction: 'desc' })
    setCurrentPage(1)
  }

  // Get unique values for filters
  const getUniqueExchanges = () => {
    const exchanges = new Set(transactions.map(t => t.exchange || '-'))
    return Array.from(exchanges).sort()
  }

  // Filter transactions based on all criteria
  const filteredTransactions = transactions.filter((transaction) => {
    // Search query filter
    const matchesSearch = Object.values(transaction).some((value) =>
      value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Date range filter
    let matchesDateRange = true
    if (dateRange?.from || dateRange?.to) {
      const transactionDate = new Date(transaction.date)
      const start = dateRange.from ? startOfDay(dateRange.from) : new Date(0)
      const end = dateRange.to ? endOfDay(dateRange.to) : new Date()
      matchesDateRange = isWithinInterval(transactionDate, { start, end })
    }

    // Type filter
    const matchesType = typeFilter === "all" || transaction.type.toLowerCase() === typeFilter.toLowerCase()

    // Term filter
    const matchesTerm = termFilter === "all" || 
      (termFilter === 'SHORT' && isShortTerm(transaction.date)) ||
      (termFilter === 'LONG' && !isShortTerm(transaction.date))

    // Exchange filter
    const matchesExchange = exchangeFilter === "all" || 
      (exchangeFilter === '-' ? !transaction.exchange : transaction.exchange?.toLowerCase() === exchangeFilter.toLowerCase())

    return matchesSearch && matchesDateRange && matchesType && matchesTerm && matchesExchange
  })

  // Sort filtered transactions
  const sortedTransactions = getSortedTransactions(filteredTransactions)

  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const prepareTransactionForCSV = (transaction: UnifiedTransaction) => {
    return {
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      Asset: transaction.asset,
      "Amount (BTC)": formatBTC(transaction.btc_amount, false), 
      "Price at Tx (USD)": formatCurrency(transaction.price_at_tx),
      "Value (USD)": formatCurrency(transaction.usd_value),
      "Fees (USD)": formatCurrency(transaction.fee_usd),
      Exchange: transaction.exchange || "-",
      "Fees (BTC)": formatBTC(transaction.network_fee_btc, false),
      "Transaction ID": transaction.txid || "-"
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      const Papa = (await import('papaparse')).default
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
      URL.revokeObjectURL(url) // Clean up the URL object
      
    } catch (error) {
      console.error('Failed to export transactions:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === paginatedTransactions.length) {
      // If all current page items are selected, unselect all
      setSelectedTransactions(new Set())
    } else {
      // Select all current page items
      setSelectedTransactions(new Set(paginatedTransactions.map(t => t.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTransactions.size === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    const transactionIdsToDelete = Array.from(selectedTransactions);
    const deletedCount = transactionIdsToDelete.length;

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
        // Handle partial success (207) or full failure
        const errorMsg = result.error || result.message || 'Failed to delete transactions.';
        console.error('Deletion error:', result);
        setDeleteError(`${errorMsg}${result.errors ? ` Details: ${JSON.stringify(result.errors)}` : ''}`);
        // Keep dialog open on error
      } else {
        // Success (200 or potentially 207 if we wanted to treat partial success differently)
        console.log('Deletion successful:', result.message);
        
        // Set success message and open success dialog
        setSuccessMessage(result.message);
        setSuccessDialogOpen(true);
        
        // Clear selection and close delete confirmation dialog
        setSelectedTransactions(new Set());
        setDeleteDialogOpen(false);
        
        // Refetch data to update the table
        try {
          await fetchTransactions(); // Now this call should work
        } catch (fetchError) {
          console.error('Error refreshing transactions after delete:', fetchError);
          // We'll still show success dialog, but log the error
        }
      }
    } catch (error: any) {
      console.error('Error calling delete API:', error);
      setDeleteError(error.message || 'An unexpected error occurred.');
      // Keep dialog open on error
    } finally {
      setIsDeleting(false);
    }
  }

  // Effect to render pagination in the header container
  useEffect(() => {
    const container = document.getElementById(paginationContainerId);
    if (container) {
      const paginationControls = (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-6" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0"
            onClick={handleExport}
            disabled={isExporting || transactions.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      );
      
      // Use ReactDOM to render the pagination controls
      if (!paginationRootRef.current) {
         try {
            // Dynamically import createRoot only on the client
            const { createRoot } = require('react-dom/client');
            paginationRootRef.current = createRoot(container);
         } catch (e) {
             console.error("Failed to create pagination root:", e); 
             return; // Don't proceed if root creation failed
         }
      }
      
      // Check if root still exists before rendering
      if (paginationRootRef.current) {
          try {
            paginationRootRef.current.render(paginationControls);
          } catch (e) {
              console.error("Error rendering pagination controls:", e);
          }
      }
    }
    
    // Cleanup on component unmount, not on every render
    return () => {
      // Do nothing here - we'll handle unmount in a separate effect
    };
  }, [currentPage, totalPages, paginationContainerId, isExporting, transactions.length]);
  
  // Separate effect for cleanup to prevent synchronous unmounting
  useEffect(() => {
    // This will only run when the component is unmounted
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
            console.error("Error unmounting pagination root:", e);
          }
        }, 0);
      }
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading transactions...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500">{error}</p>
        {error.includes('sign in') ? (
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        ) : (
          <Button onClick={() => window.location.reload()}>Retry</Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-grow">
          <div className="relative w-full sm:w-[260px]">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pr-8",
                searchQuery && "border-bitcoin-orange"
              )}
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent hover:text-bitcoin-orange"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
          />
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={cn(
                "w-[120px]",
                typeFilter !== "all" && "border-bitcoin-orange"
              )}>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={termFilter} onValueChange={setTermFilter}>
              <SelectTrigger className={cn(
                "w-[120px]",
                termFilter !== "all" && "border-bitcoin-orange"
              )}>
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="SHORT">Short</SelectItem>
                <SelectItem value="LONG">Long</SelectItem>
              </SelectContent>
            </Select>
            <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
              <SelectTrigger className={cn(
                "w-[140px]",
                exchangeFilter !== "all" && "border-bitcoin-orange"
              )}>
                <SelectValue placeholder="Exchange" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                {getUniqueExchanges().map(exchange => {
                  const displayName = exchange === '-' ? '-' : 
                    exchange.split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                  return (
                    <SelectItem key={exchange} value={exchange.toLowerCase()}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-sm whitespace-nowrap"
          >
            Clear All Filters
          </Button>
          {selectedTransactions.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-sm whitespace-nowrap"
            >
              Delete Selected ({selectedTransactions.size})
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap ml-auto border rounded-md px-7 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
          {filteredTransactions.length === transactions.length 
            ? `${transactions.length} Total Transactions`
            : `${filteredTransactions.length} / ${transactions.length} Transactions`}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32px] text-center px-2">
                <Checkbox
                  checked={selectedTransactions.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
                />
              </TableHead>
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer w-[80px]">
                <div className="flex items-center justify-center">
                  Date{getSortIcon('date')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('type')} className="cursor-pointer w-[80px]">
                <div className="flex items-center justify-center">
                  Type{getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer w-[80px]">
                <div className="flex items-center justify-center">
                  Term
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('btc_amount')} className="cursor-pointer w-[80px]">
                <div className="flex items-center justify-center">
                  Amount (BTC){getSortIcon('btc_amount')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('price_at_tx')} className="cursor-pointer hidden md:table-cell w-[80px]">
                <div className="flex items-center justify-center">
                  Price (BTC/USD){getSortIcon('price_at_tx')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('usd_value')} className="cursor-pointer w-[80px]">
                <div className="flex items-center justify-center">
                  Amount (USD){getSortIcon('usd_value')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('fee_usd')} className="cursor-pointer hidden md:table-cell w-[80px]">
                <div className="flex items-center justify-center">
                  Fees (USD){getSortIcon('fee_usd')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('exchange')} className="cursor-pointer hidden lg:table-cell w-[80px]">
                <div className="flex items-center justify-center">
                  Exchange{getSortIcon('exchange')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('network_fee_btc')} className="cursor-pointer hidden lg:table-cell w-[80px]">
                <div className="flex items-center justify-center">
                  Fees (BTC){getSortIcon('network_fee_btc')}
                </div>
              </TableHead>
              <TableHead className="hidden lg:table-cell w-[60px]">
                <div className="flex items-center justify-center">
                  TXID
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="text-center px-2">
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={() => handleSelectTransaction(transaction.id)}
                    aria-label={`Select transaction from ${new Date(transaction.date).toLocaleDateString()}`}
                    className="border-muted-foreground/50 data-[state=checked]:border-bitcoin-orange data-[state=checked]:bg-bitcoin-orange"
                  />
                </TableCell>
                <TableCell className="text-center">
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`w-[125px] inline-flex items-center justify-center rounded-full border shadow-sm transition-none ${
                      transaction.type?.toLowerCase() === "buy" 
                        ? "bg-gradient-to-r from-bitcoin-orange/90 to-bitcoin-orange/70 border-bitcoin-orange/40 text-white" 
                        : transaction.type?.toLowerCase() === "sell"
                        ? "bg-gradient-to-r from-red-500/90 to-red-400/70 border-red-500/40 text-white"
                        : transaction.type?.toLowerCase() === "deposit"
                        ? "bg-gradient-to-r from-green-500/90 to-green-400/70 border-green-500/40 text-white"
                        : "bg-gradient-to-r from-blue-500/90 to-blue-400/70 border-blue-500/40 text-white"
                    }`}
                  >
                    {transaction.type?.toLowerCase() === "buy" ? (
                      <CircleArrowRight className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "sell" ? (
                      <CircleArrowLeft className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "deposit" ? (
                      <CircleArrowDown className="mr-1 h-4 w-4" />
                    ) : (
                      <CircleArrowUp className="mr-1 h-4 w-4" />
                    )}
                    {transaction.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`w-[70px] inline-flex items-center justify-center ${
                      isShortTerm(transaction.date)
                        ? "border-green-500 text-green-500"
                        : "border-purple-500 text-purple-500"
                    }`}
                  >
                    {isShortTerm(transaction.date) ? "SHORT" : "LONG"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {formatBTC(transaction.btc_amount, false)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {formatCurrency(transaction.price_at_tx)}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(transaction.usd_value)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  {formatCurrency(transaction.fee_usd)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {transaction.exchange 
                    ? transaction.exchange.charAt(0).toUpperCase() + transaction.exchange.slice(1).toLowerCase()
                    : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {formatBTC(transaction.network_fee_btc, false)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {transaction.txid ? (
                    <a 
                      href={`https://mempool.space/tx/${transaction.txid}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700"
                      title="View transaction on Mempool.space"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { 
          if (!isDeleting) { // Prevent closing while deleting 
              setDeleteDialogOpen(open); 
              if (!open) setDeleteError(null); // Clear error message when dialog is closed manually
          }
       }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTransactions.size} selected transaction{selectedTransactions.size === 1 ? '' : 's'}?
              This action cannot be undone.
            </DialogDescription>
             {/* Display delete error inside the dialog */}
             {deleteError && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Deletion Failed</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
             )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeleting}>
               {isDeleting ? (
                   <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
               ) : (
                   'Delete'
               )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="bg-green-100/80 backdrop-blur-sm border border-green-200 shadow-xl max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-green-800 mb-2">Success!</DialogTitle>
            <DialogDescription className="text-green-700 mb-8 text-base">
              {successMessage}
            </DialogDescription>
            <Button 
              onClick={() => setSuccessDialogOpen(false)}
              className="bg-green-500/90 hover:bg-green-600 text-white w-32 shadow-sm transition-all duration-200"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

