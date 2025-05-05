"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils/utils"

export interface FilterOption {
  value: string
  label: string
}

interface DropdownFilterProps {
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder?: string
  className?: string
  defaultValue?: string
  triggerClassName?: string
}

/**
 * A reusable dropdown filter component
 */
export function DropdownFilter({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  defaultValue = "all",
  triggerClassName
}: DropdownFilterProps) {
  return (
    <Select 
      value={value} 
      onValueChange={onChange}
      defaultValue={defaultValue}
    >
      <SelectTrigger 
        className={cn(
          triggerClassName,
          value !== defaultValue && "border-bitcoin-orange"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 