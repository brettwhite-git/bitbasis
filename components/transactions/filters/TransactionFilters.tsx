"use client"

import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { SearchFilter } from "@/components/shared/filters/SearchFilter"
import { DropdownFilter, FilterOption } from "@/components/shared/filters/DropdownFilter"
import { DateRange } from "react-day-picker"
import { memo } from "react"

interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  termFilter: string
  onTermFilterChange: (value: string) => void
  exchangeFilter: string
  onExchangeFilterChange: (value: string) => void
  exchanges: string[]
  onReset: () => void
  selectedCount?: number
  onDeleteSelected?: () => void
}

/**
 * Component for transaction table filters
 */
export const TransactionFilters = memo(function TransactionFilters({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  typeFilter,
  onTypeFilterChange,
  termFilter,
  onTermFilterChange,
  exchangeFilter,
  onExchangeFilterChange,
  exchanges,
  onReset,
  selectedCount = 0,
  onDeleteSelected
}: TransactionFiltersProps) {
  
  const typeOptions: FilterOption[] = [
    { value: "all", label: "All Types" },
    { value: "buy", label: "Buy" },
    { value: "sell", label: "Sell" },
    { value: "deposit", label: "Deposit" },
    { value: "withdrawal", label: "Withdrawal" }
  ]
  
  const termOptions: FilterOption[] = [
    { value: "all", label: "All Terms" },
    { value: "SHORT", label: "Short" },
    { value: "LONG", label: "Long" }
  ]
  
  const exchangeOptions: FilterOption[] = [
    { value: "all", label: "All Exchanges" },
    ...exchanges.map(exchange => ({
      value: exchange.toLowerCase(),
      label: exchange === '-' ? '-' : 
        exchange.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
    }))
  ]
  
  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || 
    dateRange !== undefined || 
    typeFilter !== "all" || 
    termFilter !== "all" || 
    exchangeFilter !== "all"
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-grow">
        <SearchFilter
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search transactions..."
          className="w-full sm:w-[260px]"
        />
        
        <DateRangePicker
          date={dateRange}
          onDateChange={onDateRangeChange}
        />
        
        <div className="flex items-center gap-2">
          <DropdownFilter
            value={typeFilter}
            onChange={onTypeFilterChange}
            options={typeOptions}
            triggerClassName="w-[120px]"
            placeholder="Type"
          />
          
          <DropdownFilter
            value={termFilter}
            onChange={onTermFilterChange}
            options={termOptions}
            triggerClassName="w-[120px]"
            placeholder="Term"
          />
          
          <DropdownFilter
            value={exchangeFilter}
            onChange={onExchangeFilterChange}
            options={exchangeOptions}
            triggerClassName="w-[140px]"
            placeholder="Exchange"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-sm whitespace-nowrap"
          disabled={!hasActiveFilters}
        >
          Clear All Filters
        </Button>
        
        {selectedCount > 0 && onDeleteSelected && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            className="text-sm whitespace-nowrap"
          >
            Delete Selected ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  )
}) 