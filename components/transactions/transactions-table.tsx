"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Search, SendHorizontal, ArrowUpDown, ArrowDown, ArrowUp, X, Loader2 } from "lucide-react"
import { getTransactions } from "@/lib/supabase"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { startOfDay, endOfDay, isWithinInterval, format } from "date-fns"

type Transaction = Database['public']['Tables']['transactions']['Row']

type SortConfig = {
  column: keyof Transaction | null
  direction: 'asc' | 'desc'
}

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'date', direction: 'desc' })
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const itemsPerPage = 20
  const [isExporting, setIsExporting] = useState(false)

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount)
  }

  const getTotalFees = (transaction: Transaction) => {
    return (transaction.network_fee || 0) + (transaction.service_fee || 0)
  }

  const isShortTerm = (date: string) => {
    const transactionDate = new Date(date)
    const currentYear = new Date().getFullYear()
    return transactionDate.getFullYear() === currentYear
  }

  const getAmount = (transaction: Transaction) => {
    // For Buy/Receive transactions, we want the received amount
    // For Sell/Send transactions, we want the sent amount
    switch (transaction.type) {
      case 'Buy':
      case 'Receive':
        return transaction.received_amount || 0
      case 'Sell':
      case 'Send':
        return transaction.sent_amount || 0
      default:
        return 0
    }
  }

  const getTotal = (transaction: Transaction) => {
    // Calculate the total in USD based on transaction type
    switch (transaction.type) {
      case 'Buy':
        return transaction.buy_amount || 0
      case 'Sell':
        return transaction.sell_amount || 0
      case 'Send':
      case 'Receive':
        const amount = getAmount(transaction)
        return amount * (transaction.price || 0)
      default:
        return 0
    }
  }

  const handleSort = (column: keyof Transaction) => {
    setSortConfig(currentConfig => ({
      column,
      direction: currentConfig.column === column && currentConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const getSortedTransactions = (transactions: Transaction[]) => {
    if (!sortConfig.column) return transactions

    return [...transactions].sort((a, b) => {
      const aValue = a[sortConfig.column!]
      const bValue = b[sortConfig.column!]

      // Handle different types of values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle date strings
      if (sortConfig.column === 'date' || sortConfig.column === 'created_at') {
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

  const getSortIcon = (column: keyof Transaction) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="h-4 w-4 text-primary" />
    )
  }

  const handleClear = () => {
    setSearchQuery("")
    setDateRange(undefined)
    setSortConfig({ column: 'date', direction: 'desc' })
    setCurrentPage(1)
  }

  // Filter transactions based on search query and date range
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

    return matchesSearch && matchesDateRange
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

  const prepareTransactionForCSV = (transaction: Transaction) => {
    return {
      Date: new Date(transaction.date).toLocaleDateString(),
      Type: transaction.type,
      "Amount (BTC)": formatBTC(getAmount(transaction)),
      "Price (USD)": formatCurrency(transaction.price || 0),
      "Total (USD)": formatCurrency(getTotal(transaction)),
      "Fees (USD)": formatCurrency(getTotalFees(transaction)),
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-[350px]">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent hover:text-destructive"
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-sm whitespace-nowrap"
          >
            Clear All Filters
          </Button>
        </div>
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
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  Date {getSortIcon('date')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('type')} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  Type {getSortIcon('type')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <div className="flex items-center justify-between">
                  Term
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('received_amount')} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  Amount (BTC) {getSortIcon('received_amount')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('price')} className="cursor-pointer hidden md:table-cell">
                <div className="flex items-center justify-between">
                  Price (USD) {getSortIcon('price')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('buy_amount')} className="cursor-pointer">
                <div className="flex items-center justify-between">
                  Total (USD) {getSortIcon('buy_amount')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('network_fee')} className="cursor-pointer hidden md:table-cell">
                <div className="flex items-center justify-between">
                  Fees (USD) {getSortIcon('network_fee')}
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('exchange')} className="cursor-pointer hidden lg:table-cell">
                <div className="flex items-center justify-between">
                  Exchange {getSortIcon('exchange')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      transaction.type === "Buy" 
                        ? "default" 
                        : transaction.type === "Sell"
                        ? "destructive"
                        : "secondary"
                    }
                    className={`w-[100px] flex items-center justify-center ${
                      transaction.type === "Buy" 
                        ? "bg-bitcoin-orange" 
                        : transaction.type === "Sell"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                  >
                    {transaction.type === "Buy" ? (
                      <ArrowDownRight className="mr-2 h-4 w-4" />
                    ) : transaction.type === "Sell" ? (
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                    ) : transaction.type === "Send" ? (
                      <SendHorizontal className="mr-2 h-4 w-4" />
                    ) : (
                      <SendHorizontal className="mr-2 h-4 w-4 rotate-180" />
                    )}
                    {transaction.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`w-[80px] flex items-center justify-center ${
                      isShortTerm(transaction.date)
                        ? "border-green-500 text-green-500"
                        : "border-purple-500 text-purple-500"
                    }`}
                  >
                    {isShortTerm(transaction.date) ? "SHORT" : "LONG"}
                  </Badge>
                </TableCell>
                <TableCell>{formatBTC(getAmount(transaction))}</TableCell>
                <TableCell className="hidden md:table-cell">
                  ${formatCurrency(transaction.price)}
                </TableCell>
                <TableCell>${formatCurrency(getTotal(transaction))}</TableCell>
                <TableCell className="hidden md:table-cell">
                  ${formatCurrency(getTotalFees(transaction))}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {transaction.exchange 
                    ? transaction.exchange.charAt(0).toUpperCase() + transaction.exchange.slice(1).toLowerCase()
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

