"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from './format-utils';

interface BtcPriceInputProps {
  customBtcPrice: string | null;
  setCustomBtcPrice: (price: string | null) => void;
  spotPrice: number;
  loading: boolean;
  label?: string;
}

export function BtcPriceInput({
  customBtcPrice,
  setCustomBtcPrice,
  spotPrice,
  loading,
  label = "BTC Price"
}: BtcPriceInputProps) {
  // Handle custom BTC price change
  const handleCustomBtcPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d.-]/g, ''); // Allow decimal and negative sign
    
    // Clear custom price if empty
    if (newValue === '') {
      setCustomBtcPrice(null);
      return;
    }
    
    // Basic validation to ensure it's a plausible price value
    if (newValue === '.' || /^-?\d*\.?\d*$/.test(newValue)) {
      const numValue = parseFloat(newValue);
      // Only set if it's a valid positive number
      if (!isNaN(numValue) && numValue >= 0) {
        setCustomBtcPrice(newValue);
      }
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder={formatCurrency(spotPrice)}
        value={customBtcPrice ?? ''}
        onChange={handleCustomBtcPriceChange}
        className="pl-8 pr-24 h-10 bg-muted/50 border-input"
        inputMode="decimal"
      />
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
        $
      </span>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {loading && customBtcPrice === null ? (
          <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
        ) : customBtcPrice === null ? (
          <span className="text-xs text-muted-foreground">(Spot)</span>
        ) : (
          <>
            <span className="text-xs text-muted-foreground mr-2">(Custom)</span>
            <Button 
              variant="ghost" 
              size="xs"
              className="h-6 px-2 py-0 text-xs text-muted-foreground hover:text-foreground" 
              onClick={() => setCustomBtcPrice(null)}
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
} 