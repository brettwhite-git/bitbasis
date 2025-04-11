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

export function BitcoinCalculator() {
  const [calculatorMode, setCalculatorMode] = useState('satsGoal'); // 'satsGoal' or 'recurringBuy'
  const [bitcoinUnit, setBitcoinUnit] = useState('bitcoin');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [satsGoal, setSatsGoal] = useState('0.1'); // 0.1 BTC default
  const [btcPrice, setBtcPrice] = useState(83729); // Current BTC price in USD
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [priceGrowth, setPriceGrowth] = useState('48'); // Default 48% (1 year CAGR)
  
  // Refs for cursor position
  const satsGoalInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [isUserEditing, setIsUserEditing] = useState(false);

  // Calculate monthly amount needed to reach BTC goal
  useEffect(() => {
    if (!satsGoal) return;
    
    const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
    if (isNaN(btcGoal)) return;

    // Get number of months based on duration
    let months = 12;
    if (goalDuration === '1_month') months = 1;
    if (goalDuration === '6_month') months = 6;
    if (goalDuration === '3_year') months = 36;
    if (goalDuration === '5_year') months = 60;
    if (goalDuration === '10_year') months = 120;
    
    // Calculate monthly dollar amount needed
    const totalUSD = btcGoal * btcPrice;
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
    
    const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
    const monthlyUSD = parseFloat(monthlyAmount);
    if (isNaN(btcGoal) || isNaN(monthlyUSD)) return undefined;
    
    // Get number of months based on duration
    let months = 12;
    if (goalDuration === '1_month') months = 1;
    if (goalDuration === '6_month') months = 6;
    if (goalDuration === '3_year') months = 36;
    if (goalDuration === '5_year') months = 60;
    if (goalDuration === '10_year') months = 120;
    
    // Generate dates for the chart
    const startDate = new Date();
    const result: ChartDataPoint[] = [];
    
    let currentPrice = btcPrice;
    let cumulativeBTC = 0;
    
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      
      // Apply price growth based on selected rate
      if (i > 0) {
        const growthRate = parseFloat(priceGrowth) / 100 / 12; // Monthly growth rate
        currentPrice *= (1 + growthRate);
      }
      
      // Calculate how much BTC can be bought with monthly amount
      const monthlyBTC = monthlyUSD / currentPrice;
      cumulativeBTC += monthlyBTC;
      
      result.push({
        date: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        accumulatedSats: Math.round(cumulativeBTC * 100000000), // Convert BTC to sats
        periodicSats: Math.round(monthlyBTC * 100000000) // Convert BTC to sats
      });
    }
    
    return result;
  }, [satsGoal, monthlyAmount, goalDuration, btcPrice, priceGrowth]);

  const isValidSatsInput = (value: string): boolean => {
    // Allow empty input and decimal points
    if (value === '' || value === '.') return true;
    
    // Remove existing commas for validation
    const cleanValue = value.replace(/,/g, '');
    
    // Allow decimal numbers
    return /^\d*\.?\d*$/.test(cleanValue);
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
    
    // Remove commas for storage
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

  // Format BTC with 8 decimal places
  const formatBTC = (btc: string | number): string => {
    if (!btc) return '0';
    
    const value = typeof btc === 'string' ? parseFloat(btc.replace(/,/g, '')) : btc;
    if (isNaN(value)) return '0';
    
    return value.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
  };

  // Format number with commas and optional decimal places
  const formatNumber = (value: string | number, options?: Intl.NumberFormatOptions): string => {
    if (value === '' || value === undefined || value === null) return '';
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return typeof value === 'string' ? value : '';
    
    return num.toLocaleString('en-US', options);
  };

  // Convert BTC to sats
  const btcToSats = (btc: string): string => {
    const btcNum = parseFloat(btc);
    if (isNaN(btcNum)) return '0';
    return (btcNum * 100000000).toLocaleString();
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-6">
  
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
          <div className="md:col-span-1">
            <div className="h-full p-4 rounded-md border border-border bg-muted/30 space-y-4 flex flex-col">
            {/* Bitcoin Unit */}
            <div className="space-y-2">
              <Label>Bitcoin Unit</Label>
              <RadioGroup value={bitcoinUnit} onValueChange={setBitcoinUnit} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bitcoin" id="bitcoin" className="peer sr-only" />
                  <Label
                    htmlFor="bitcoin"
                    className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10"
                  >
                    Bitcoin
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satoshi" id="satoshi" className="peer sr-only" />
                  <Label
                    htmlFor="satoshi"
                    className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10"
                  >
                    Satoshi
                  </Label>
                </div>
              </RadioGroup>
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
              <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-4 gap-2">
                {["daily", "weekly", "monthly", "yearly"].map((period) => (
                  <div key={period} className="flex items-center space-x-2">
                    <RadioGroupItem value={period} id={period} className="peer sr-only" />
                    <Label
                      htmlFor={period}
                      className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 text-center capitalize"
                    >
                      {period}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* BTC Goal */}
            <div className="space-y-2">
              <Label>BTC Goal</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    ref={satsGoalInputRef}
                    type="text"
                    placeholder="0.1"
                    value={formatNumber(satsGoal, { minimumFractionDigits: 1, maximumFractionDigits: 8 })}
                    onChange={handleSatsGoalChange}
                    className="pr-16"
                    inputMode="decimal"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                    BTC
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground">=</span>
                  <span className="flex-1 text-center text-sm text-muted-foreground">
                    {btcToSats(satsGoal)} sats
                  </span>
                </div>
              </div>
            </div>

            {/* Goal Date */}
            <div className="space-y-2">
              <Label>Goal Date</Label>
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>1M</span>
                    <span>6M</span>
                    <span>1Y</span>
                    <span>3Y</span>
                    <span>5Y</span>
                    <span>10Y</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={
                      goalDuration === '1_month' ? 0 :
                      goalDuration === '6_month' ? 1 :
                      goalDuration === '1_year' ? 2 :
                      goalDuration === '3_year' ? 3 :
                      goalDuration === '5_year' ? 4 : 5
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setGoalDuration(
                        value === 0 ? '1_month' :
                        value === 1 ? '6_month' :
                        value === 2 ? '1_year' :
                        value === 3 ? '3_year' :
                        value === 4 ? '5_year' : '10_year'
                      );
                    }}
                    className="w-full accent-bitcoin-orange cursor-pointer h-2 rounded-lg appearance-none bg-muted"
                  />
                </div>
                <div className="text-center font-medium">
                  {goalDuration === '1_month' ? '1 Month' :
                   goalDuration === '6_month' ? '6 Months' :
                   goalDuration === '1_year' ? '1 Year' :
                   goalDuration === '3_year' ? '3 Years' :
                   goalDuration === '5_year' ? '5 Years' : '10 Years'}
                </div>
              </div>
            </div>

            {/* Future Price Estimate */}
            <div className="space-y-2">
              <Label>Future Price Estimate</Label>
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>1Y</span>
                    <span>2Y</span>
                    <span>4Y</span>
                    <span>5Y</span>
                    <span>6Y</span>
                    <span>8Y</span>
                    <span>10Y</span>
                    <span>12Y</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={
                      priceGrowth === '48' ? 0 :
                      priceGrowth === '85' ? 1 :
                      priceGrowth === '15' ? 2 :
                      priceGrowth === '72' ? 3 :
                      priceGrowth === '65' ? 4 :
                      priceGrowth === '74' ? 5 :
                      priceGrowth === '84' ? 6 : 7
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPriceGrowth(
                        value === 0 ? '48' :
                        value === 1 ? '85' :
                        value === 2 ? '15' :
                        value === 3 ? '72' :
                        value === 4 ? '65' :
                        value === 5 ? '74' :
                        value === 6 ? '84' : '75'
                      );
                    }}
                    className="w-full accent-bitcoin-orange cursor-pointer h-2 rounded-lg appearance-none bg-muted"
                  />
                </div>
                <div className="text-center font-medium">
                  CAGR: {priceGrowth}%
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="md:col-span-2 space-y-4">
            {/* Chart Section */}
            <div className="h-full w-full bg-muted/30 rounded-md border border-border overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-bitcoin-orange/20 to-transparent px-4 py-3 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Satoshi Accumulation Forecast</h3>
              </div>
              <div className="px-4 py-6 flex-grow">
                <CalculatorChart 
                  chartData={chartData} 
                  title=""
                  btcPrice={btcPrice}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Table Section */}
        <div className="mt-10 w-full">
          <div className="w-full bg-muted/30 rounded-md border border-border overflow-hidden">
            <div className="bg-gradient-to-r from-bitcoin-orange/20 to-transparent px-4 py-3 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Accumulation Details</h3>
            </div>
            <div className="w-full overflow-x-auto p-0">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Week</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Sats Stacked</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Fiat Gain</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Total Exchanged</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Total Sats</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Total Fiat Gain</th>
                    <th className="w-1/7 text-center py-2 px-3 font-medium">Total Fiat Value</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData && chartData.map((point, index) => {
                    // Calculate values for table
                    const monthlyInstallment = parseFloat(monthlyAmount);
                    const periodAmount = monthlyInstallment / (12 / chartData.length);
                    // Always apply price growth based on selected rate
                    const currentPrice = btcPrice * Math.pow(1 + parseFloat(priceGrowth) / 100 / 12, index);
                    
                    const satStacked = point.periodicSats;
                    const fiatGain = "$0.00"; // In this example, Fiat Gain is fixed
                    const totalExchanged = periodAmount.toFixed(2);
                    const totalSats = point.accumulatedSats;
                    const totalFiatGain = "$0.00"; // In this example, Total Fiat Gain is fixed
                    const totalFiatValue = (currentPrice * totalSats / 100000000).toFixed(2);
                    
                    return (
                      <tr key={point.date} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="w-1/7 text-center py-2 px-3">{point.date}</td>
                        <td className="w-1/7 text-center py-2 px-3">{formatNumber(satStacked)}</td>
                        <td className="w-1/7 text-center py-2 px-3">{fiatGain}</td>
                        <td className="w-1/7 text-center py-2 px-3">${totalExchanged}</td>
                        <td className="w-1/7 text-center py-2 px-3">{formatNumber(totalSats)}</td>
                        <td className="w-1/7 text-center py-2 px-3">{totalFiatGain}</td>
                        <td className="w-1/7 text-center py-2 px-3">${totalFiatValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 