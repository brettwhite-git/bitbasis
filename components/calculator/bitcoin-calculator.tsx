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
  const [satsGoal, setSatsGoal] = useState('10000000'); // 0.1 BTC default (10M sats)
  const [btcPrice, setBtcPrice] = useState(65000); // Default BTC price
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [priceGrowth, setPriceGrowth] = useState('9'); // Default 9% annual growth
  
  // Refs for cursor position
  const satsGoalInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [isUserEditing, setIsUserEditing] = useState(false);

  // Calculate monthly amount needed to reach sats goal
  useEffect(() => {
    if (!satsGoal) return;
    
    const satsGoalNum = parseFloat(satsGoal.replace(/,/g, ''));
    if (isNaN(satsGoalNum)) return;

    // Get number of months based on duration
    let months = 12;
    if (goalDuration === '1_month') months = 1;
    if (goalDuration === '6_month') months = 6;
    if (goalDuration === '3_year') months = 36;
    if (goalDuration === '5_year') months = 60;
    if (goalDuration === '10_year') months = 120;
    
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
    if (goalDuration === '1_month') months = 1;
    if (goalDuration === '6_month') months = 6;
    if (goalDuration === '3_year') months = 36;
    if (goalDuration === '5_year') months = 60;
    if (goalDuration === '10_year') months = 120;
    
    // Generate dates for the chart
    const startDate = new Date();
    const result: ChartDataPoint[] = [];
    
    let currentPrice = btcPrice;
    let cumulativeSats = 0;
    
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      
      // Always apply price growth based on selected rate
      if (i > 0) {
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
  }, [satsGoal, monthlyAmount, goalDuration, btcPrice, priceGrowth]);

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
                    className="flex-1 cursor-pointer rounded-md border-2 border-muted p-4 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10"
                  >
                    Bitcoin
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satoshi" id="satoshi" className="peer sr-only" />
                  <Label
                    htmlFor="satoshi"
                    className="flex-1 cursor-pointer rounded-md border-2 border-muted p-4 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10"
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
                    <span>9%</span>
                    <span>65%</span>
                    <span>22%</span>
                    <span>7%</span>
                    <span>57%</span>
                    <span>68%</span>
                    <span>78%</span>
                    <span>62%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    step="1"
                    value={
                      priceGrowth === '9' ? 0 :
                      priceGrowth === '65' ? 1 :
                      priceGrowth === '22' ? 2 :
                      priceGrowth === '7' ? 3 :
                      priceGrowth === '57' ? 4 :
                      priceGrowth === '68' ? 5 :
                      priceGrowth === '78' ? 6 : 7
                    }
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPriceGrowth(
                        value === 0 ? '9' :
                        value === 1 ? '65' :
                        value === 2 ? '22' :
                        value === 3 ? '7' :
                        value === 4 ? '57' :
                        value === 5 ? '68' :
                        value === 6 ? '78' : '62'
                      );
                    }}
                    className="w-full accent-bitcoin-orange cursor-pointer h-2 rounded-lg appearance-none bg-muted"
                  />
                </div>
                <div className="text-center font-medium">
                  {priceGrowth === '9' ? '1 Year CAGR: 9%' :
                  priceGrowth === '65' ? '2 Year CAGR: 65%' :
                  priceGrowth === '22' ? '3 Year CAGR: 22%' :
                  priceGrowth === '7' ? '4 Year CAGR: 7%' :
                  priceGrowth === '57' ? '6 Year CAGR: 57%' :
                  priceGrowth === '68' ? '8 Year CAGR: 68%' :
                  priceGrowth === '78' ? '10 Year CAGR: 78%' : '12 Year CAGR: 62%'}
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