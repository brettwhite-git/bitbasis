"use client"

import { useEffect, useState } from "react"
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
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Search, SendHorizontal, ArrowUpDown, ArrowDown, ArrowUp, X, Loader2, Trash2 } from "lucide-react"
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

// Define the structure returned by the updated getTransactions
interface UnifiedTransaction {
  id: string; 
  date: string;
  type: 'Buy' | 'Sell' | 'Send' | 'Receive';
  asset: string;
  btc_amount: number | null;
  usd_value: number | null;
  fee_usd: number | null;
  price_at_tx: number | null;
  exchange: string | null;
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

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        
        // Check authentication first
        const supabase = createClientComponentClient<Database>()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }
        
        if (!user) {
          throw new Error('Please sign in to view transactions')
        }

        // Fetch transactions
        const { data, error } = await getTransactions()
        if (error) throw error
        if (data) {
          setTransactions(data)
        }
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
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
      "Amount (BTC)": formatBTC(transaction.btc_amount), 
      "Price at Tx (USD)": formatCurrency(transaction.price_at_tx),
      "Value (USD)": formatCurrency(transaction.usd_value),
      "Fees (USD)": formatCurrency(transaction.fee_usd),
      Exchange: transaction.exchange || "-"
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
    // For now, just remove from local state
    setTransactions(prev => prev.filter(t => !selectedTransactions.has(t.id)))
    setSelectedTransactions(new Set())
    setDeleteDialogOpen(false)
  }

  // Effect to render pagination in the header container
  useEffect(() => {
    const container = document.getElementById(paginationContainerId);
    if (container) {
      const paginationControls = (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
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
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
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
      const { createRoot } = require('react-dom/client');
      const root = createRoot(container);
      root.render(paginationControls);
      
      // Cleanup on unmount
      return () => {
        root.unmount();
      };
    }
  }, [currentPage, totalPages, paginationContainerId, isExporting, transactions.length]);

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
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
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
        <div className="text-sm text-muted-foreground whitespace-nowrap ml-auto border rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
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
                    className={`w-[80px] inline-flex items-center justify-center text-white ${
                      transaction.type?.toLowerCase() === "buy" 
                        ? "bg-bitcoin-orange" 
                        : transaction.type?.toLowerCase() === "sell"
                        ? "bg-red-500"
                        : transaction.type?.toLowerCase() === "send"
                        ? "bg-gray-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {transaction.type?.toLowerCase() === "buy" ? (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "sell" ? (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    ) : transaction.type?.toLowerCase() === "send" ? (
                      <SendHorizontal className="mr-1 h-4 w-4" />
                    ) : (
                      <SendHorizontal className="mr-1 h-4 w-4 rotate-180" />
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
                  {formatBTC(transaction.btc_amount)}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTransactions.size} selected transaction{selectedTransactions.size === 1 ? '' : 's'}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

