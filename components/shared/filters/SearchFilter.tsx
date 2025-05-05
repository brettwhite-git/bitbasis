"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { useState, useEffect } from "react"

interface SearchFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

/**
 * A reusable search input with clear button and optional debounce
 */
export function SearchFilter({
  value,
  onChange,
  placeholder = "Search...",
  className,
  debounceMs = 300
}: SearchFilterProps) {
  const [localValue, setLocalValue] = useState(value)
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])
  
  // Debounce the onChange callback
  useEffect(() => {
    if (localValue === value) return
    
    const handler = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)
    
    return () => {
      clearTimeout(handler)
    }
  }, [localValue, onChange, debounceMs, value])
  
  const handleClear = () => {
    setLocalValue("")
    onChange("")
  }
  
  return (
    <div className={cn("relative w-full", className)}>
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={cn(
          "pr-8",
          localValue && "border-bitcoin-orange"
        )}
      />
      {localValue && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent hover:text-bitcoin-orange"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 