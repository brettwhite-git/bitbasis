"use client"

import React, { useEffect, useState } from "react"
import { Table, TableBody } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Ghost, Trash2, MoreHorizontal, Upload, CirclePlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Search, X, CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DateRange } from "react-day-picker"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

// Import hooks that we'll need
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { toast } from 'sonner'

// Import existing components we can reuse
import { DataTableEmpty } from "@/components/shared/data-table/DataTableEmpty"
import { DataTableLoading } from "@/components/shared/data-table/DataTableLoading"
import { DataTableError } from "@/components/shared/data-table/DataTableError"

// Import our new components
import { TransactionHistoryHeaders } from "./transaction-history-headers"
import { TransactionHistoryRow } from "./transaction-history-row"
import { TransactionHistoryMobileView } from "./transaction-history-mobile-view"

// Import the unified add transaction wizard
import { AddTransactionWizard } from "@/components/add-transaction-wizard/add-transaction-wizard"

// Import the new unified import wizard
import { ImportWizard } from "@/components/import"

// Import utilities - removed unused format imports
import { UnifiedTransaction } from '@/types/transactions'

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

// Types for our unified transaction (simplified for now)
interface SortConfig {
  column: keyof UnifiedTransaction
  direction: 'asc' | 'desc'
}

export function TransactionHistoryTable() {
  // State
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'date', direction: 'desc' })
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([])
  
  // Search states for filter dropdowns
  const [typeSearchQuery, setTypeSearchQuery] = useState("")
  const [termSearchQuery, setTermSearchQuery] = useState("")
  const [exchangeSearchQuery, setExchangeSearchQuery] = useState("")

  // Hooks
  const isMobile = useIsMobile()

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
    fetchTransactions() // Refresh the transaction list
    setImportWizardOpen(false) // Close the import wizard
  }

  // Filter logic
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const searchableFields = [
          transaction.type,
          transaction.from_address_name,
          transaction.to_address_name,
          transaction.sent_currency,
          transaction.received_currency,
          transaction.transaction_hash,
          transaction.comment,
          transaction.sent_amount?.toString(),
          transaction.received_amount?.toString(),
          transaction.price?.toString(),
        ].filter(Boolean)

        const matches = searchableFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        )
        if (!matches) return false
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const transactionDate = new Date(transaction.date)
        if (dateRange.from && transactionDate < dateRange.from) return false
        if (dateRange.to && transactionDate > dateRange.to) return false
      }

      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(transaction.type)) {
        return false
      }

      // Term filter (only for buy/sell)
      if (selectedTerms.length > 0 && (transaction.type === 'buy' || transaction.type === 'sell')) {
        const transactionDate = new Date(transaction.date)
        const currentDate = new Date()
        const daysDiff = (currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
        const isLongTerm = daysDiff >= 365
        
        // Check if transaction matches any of the selected terms
        const matchesSelectedTerms = selectedTerms.some(term => {
          return (term === "LONG" && isLongTerm) || (term === "SHORT" && !isLongTerm)
        })
        
        if (!matchesSelectedTerms) return false
      }

      // Exchange filter
      if (selectedExchanges.length > 0) {
        const exchangeName = transaction.from_address_name || transaction.to_address_name || ""
        if (!selectedExchanges.includes(exchangeName)) {
          return false
        }
      }

      return true
    })
  }, [transactions, searchQuery, dateRange, selectedTypes, selectedTerms, selectedExchanges])

  // Get unique exchanges for filter options
  const exchanges = React.useMemo(() => {
    const uniqueExchanges = new Set<string>()
    transactions.forEach(transaction => {
      if (transaction.from_address_name) uniqueExchanges.add(transaction.from_address_name)
      if (transaction.to_address_name) uniqueExchanges.add(transaction.to_address_name)
    })
    return Array.from(uniqueExchanges).sort()
  }, [transactions])

  // Calculate counts for filter options
  const filterCounts = React.useMemo(() => {
    const typeCounts: Record<string, number> = {}
    const termCounts: Record<string, number> = {}
    const exchangeCounts: Record<string, number> = {}

    transactions.forEach(transaction => {
      // Count by type
      typeCounts[transaction.type] = (typeCounts[transaction.type] || 0) + 1

      // Count by term (only for buy/sell)
      if (transaction.type === 'buy' || transaction.type === 'sell') {
        const transactionDate = new Date(transaction.date)
        const currentDate = new Date()
        const daysDiff = (currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
        const term = daysDiff >= 365 ? 'LONG' : 'SHORT'
        termCounts[term] = (termCounts[term] || 0) + 1
      }

      // Count by exchange
      if (transaction.from_address_name) {
        exchangeCounts[transaction.from_address_name] = (exchangeCounts[transaction.from_address_name] || 0) + 1
      }
      if (transaction.to_address_name && transaction.to_address_name !== transaction.from_address_name) {
        exchangeCounts[transaction.to_address_name] = (exchangeCounts[transaction.to_address_name] || 0) + 1
      }
    })

    return { typeCounts, termCounts, exchangeCounts }
  }, [transactions])

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setDateRange(undefined)
    setSelectedTypes([])
    setSelectedTerms([])
    setSelectedExchanges([])
    setCurrentPage(1)
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

  // Search input component
  const searchInput = (
    <div className="relative w-full sm:w-[260px]">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search transactions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-10 bg-gray-800/40 border-gray-600/50"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-700/50"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  // Type filter component
  const typeFilter = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 border-dashed focus-visible:outline-none focus-visible:ring-0 ${
            selectedTypes.length > 0
              ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-bitcoin-orange/50"
              : "bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50"
          }`}
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          Type
          {selectedTypes.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedTypes.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedTypes.slice(0, 2).map((type) => (
                  <Badge variant="secondary" key={type} className="rounded-sm px-1 font-normal min-w-[80px] text-center">
                    {type}
                  </Badge>
                ))}
                {selectedTypes.length > 2 && (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal min-w-[80px] text-center">
                    +{selectedTypes.length - 2} more
                  </Badge>
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-gray-900/95 backdrop-blur-md border-gray-700/50 shadow-2xl" align="start">
        <DropdownMenuLabel>Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search input */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Filter types..."
              value={typeSearchQuery}
              onChange={(e) => setTypeSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-gray-800/60 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-gray-500"
            />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Type options with counts */}
        {[
          { value: 'buy', label: 'Buy' },
          { value: 'sell', label: 'Sell' },
          { value: 'deposit', label: 'Deposit' },
          { value: 'withdrawal', label: 'Withdrawal' },
          { value: 'interest', label: 'Interest' }
        ]
          .filter(option => 
            typeSearchQuery === "" || 
            option.label.toLowerCase().includes(typeSearchQuery.toLowerCase())
          )
          .map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              event.preventDefault()
              const isSelected = selectedTypes.includes(option.value)
              if (isSelected) {
                setSelectedTypes(selectedTypes.filter(t => t !== option.value))
              } else {
                setSelectedTypes([...selectedTypes, option.value])
              }
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedTypes.includes(option.value)}
                onChange={() => {}} // Handled by parent onClick
                className="border-gray-400 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
              />
              <span>{option.label}</span>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {filterCounts.typeCounts[option.value] || 0}
            </span>
          </DropdownMenuItem>
        ))}
        
        {selectedTypes.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setSelectedTypes([])
              }}
              className="text-muted-foreground"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Term filter component
  const termFilter = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 border-dashed focus-visible:outline-none focus-visible:ring-0 ${
            selectedTerms.length > 0
              ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-bitcoin-orange/50"
              : "bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50"
          }`}
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          Term
          {selectedTerms.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedTerms.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedTerms.slice(0, 2).map((term) => (
                  <Badge variant="secondary" key={term} className="rounded-sm px-1 font-normal min-w-[80px] text-center">
                    {term === 'SHORT' ? 'Short' : 'Long'}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-gray-900/95 backdrop-blur-md border-gray-700/50 shadow-2xl" align="start">
        <DropdownMenuLabel>Term</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search input */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Filter terms..."
              value={termSearchQuery}
              onChange={(e) => setTermSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-gray-800/60 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-gray-500"
            />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Term options with counts */}
        {[
          { value: 'SHORT', label: 'Short Term' },
          { value: 'LONG', label: 'Long Term' }
        ]
          .filter(option => 
            termSearchQuery === "" || 
            option.label.toLowerCase().includes(termSearchQuery.toLowerCase())
          )
          .map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              event.preventDefault()
              const isSelected = selectedTerms.includes(option.value)
              if (isSelected) {
                setSelectedTerms(selectedTerms.filter(t => t !== option.value))
              } else {
                setSelectedTerms([...selectedTerms, option.value])
              }
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedTerms.includes(option.value)}
                onChange={() => {}} // Handled by parent onClick
                className="border-gray-400 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
              />
              <span>{option.label}</span>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {filterCounts.termCounts[option.value] || 0}
            </span>
          </DropdownMenuItem>
        ))}
        
        {selectedTerms.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setSelectedTerms([])
              }}
              className="text-muted-foreground"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Source filter component
  const exchangeFilter = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 border-dashed focus-visible:outline-none focus-visible:ring-0 ${
            selectedExchanges.length > 0
              ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-bitcoin-orange/50"
              : "bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50"
          }`}
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          Source
          {selectedExchanges.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedExchanges.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedExchanges.slice(0, 2).map((exchange) => (
                  <Badge variant="secondary" key={exchange} className="rounded-sm px-1 font-normal min-w-[80px] text-center">
                    {exchange}
                  </Badge>
                ))}
                {selectedExchanges.length > 2 && (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal min-w-[80px] text-center">
                    +{selectedExchanges.length - 2} more
                  </Badge>
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-gray-900/95 backdrop-blur-md border-gray-700/50 shadow-2xl" align="start">
        <DropdownMenuLabel>Source</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search input */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Filter sources..."
              value={exchangeSearchQuery}
              onChange={(e) => setExchangeSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-gray-800/60 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-gray-500"
            />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Source options with counts */}
        {exchanges
          .filter(exchange => 
            exchangeSearchQuery === "" || 
            exchange.toLowerCase().includes(exchangeSearchQuery.toLowerCase())
          )
          .map((exchange) => (
          <DropdownMenuItem
            key={exchange}
            onSelect={(event) => {
              event.preventDefault()
              const isSelected = selectedExchanges.includes(exchange)
              if (isSelected) {
                setSelectedExchanges(selectedExchanges.filter(e => e !== exchange))
              } else {
                setSelectedExchanges([...selectedExchanges, exchange])
              }
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedExchanges.includes(exchange)}
                onChange={() => {}} // Handled by parent onClick
                className="border-gray-400 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
              />
              <span>{exchange}</span>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {filterCounts.exchangeCounts[exchange] || 0}
            </span>
          </DropdownMenuItem>
        ))}
        
        {selectedExchanges.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setSelectedExchanges([])
              }}
              className="text-muted-foreground"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Date range filter component
  const dateRangeFilter = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`h-8 border-dashed focus-visible:outline-none focus-visible:ring-0 ${
            (dateRange?.from || dateRange?.to)
              ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-bitcoin-orange/50"
              : "bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50"
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Date
          {(dateRange?.from || dateRange?.to) && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {dateRange?.from && dateRange?.to ? 'Range' : 'Date'}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto p-0 bg-gray-900/95 backdrop-blur-md border-gray-700/50 shadow-2xl" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          initialFocus
          numberOfMonths={2}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Filter section
  const filterSection = (
    <div className="flex items-center gap-2 flex-wrap">
      {searchInput}
      {dateRangeFilter}
      {typeFilter}
      {termFilter}
      {exchangeFilter}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="text-muted-foreground hover:text-white"
        >
          Reset ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateRange, selectedTypes, selectedTerms, selectedExchanges])

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage)

  // Handlers
  const handleSort = (column: keyof UnifiedTransaction) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleSelection = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    const allSelected = paginatedTransactions.every(t => selectedTransactions.has(t.id))
    if (allSelected) {
      // Deselect all on current page
      setSelectedTransactions(prev => {
        const newSet = new Set(prev)
        paginatedTransactions.forEach(t => newSet.delete(t.id))
        return newSet
      })
    } else {
      // Select all on current page
      setSelectedTransactions(prev => {
        const newSet = new Set(prev)
        paginatedTransactions.forEach(t => newSet.add(t.id))
        return newSet
      })
    }
  }

  const areAllSelected = paginatedTransactions.length > 0 && 
    paginatedTransactions.every(t => selectedTransactions.has(t.id))

  // Transaction count text for pagination
  const getDisplayRange = () => {
    const total = sortedTransactions.length
    if (total === 0) return { start: 0, end: 0, total: 0 }
    
    const start = (currentPage - 1) * itemsPerPage + 1
    const end = Math.min(currentPage * itemsPerPage, total)
    return { start, end, total }
  }

  const { start, end, total } = getDisplayRange()

  // Pagination controls
  const canPreviousPage = currentPage > 1
  const canNextPage = currentPage < totalPages
  
  // Advanced pagination component
  const paginationSection = total > 0 && (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {total === 0 ? (
          "0 of 0 row(s) selected."
        ) : (
          `${selectedTransactions.size} of ${total} row(s) selected.`
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${itemsPerPage}`}
            onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1) // Reset to first page when changing page size
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setCurrentPage(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setCurrentPage(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

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
        <div className="flex items-center justify-center">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Import</span>
        </div>
      </Button>
    </div>
  )

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

      // Log the result for debugging
      console.log('Delete API response:', result)

      // Use deletedCount from API or fallback to the number we tried to delete
      const deletedCount = result.deletedCount ?? transactionIds.length

      // Success
      toast.success("Transactions Deleted", {
        description: `Successfully deleted ${deletedCount} transaction${deletedCount === 1 ? '' : 's'}`,
      })

      // Clear selections and refresh data
      setSelectedTransactions(new Set())
      await fetchTransactions()

    } catch (error) {
      console.error('Error deleting transactions:', error)
      toast.error("Delete Failed", {
        description: error instanceof Error ? error.message : 'Failed to delete transactions',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedTransactions)
    if (selectedIds.length === 0) return

    setTransactionsToDelete(selectedIds)
    setDeleteDialogOpen(true)
  }

  const handleSingleDelete = async (transactionId: string) => {
    setTransactionsToDelete([transactionId])
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    await deleteTransactions(transactionsToDelete)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Table>
            <TableBody>
              <DataTableLoading colSpan={10} />
            </TableBody>
          </Table>
        </div>

        {/* Import Wizard for loading state */}
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

        {/* Import Wizard for error state */}
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
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {filterSection}
          {actionButtons}
        </div>
        
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gradient-to-br from-gray-800/30 via-gray-900/40 to-gray-800/30 p-3 mb-2">
              <Ghost className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 mb-4">
              No transactions found in the new unified table.
            </p>
            <p className="text-xs text-gray-500">
              This is the new transaction history system. Data will appear here as you add transactions.
            </p>
          </div>
        </div>

        {/* Import Wizard for empty state */}
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
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {filterSection}
          {actionButtons}
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

        {/* Import Wizard for filtered empty state */}
        <ImportWizard
          open={importWizardOpen}
          onOpenChange={setImportWizardOpen}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter, Selection, and Action sections */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-h-[40px]">
        {/* Left section: Filters */}
        <div className="flex-1 min-w-0">
          {filterSection}
        </div>
        
        {/* Middle section: Selected transactions bar - always takes space but visibility controlled */}
        <div className={`bg-gradient-to-br from-gray-800/40 via-gray-900/50 to-gray-800/40 backdrop-blur-sm p-2 px-3 rounded-lg flex items-center border border-gray-700/50 whitespace-nowrap transition-opacity duration-200 ${
          selectedTransactions.size > 0 ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
          <span className="text-sm font-medium text-white mr-3">
            {selectedTransactions.size} {selectedTransactions.size === 1 ? 'transaction' : 'transactions'} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="flex items-center gap-1 h-7 px-2 text-xs"
            disabled={selectedTransactions.size === 0 || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            <span>{isDeleting ? 'Deleting...' : 'Delete Selected'}</span>
          </Button>
        </div>
        
        {/* Right section: Action buttons - fixed position */}
        <div className="flex-shrink-0">
          {actionButtons}
        </div>
      </div>

      {/* Desktop view */}
      {!isMobile && (
        <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Table>
            <TransactionHistoryHeaders
              sortConfig={sortConfig}
              onSort={handleSort}
              areAllSelected={areAllSelected}
              onSelectAll={toggleSelectAll}
              hasTransactions={paginatedTransactions.length > 0}
            />
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TransactionHistoryRow
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedTransactions.has(transaction.id)}
                  onSelect={() => toggleSelection(transaction.id)}
                  onDelete={() => handleSingleDelete(transaction.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile view */}
      {isMobile && (
        <TransactionHistoryMobileView
          transactions={paginatedTransactions}
          selectedTransactions={selectedTransactions}
          toggleSelection={toggleSelection}
          onDelete={handleSingleDelete}
        />
      )}

      {/* Advanced pagination component */}
      {paginationSection}

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