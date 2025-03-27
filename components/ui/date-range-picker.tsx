"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-10 px-3 py-2 w-[300px] justify-between text-left text-sm font-normal bg-background border-input",
              !date && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {date?.from ? (
                  date.to ? (
                    `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`
                  ) : (
                    format(date.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick a date range"
                )}
              </span>
            </div>
            {date && (
              <X 
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 hover:text-destructive" 
                onClick={(e) => {
                  e.stopPropagation()
                  onDateChange(undefined)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 