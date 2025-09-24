"use client"

import React, { startTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from './format-utils';

interface BtcPriceInputProps {
  customBtcPrice: string | null;
  onCustomBtcPriceChange: string; // Form action ID for the callback
  spotPrice: number;
  loading: boolean;
  label?: string;
}

export function BtcPriceInput({
  customBtcPrice,
  onCustomBtcPriceChange,
  spotPrice,
  loading
}: BtcPriceInputProps) {
  
  // Handle custom BTC price change
  const handleCustomBtcPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d.-]/g, ''); // Allow decimal and negative sign
    
    // Clear custom price if empty
    if (newValue === '') {
      startTransition(() => {
        // Use the client-side DOM API to dispatch a custom event
        window.dispatchEvent(new CustomEvent(onCustomBtcPriceChange, { 
          detail: null 
        }));
      });
      return;
    }
    
    // Basic validation to ensure it's a plausible price value
    if (newValue === '.' || /^-?\d*\.?\d*$/.test(newValue)) {
      const numValue = parseFloat(newValue);
      // Only set if it's a valid positive number
      if (!isNaN(numValue) && numValue >= 0) {
        startTransition(() => {
          // Use the client-side DOM API to dispatch a custom event
          window.dispatchEvent(new CustomEvent(onCustomBtcPriceChange, { 
            detail: newValue 
          }));
        });
      }
    }
  };

  // Reset the price to null (go back to spot price)
  const handleReset = () => {
    startTransition(() => {
      window.dispatchEvent(new CustomEvent(onCustomBtcPriceChange, { 
        detail: null 
      }));
    });
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
              size="sm"
              className="h-6 px-2 py-0 text-xs text-muted-foreground hover:text-foreground" 
              onClick={handleReset}
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
} 