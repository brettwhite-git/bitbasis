"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ConversionState {
  satoshis: string;
  usd: string;
  btc: string;
}

export interface SatoshiConverterProps {
  onValuesChange?: (values: ConversionState) => void;
  btcPriceOverride?: number;
  className?: string;
}

export function SatoshiConverter({ onValuesChange, btcPriceOverride, className = "" }: SatoshiConverterProps) {
  const [values, setValues] = useState<ConversionState>({
    satoshis: '',
    usd: '',
    btc: ''
  });
  const [btcPrice, setBtcPrice] = useState<number>(0);
  
  // Refs to track input elements for cursor position
  const satoshisInputRef = useRef<HTMLInputElement>(null);
  const usdInputRef = useRef<HTMLInputElement>(null);
  const btcInputRef = useRef<HTMLInputElement>(null);
  
  // Store cursor positions and input selection
  const cursorPositionRef = useRef<number | null>(null);
  const selectionEndRef = useRef<number | null>(null);
  const fieldBeingEditedRef = useRef<keyof ConversionState | null>(null);
  const [isUserEditing, setIsUserEditing] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch this from your API
    // For now using a mock price
    setBtcPrice(btcPriceOverride || 65000);
  }, [btcPriceOverride]);
  
  // Restore cursor position after state update
  useEffect(() => {
    if (!isUserEditing || cursorPositionRef.current === null || !fieldBeingEditedRef.current) {
      return;
    }
    
    setTimeout(() => {
      const inputRef = 
        fieldBeingEditedRef.current === 'satoshis' ? satoshisInputRef.current :
        fieldBeingEditedRef.current === 'usd' ? usdInputRef.current :
        fieldBeingEditedRef.current === 'btc' ? btcInputRef.current : null;
      
      if (inputRef) {
        const formattedValue = inputRef.value;
        let cursorPos = cursorPositionRef.current || 0;
        
        // Adjust cursor position if value length changed significantly
        if (selectionEndRef.current !== null && selectionEndRef.current !== cursorPos) {
          // Was a selection - keep cursor at the start of where selection was
          inputRef.setSelectionRange(cursorPos, cursorPos);
        } else {
          // Cursor position only - try to maintain same relative position
          inputRef.setSelectionRange(cursorPos, cursorPos);
        }
      }
      
      setIsUserEditing(false);
    }, 0);
  }, [values, isUserEditing]);

  const isValidInput = (value: string, field: keyof ConversionState): boolean => {
    if (value === '') return true;
    
    const cleanValue = value.replace(/,/g, '');
    
    switch (field) {
      case 'satoshis':
        return /^\d+$/.test(cleanValue);
      case 'usd':
        return /^\d+(\.\d{0,2})?$/.test(cleanValue);
      case 'btc':
        return /^\d+(\.\d{0,8})?$/.test(cleanValue);
      default:
        return false;
    }
  };

  const handleInputFocus = (field: keyof ConversionState) => {
    fieldBeingEditedRef.current = field;
  };

  const handleInputChange = (field: keyof ConversionState, value: string) => {
    setIsUserEditing(true);
    
    const inputRef = 
      field === 'satoshis' ? satoshisInputRef.current :
      field === 'usd' ? usdInputRef.current :
      field === 'btc' ? btcInputRef.current : null;
    
    if (!inputRef) return;

    // Remove any commas from the input
    const cleanInput = value.replace(/,/g, '');
    
    // Split the current value into whole and decimal parts
    const parts = cleanInput.split('.');
    let wholeNumber = parts[0] || '';
    let decimal = parts[1] || '';
    
    // For USD, ensure we maintain 2 decimal places
    if (field === 'usd') {
      decimal = decimal.padEnd(2, '0').slice(0, 2);
      if (!cleanInput.includes('.')) {
        decimal = '00';
      }
    }

    // Construct the final value
    const newValue = wholeNumber + (decimal ? '.' + decimal : '');
    
    // Validate the new value
    if (!isValidInput(newValue, field)) {
      return;
    }

    const numValue = newValue === '' ? '' : parseFloat(newValue);
    const newValues = { ...values };

    switch (field) {
      case 'satoshis':
        newValues.satoshis = newValue;
        if (numValue !== '') {
          const btcValue = (numValue / 100000000).toFixed(8);
          newValues.btc = btcValue;
          const usdValue = parseFloat(btcValue) * btcPrice;
          newValues.usd = usdValue.toFixed(2);
        } else {
          newValues.btc = '';
          newValues.usd = '';
        }
        break;

      case 'usd':
        newValues.usd = newValue;
        if (numValue !== '') {
          const btcAmount = numValue / btcPrice;
          newValues.btc = btcAmount.toFixed(8);
          const satoshiValue = Math.floor(btcAmount * 100000000);
          newValues.satoshis = satoshiValue.toString();
        } else {
          newValues.btc = '';
          newValues.satoshis = '';
        }
        break;

      case 'btc':
        newValues.btc = newValue;
        if (numValue !== '') {
          const satoshiValue = Math.floor(numValue * 100000000);
          newValues.satoshis = satoshiValue.toString();
          const usdValue = numValue * btcPrice;
          newValues.usd = usdValue.toFixed(2);
        } else {
          newValues.satoshis = '';
          newValues.usd = '';
        }
        break;
    }

    setValues(newValues);
    
    if (onValuesChange) {
      onValuesChange(newValues);
    }

    // Set cursor position before the decimal point
    setTimeout(() => {
      const decimalIndex = wholeNumber.length;
      inputRef.setSelectionRange(decimalIndex, decimalIndex);
    }, 0);
  };

  // Format display values with commas
  const formatNumber = (value: string, type: 'satoshi' | 'usd' | 'btc'): string => {
    if (!value) return '';
    
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    switch (type) {
      case 'satoshi':
        return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
      case 'usd':
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'btc':
        return num.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
      default:
        return value;
    }
  };

  // Clear all input fields
  const handleClear = () => {
    const emptyValues = {
      satoshis: '',
      usd: '',
      btc: ''
    };
    setValues(emptyValues);
    
    // Call the callback if provided
    if (onValuesChange) {
      onValuesChange(emptyValues);
    }
  };

  return (
    <div className={`w-full bg-card rounded-lg border p-4 mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Satoshi Converter</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={16} className="mr-1" />
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center mr-2">
              <span className="text-black font-bold">₿</span>
            </div>
            <Label>Satoshis</Label>
          </div>
          <Input
            ref={satoshisInputRef}
            type="text"
            placeholder="Enter satoshis..."
            value={formatNumber(values.satoshis, 'satoshi')}
            onChange={(e) => handleInputChange('satoshis', e.target.value)}
            onFocus={() => handleInputFocus('satoshis')}
            className="text-right"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <p className="text-xs text-muted-foreground text-right">SATS</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
              <span className="text-white font-bold">$</span>
            </div>
            <Label>US Dollar</Label>
          </div>
          <Input
            ref={usdInputRef}
            type="text"
            placeholder="Enter USD..."
            value={formatNumber(values.usd, 'usd')}
            onChange={(e) => handleInputChange('usd', e.target.value)}
            onFocus={() => handleInputFocus('usd')}
            className="text-right"
            inputMode="decimal"
          />
          <p className="text-xs text-muted-foreground text-right">USD</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center mr-2">
              <span className="text-black font-bold">₿</span>
            </div>
            <Label>Bitcoin</Label>
          </div>
          <Input
            ref={btcInputRef}
            type="text"
            placeholder="Enter BTC..."
            value={formatNumber(values.btc, 'btc')}
            onChange={(e) => handleInputChange('btc', e.target.value)}
            onFocus={() => handleInputFocus('btc')}
            className="text-right"
            inputMode="decimal"
          />
          <p className="text-xs text-muted-foreground text-right">BTC</p>
        </div>
      </div>
    </div>
  );
}

// Export the ConversionState interface so it can be used by other components
export type { ConversionState }; 