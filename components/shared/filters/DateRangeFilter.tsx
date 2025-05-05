"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

interface DateRangeFilterProps {
  dateRange: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
  clearable?: boolean
  label?: string
  placeholder?: string
  presets?: boolean
}

/**
 * A reusable date range filter component
 */
export function DateRangeFilter({
  dateRange,
  onChange,
  className,
  clearable = true,
  label = "Date range",
  placeholder = "Select date range",
  presets = true,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (preset: string) => {
    const today = new Date()
    let range: DateRange | undefined

    switch (preset) {
      case "last7days":
        range = {
          from: addDays(today, -7),
          to: today
        }
        break
      case "last30days":
        range = {
          from: addDays(today, -30),
          to: today
        }
        break
      case "last90days":
        range = {
          from: addDays(today, -90),
          to: today
        }
        break
      case "thisyear":
        range = {
          from: new Date(today.getFullYear(), 0, 1),
          to: today
        }
        break
      case "alltime":
      case "clear":
        range = undefined
        break
      default:
        return
    }

    onChange(range)
    if (preset === "clear") {
      setIsOpen(false)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {presets && (
            <div className="p-3 border-b">
              <Select onValueChange={handleSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 days</SelectItem>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                  <SelectItem value="last90days">Last 90 days</SelectItem>
                  <SelectItem value="thisyear">This year</SelectItem>
                  <SelectItem value="alltime">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onChange}
            numberOfMonths={2}
          />
          {clearable && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleSelect("clear")}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
} 