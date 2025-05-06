"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateRange } from "react-day-picker"
import { FilterIcon, X, Check, Search } from "lucide-react"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Separator } from "@/components/ui/separator"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilterOption } from "@/components/shared/filters/DropdownFilter"
import { cn } from "@/lib/utils/utils"

// Custom radio item that uses a check icon instead of a circle
const CheckRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
CheckRadioItem.displayName = "CheckRadioItem"

// Types for each subcomponent
interface SearchInputProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

interface FilterOptionsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  label: string;
}

interface UnifiedFilterDropdownProps {
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
}

// Subcomponents
const SearchInput = ({ searchQuery, onSearchChange }: SearchInputProps) => (
  <div className="relative w-full sm:w-[300px]">
    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search transactions..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="pl-9"
    />
    {searchQuery && (
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-6 w-6 p-0"
        onClick={() => onSearchChange("")}
      >
        <X className="h-4 w-4" />
      </Button>
    )}
  </div>
);

const FilterOptions = ({ value, onValueChange, options, label }: FilterOptionsProps) => (
  <div className="space-y-2">
    <DropdownMenuLabel className="block">{label}</DropdownMenuLabel>
    <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
      <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
        {options.map((option) => (
          <CheckRadioItem key={option.value} value={option.value} className="rounded-sm">
            {option.label}
          </CheckRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </div>
  </div>
);

export function UnifiedFilterDropdown({
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
}: UnifiedFilterDropdownProps) {
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
  
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (dateRange) count++
    if (typeFilter !== "all") count++
    if (termFilter !== "all") count++
    if (exchangeFilter !== "all") count++
    return count
  }, [searchQuery, dateRange, typeFilter, termFilter, exchangeFilter])
  
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <SearchInput searchQuery={searchQuery} onSearchChange={onSearchChange} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative flex items-center gap-1.5">
            <FilterIcon className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[600px]" align="start">
          {/* Date Range - Full Width */}
          <div className="p-2 border-b">
            <DropdownMenuLabel>Date Range</DropdownMenuLabel>
            <div className="py-1">
              <DateRangePicker
                date={dateRange}
                onDateChange={onDateRangeChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Three Column Layout for Filters */}
          <div className="grid grid-cols-3 gap-4 p-4">
            <FilterOptions 
              value={typeFilter}
              onValueChange={onTypeFilterChange}
              options={typeOptions}
              label="Transaction Type"
            />

            <FilterOptions 
              value={termFilter}
              onValueChange={onTermFilterChange}
              options={termOptions}
              label="Term"
            />

            <FilterOptions 
              value={exchangeFilter}
              onValueChange={onExchangeFilterChange}
              options={exchangeOptions}
              label="Exchange"
            />
          </div>

          {/* Reset Button - Full Width */}
          <div className="p-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={activeFiltersCount === 0}
              className="w-full"
            >
              Reset All Filters
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 