"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DateRange } from "react-day-picker"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Search, X, CalendarIcon, CirclePlus, Filter } from "lucide-react"
import { UnifiedTransaction } from '@/types/transactions'
import { format } from "date-fns"

export interface FilterCounts {
  typeCounts: Record<string, number>
  termCounts: Record<string, number>
  exchangeCounts: Record<string, number>
}

interface TransactionFiltersProps {
  // Filter state
  searchQuery: string
  setSearchQuery: (query: string) => void
  dateRange: DateRange | undefined
  setDateRange: (range: DateRange | undefined) => void
  selectedTypes: string[]
  setSelectedTypes: (types: string[]) => void
  selectedTerms: string[]
  setSelectedTerms: (terms: string[]) => void
  selectedExchanges: string[]
  setSelectedExchanges: (exchanges: string[]) => void
  
  // Data for filter options
  exchanges: string[]
  filterCounts: FilterCounts
  activeFiltersCount: number
  
  // Actions
  resetFilters: () => void
}

export function TransactionFilters({
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
}: TransactionFiltersProps) {
  
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
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    +{selectedTypes.length - 2} more
                  </Badge>
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-gray-800 border-gray-600" align="start">
        <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['buy', 'sell', 'deposit', 'withdrawal'].map((type) => (
          <DropdownMenuItem
            key={type}
            className="flex items-center justify-between p-2 hover:bg-gray-700"
            onClick={() => {
              if (selectedTypes.includes(type)) {
                setSelectedTypes(selectedTypes.filter(t => t !== type))
              } else {
                setSelectedTypes([...selectedTypes, type])
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 border rounded-sm ${
                selectedTypes.includes(type) ? 'bg-bitcoin-orange border-bitcoin-orange' : 'border-gray-500'
              }`} />
              <span className="capitalize">{type}</span>
            </div>
            <span className="text-xs text-gray-400">
              {filterCounts.typeCounts[type] || 0}
            </span>
          </DropdownMenuItem>
        ))}
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
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedTerms.length}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] bg-gray-800 border-gray-600" align="start">
        <DropdownMenuLabel>Holding Period</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['SHORT', 'LONG'].map((term) => (
          <DropdownMenuItem
            key={term}
            className="flex items-center justify-between p-2 hover:bg-gray-700"
            onClick={() => {
              if (selectedTerms.includes(term)) {
                setSelectedTerms(selectedTerms.filter(t => t !== term))
              } else {
                setSelectedTerms([...selectedTerms, term])
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 border rounded-sm ${
                selectedTerms.includes(term) ? 'bg-bitcoin-orange border-bitcoin-orange' : 'border-gray-500'
              }`} />
              <span>{term === 'SHORT' ? 'Short-term' : 'Long-term'}</span>
            </div>
            <span className="text-xs text-gray-400">
              {filterCounts.termCounts[term] || 0}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Exchange filter component
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
          Exchange
          {selectedExchanges.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedExchanges.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedExchanges.slice(0, 2).map((exchange) => (
                  <Badge variant="secondary" key={exchange} className="rounded-sm px-1 font-normal">
                    {exchange}
                  </Badge>
                ))}
                {selectedExchanges.length > 2 && (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    +{selectedExchanges.length - 2} more
                  </Badge>
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px] bg-gray-800 border-gray-600" align="start">
        <DropdownMenuLabel>Exchange/Platform</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exchanges.map((exchange) => (
          <DropdownMenuItem
            key={exchange}
            className="flex items-center justify-between p-2 hover:bg-gray-700"
            onClick={() => {
              if (selectedExchanges.includes(exchange)) {
                setSelectedExchanges(selectedExchanges.filter(e => e !== exchange))
              } else {
                setSelectedExchanges([...selectedExchanges, exchange])
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 border rounded-sm ${
                selectedExchanges.includes(exchange) ? 'bg-bitcoin-orange border-bitcoin-orange' : 'border-gray-500'
              }`} />
              <span className="truncate">{exchange}</span>
            </div>
            <span className="text-xs text-gray-400">
              {filterCounts.exchangeCounts[exchange] || 0}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Date range filter component
  const dateRangeFilter = (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 border-dashed focus-visible:outline-none focus-visible:ring-0 ${
            dateRange?.from || dateRange?.to
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
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                  : dateRange?.from
                    ? `From ${format(dateRange.from, "MMM d")}`
                    : dateRange?.to
                      ? `Until ${format(dateRange.to, "MMM d")}`
                      : "Custom"
                }
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
          className="bg-gray-800"
        />
      </PopoverContent>
    </Popover>
  )

  return {
    searchInput,
    filterControls: (
      <div className="flex flex-wrap gap-2 items-center">
        {dateRangeFilter}
        {typeFilter}
        {termFilter}
        {exchangeFilter}
        
        {/* Reset filters button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 lg:px-3 text-gray-300 hover:text-white hover:bg-gray-700/50"
            onClick={resetFilters}
          >
            Reset
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          </Button>
        )}
      </div>
    )
  }
}

// Export utility functions used by the main table component
export function useTransactionFilters(transactions: UnifiedTransaction[]) {
  // Filter logic
  const applyFilters = React.useCallback((
    transactions: UnifiedTransaction[],
    searchQuery: string,
    dateRange: DateRange | undefined,
    selectedTypes: string[],
    selectedTerms: string[],
    selectedExchanges: string[]
  ) => {
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
  }, [])

  // Get unique exchanges for filter options
  const getUniqueExchanges = React.useCallback((transactions: UnifiedTransaction[]) => {
    const uniqueExchanges = new Set<string>()
    transactions.forEach(transaction => {
      if (transaction.from_address_name) uniqueExchanges.add(transaction.from_address_name)
      if (transaction.to_address_name) uniqueExchanges.add(transaction.to_address_name)
    })
    return Array.from(uniqueExchanges).sort()
  }, [])

  // Calculate counts for filter options
  const calculateFilterCounts = React.useCallback((transactions: UnifiedTransaction[]) => {
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
  }, [])

  return {
    applyFilters,
    getUniqueExchanges,
    calculateFilterCounts,
  }
} 