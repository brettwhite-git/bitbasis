"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CalculatorChart, ChartDataPoint } from "./calculator-chart"
import { SatoshiConverter, ConversionState } from "./satoshi-converter"

export function BitcoinCalculator() {
  const [calculatorMode, setCalculatorMode] = useState('satsGoal'); // 'satsGoal' or 'recurringBuy'
  const [bitcoinUnit, setBitcoinUnit] = useState('satoshi');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [conversionValues, setConversionValues] = useState<ConversionState>({
    satoshis: '',
    usd: '',
    btc: ''
  });
  const [satsGoal, setSatsGoal] = useState('10000000'); // 10M sats default
  const [btcPrice, setBtcPrice] = useState(65000); // Default BTC price
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [customDateChecked, setCustomDateChecked] = useState(false);
  const [customPriceChecked, setCustomPriceChecked] = useState(false);
  const [priceGrowth, setPriceGrowth] = useState('9'); // Default 9% annual growth
  
  // Refs for cursor position
  const satsGoalInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [isUserEditing, setIsUserEditing] = useState(false);

  // Handle conversion value changes from SatoshiConverter
  const handleConversionChange = (values: ConversionState) => {
    setConversionValues(values);
  };

  // Calculate monthly amount needed to reach sats goal
  useEffect(() => {
    if (!satsGoal) return;
    
    const satsGoalNum = parseFloat(satsGoal.replace(/,/g, ''));
    if (isNaN(satsGoalNum)) return;

    // Get number of months based on duration
    let months = 12;
    if (goalDuration === '2_year') months = 24;
    if (goalDuration === '5_year') months = 60;
    
    // Calculate monthly dollar amount needed
    const btcAmount = satsGoalNum / 100000000;
    const totalUSD = btcAmount * btcPrice;
    const monthlyUSD = totalUSD / months;
    
    setMonthlyAmount(monthlyUSD.toFixed(2));
  }, [satsGoal, goalDuration, btcPrice]);
  
  // Restore cursor position after state update
  useEffect(() => {
    if (!isUserEditing || cursorPositionRef.current === null) {
      return;
    }
    
    setTimeout(() => {
      if (satsGoalInputRef.current) {
        const cursorPos = cursorPositionRef.current || 0;
        satsGoalInputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
      
      setIsUserEditing(false);
    }, 0);
  }, [satsGoal, isUserEditing]);

  // Generate chart data based on inputs
  const chartData = useMemo(() => {
    if (!satsGoal || !monthlyAmount) return undefined;
    
    const satsGoalNum = parseFloat(satsGoal.replace(/,/g, ''));
    const monthlyUSD = parseFloat(monthlyAmount);
    if (isNaN(satsGoalNum) || isNaN(monthlyUSD)) return undefined;
    
    // Get number of months based on duration
    let months = 12;
    if (goalDuration === '2_year') months = 24;
    if (goalDuration === '5_year') months = 60;
    
    // Generate dates for the chart
    const startDate = new Date();
    const result: ChartDataPoint[] = [];
    
    let currentPrice = btcPrice;
    let cumulativeSats = 0;
    
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      
      // Apply price growth if custom price is checked
      if (customPriceChecked && i > 0) {
        const growthRate = parseFloat(priceGrowth) / 100 / 12; // Monthly growth rate
        currentPrice *= (1 + growthRate);
      }
      
      // Calculate how many sats can be bought with monthly amount
      const monthlyBTC = monthlyUSD / currentPrice;
      const monthlySats = Math.round(monthlyBTC * 100000000);
      
      cumulativeSats += monthlySats;
      
      result.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        accumulatedSats: cumulativeSats,
        periodicSats: monthlySats
      });
    }
    
    return result;
  }, [satsGoal, monthlyAmount, goalDuration, btcPrice, customPriceChecked, priceGrowth]);

  const isValidSatsInput = (value: string): boolean => {
    // Allow empty input
    if (value === '') return true;
    
    // Remove existing commas for validation
    const cleanValue = value.replace(/,/g, '');
    
    // Only allow whole numbers for satoshis
    return /^[0-9]+$/.test(cleanValue);
  };

  const handleSatsGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserEditing(true);
    
    // Save cursor position
    if (satsGoalInputRef.current) {
      cursorPositionRef.current = satsGoalInputRef.current.selectionStart;
    }
    
    const value = e.target.value;
    
    // Validate input
    if (!isValidSatsInput(value)) {
      return; // Reject invalid input
    }
    
    // Remove commas for storage, but allow input
    const cleanValue = value.replace(/,/g, '');
    setSatsGoal(cleanValue);
  };

  const handlePriceGrowthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Extract numbers and decimal point only
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return; // More than one decimal point - invalid
    }
    
    // Limit to 2 decimal places
    const decimals = parts[1];
    if (decimals && decimals.length > 2) {
      return; // More than 2 decimal places - invalid
    }
    
    setPriceGrowth(value);
  };

  // Format number with commas
  const formatNumber = (value: string | number, options?: Intl.NumberFormatOptions): string => {
    if (value === '' || value === undefined || value === null) return '';
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return typeof value === 'string' ? value : '';
    
    return num.toLocaleString('en-US', options);
  };

  // Format BTC with 8 decimal places
  const formatBTC = (satoshis: string | number): string => {
    if (!satoshis) return '0';
    
    const sats = typeof satoshis === 'string' ? parseFloat(satoshis.replace(/,/g, '')) : satoshis;
    if (isNaN(sats)) return '0';
    
    const btc = sats / 100000000;
    return btc.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-6">
  
        {/* Embedded SatoshiConverter */}
        <SatoshiConverter 
          onValuesChange={handleConversionChange}
          btcPriceOverride={btcPrice}
          className="mb-6"
        />

        {/* Top Tabs */}
        <div className="flex border-b border-border">
          <Button
            variant={calculatorMode === 'satsGoal' ? "default" : "ghost"}
            onClick={() => setCalculatorMode('satsGoal')}
            className={`rounded-b-none ${calculatorMode === 'satsGoal' ? 'bg-bitcoin-orange text-black hover:bg-bitcoin-orange/90' : ''}`}
          >
            Fixed Sats Goal
          </Button>
          <Button
            variant={calculatorMode === 'recurringBuy' ? "default" : "ghost"}
            onClick={() => setCalculatorMode('recurringBuy')}
            className={`ml-1 rounded-b-none ${calculatorMode === 'recurringBuy' ? 'bg-bitcoin-orange text-black hover:bg-bitcoin-orange/90' : ''}`}
          >
            Fixed Recurring Buy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Section (Left) */}
          <div className="md:col-span-1 space-y-4">
            {/* Bitcoin Unit */}
            <div className="space-y-2">
              <Label>Bitcoin Unit</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={bitcoinUnit === 'satoshi' ? "default" : "outline"}
                  onClick={() => setBitcoinUnit('satoshi')}
                  className={`w-full ${bitcoinUnit === 'satoshi' ? 'bg-muted hover:bg-muted/90' : ''}`}
                >
                  Satoshi
                </Button>
                <Button
                  variant={bitcoinUnit === 'bitcoin' ? "default" : "outline"}
                  onClick={() => setBitcoinUnit('bitcoin')}
                  className={`w-full ${bitcoinUnit === 'bitcoin' ? 'bg-muted hover:bg-muted/90' : ''}`}
                >
                  Bitcoin
                </Button>
              </div>
            </div>

            {/* Fiat Currency */}
            <div className="space-y-2">
              <Label>Fiat Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buying Frequency */}
            <div className="space-y-2">
              <Label>Buying Frequency</Label>
              <div className="grid grid-cols-4 gap-2">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((period) => (
                  <Button
                    key={period.toLowerCase()}
                    variant={frequency === period.toLowerCase() ? "default" : "outline"}
                    onClick={() => setFrequency(period.toLowerCase() as typeof frequency)}
                    className={`w-full ${frequency === period.toLowerCase() ? 'bg-muted hover:bg-muted/90' : ''}`}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sats Goal */}
            <div className="space-y-2">
              <Label>Sats Goal</Label>
              <div className="relative">
                <Input
                  ref={satsGoalInputRef}
                  type="text"
                  placeholder="10,000,000"
                  value={formatNumber(satsGoal)}
                  onChange={handleSatsGoalChange}
                  className="pr-20"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">
                  = {formatBTC(satsGoal)} BTC
                </span>
              </div>
            </div>

            {/* Goal Date */}
            <div className="space-y-2">
              <Label>Goal Date</Label>
              <div className="flex items-center space-x-2">
                <Select defaultValue="1_year" value={goalDuration} onValueChange={setGoalDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_year">2 Years</SelectItem>
                    <SelectItem value="5_year">5 Years</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="customDate" 
                    checked={customDateChecked}
                    onCheckedChange={(checked) => setCustomDateChecked(checked as boolean)}
                  />
                  <Label htmlFor="customDate" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Set Custom?</Label>
                </div>
              </div>
            </div>

            {/* Future Price Estimate */}
            <div className="space-y-2">
              <Label>Future Price Estimate</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="e.g., 4 Year CAGR: 9%"
                  value={customPriceChecked ? `${priceGrowth}%` : ''}
                  onChange={(e) => {
                    if (customPriceChecked) {
                      handlePriceGrowthChange(e);
                    }
                  }}
                  disabled={!customPriceChecked}
                  inputMode="decimal"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="customPrice"
                    checked={customPriceChecked}
                    onCheckedChange={(checked) => setCustomPriceChecked(checked as boolean)}
                  />
                  <Label htmlFor="customPrice" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Set Custom?</Label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <Button variant="secondary" className="w-full mt-4">
              Advanced Options
            </Button>
          </div>

          {/* Right Section */}
          <div className="md:col-span-2 space-y-4">
            {/* Summary Section */}
            <div className="w-full bg-muted/30 p-4 rounded-md border border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-bitcoin-orange rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-black"
                  >
                    <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${formatNumber(monthlyAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-muted-foreground">per month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    in bitcoin to accumulate {formatNumber(satsGoal)} sats by {
                      new Date(new Date().setMonth(new Date().getMonth() + (goalDuration === '1_year' ? 12 : goalDuration === '2_year' ? 24 : 60)))
                        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    }
                  </p>
                </div>
                <Button variant="secondary">Save</Button>
              </div>
            </div>

            {/* Chart Section */}
            <div className="w-full bg-muted/30 p-4 rounded-md border border-border">
              <CalculatorChart 
                chartData={chartData} 
                title="Satoshi Accumulation Forecast"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 