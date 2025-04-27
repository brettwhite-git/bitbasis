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
import { Slider } from "@/components/ui/slider"
import { CalculatorChart, ChartDataPoint } from "./calculator-chart"
import { SavingsGoalCalculator } from "./savings-goal-calculator"

// Helper function to get duration details
const getDurationDetails = (duration: string): { months: number, years: number, label: string } => {
  switch (duration) {
    case '1_month': return { months: 1, years: 1/12, label: '1 Month' };
    case '6_month': return { months: 6, years: 0.5, label: '6 Months' };
    case '3_year': return { months: 36, years: 3, label: '3 Years' };
    case '5_year': return { months: 60, years: 5, label: '5 Years' };
    case '10_year': return { months: 120, years: 10, label: '10 Years' };
    case '1_year':
    default: return { months: 12, years: 1, label: '1 Year' };
  }
};

// Helper function to get frequency details
const getFrequencyDetails = (frequency: string): { periodsPerYear: number, label: string } => {
  switch (frequency) {
    case 'daily': return { periodsPerYear: 365, label: 'Daily' };
    case 'monthly': return { periodsPerYear: 12, label: 'Monthly' };
    case 'yearly': return { periodsPerYear: 1, label: 'Yearly' };
    case 'weekly':
    default: return { periodsPerYear: 52, label: 'Weekly' };
  }
};

// Helper to add periods to a date
const addPeriods = (date: Date, frequency: string, count: number): Date => {
  const newDate = new Date(date);
  switch (frequency) {
    case 'daily': newDate.setDate(date.getDate() + count); break;
    case 'weekly': newDate.setDate(date.getDate() + count * 7); break;
    case 'monthly': newDate.setMonth(date.getMonth() + count); break;
    case 'yearly': newDate.setFullYear(date.getFullYear() + count); break;
  }
  return newDate;
};

// Helper to format date based on frequency (simplified for chart labels)
const formatDateLabel = (date: Date, frequency: string, totalPeriods: number): string => {
  // Always include year for clarity, adjust day presence based on frequency/duration
  const options: Intl.DateTimeFormatOptions = { month: 'short' }; // Start with month only

  // Always show day for daily frequency
  if (frequency === 'daily') {
    options.day = 'numeric';
  } 
  // Show day for weekly only if duration is <= 2 years
  else if (frequency === 'weekly' && totalPeriods <= 52 * 2) {
    options.day = 'numeric';
  } else {
    // Monthly/Yearly usually don't need the day part in labels
  }

  // Format month and potentially day
  const monthDayPart = date.toLocaleDateString('en-US', options);

  // Get 2-digit year and add apostrophe
  const yearPart = `'${date.getFullYear().toString().slice(-2)}`;

  // Combine parts
  return `${monthDayPart}${options.day ? ',' : ''} ${yearPart}`; // Add comma only if day is present
};

export function BitcoinCalculator() {
  const [calculatorMode, setCalculatorMode] = useState<'satsGoal' | 'recurringBuy' | 'savingsGoal'>('savingsGoal'); // Default to Savings Goal
  const [bitcoinUnit, setBitcoinUnit] = useState<'bitcoin' | 'satoshi'>('bitcoin');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [recurringBuyAmount, setRecurringBuyAmount] = useState('100'); // Default recurring buy amount
  const [satsGoal, setSatsGoal] = useState('0.1'); // Underlying goal stored ALWAYS as BTC string
  const [displayGoalValue, setDisplayGoalValue] = useState('0.1'); // Formatted value shown in the active input
  const [btcPrice, setBtcPrice] = useState(85000);
  const [priceGrowth, setPriceGrowth] = useState('48'); // Default 48% (1 year CAGR)
  const [monthlyAmount, setMonthlyAmount] = useState(''); // Kept for potential future use in 'recurringBuy'
  
  // Refs for cursor position
  const satsGoalInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number | null>(null);
  const [isUserEditing, setIsUserEditing] = useState(false);

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
  const chartData = useMemo((): ChartDataPoint[] | undefined => {
    const annualGrowthRate = parseFloat(priceGrowth) / 100;
    if (isNaN(annualGrowthRate)) return undefined;

    const { years: durationInYears } = getDurationDetails(goalDuration);
    const { periodsPerYear } = getFrequencyDetails(frequency);
    const totalPeriods = Math.round(durationInYears * periodsPerYear);
    if (totalPeriods <= 0) return undefined;

    const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
    const startDate = new Date();
    const result: ChartDataPoint[] = [];
    let currentPrice = btcPrice;
    let cumulativeSats = 0;

    // --- Calculations for Fixed Sats Goal Mode ---
    if (calculatorMode === 'satsGoal') {
      if (!satsGoal) return undefined;
      const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
      if (isNaN(btcGoal) || btcGoal <= 0) return undefined;

      const totalSatsGoal = Math.round(btcGoal * 100000000);
      const satsPerPeriod = Math.round(totalSatsGoal / totalPeriods);
      if (satsPerPeriod <= 0 && totalSatsGoal > 0) return undefined;

      for (let i = 0; i < totalPeriods; i++) {
        const periodDate = addPeriods(startDate, frequency, i);
        const estimatedPriceThisPeriod = currentPrice;
        const btcNeededThisPeriod = satsPerPeriod / 100000000;
        const usdNeededThisPeriod = btcNeededThisPeriod * estimatedPriceThisPeriod;
        cumulativeSats += satsPerPeriod;
        const finalSats = (i === totalPeriods - 1) ? totalSatsGoal : cumulativeSats;

        result.push({
          date: formatDateLabel(periodDate, frequency, totalPeriods),
          accumulatedSats: finalSats,
          periodicSats: satsPerPeriod,
          estimatedBtcPrice: estimatedPriceThisPeriod,
          usdValueThisPeriod: usdNeededThisPeriod,
          cumulativeUsdValue: finalSats / 100000000 * estimatedPriceThisPeriod
        });
        currentPrice *= (1 + periodicGrowthRate);
      }

      if (result.length > 0) {
         const lastPoint = result[result.length - 1];
         const finalPrice = currentPrice;
         if (lastPoint) {
           lastPoint.cumulativeUsdValue = totalSatsGoal / 100000000 * finalPrice;
           const previousAccumulatedSats = result.length > 1 ? result[result.length - 2]?.accumulatedSats || 0 : 0;
           const satsInLastPeriod = totalSatsGoal - previousAccumulatedSats;
           lastPoint.periodicSats = satsInLastPeriod;
           const priceForLastPeriodCalc = lastPoint.estimatedBtcPrice ?? finalPrice;
           lastPoint.usdValueThisPeriod = (satsInLastPeriod / 100000000) * priceForLastPeriodCalc;
         }
      }
      return result;
    }
    // --- Calculations for Fixed Recurring Buy Mode ---
    else if (calculatorMode === 'recurringBuy') {
      const recurringUSD = parseFloat(recurringBuyAmount);
      if (isNaN(recurringUSD) || !recurringBuyAmount || recurringUSD <= 0) return undefined;

      for (let i = 0; i < totalPeriods; i++) {
        const periodDate = addPeriods(startDate, frequency, i);
        const estimatedPriceThisPeriod = currentPrice;
        const btcBoughtThisPeriod = recurringUSD / estimatedPriceThisPeriod;
        const satsBoughtThisPeriod = Math.round(btcBoughtThisPeriod * 100000000);
        cumulativeSats += satsBoughtThisPeriod;

        result.push({
          date: formatDateLabel(periodDate, frequency, totalPeriods),
          accumulatedSats: cumulativeSats,
          periodicSats: satsBoughtThisPeriod,
          estimatedBtcPrice: estimatedPriceThisPeriod,
          usdValueThisPeriod: recurringUSD,
          cumulativeUsdValue: cumulativeSats / 100000000 * estimatedPriceThisPeriod
        });
        currentPrice *= (1 + periodicGrowthRate);
      }

      if (result.length > 0) {
         const lastPoint = result[result.length - 1];
         const finalPrice = currentPrice;
         if (lastPoint) {
           lastPoint.cumulativeUsdValue = lastPoint.accumulatedSats / 100000000 * finalPrice;
         }
      }
      return result;
    }

    // Fallback if mode is somehow invalid (shouldn't happen)
    return undefined;
  }, [
    calculatorMode,
    satsGoal, // Dependency for satsGoal mode
    recurringBuyAmount, // Dependency for recurringBuy mode
    goalDuration,
    btcPrice,
    priceGrowth,
    frequency
  ]);

  // Aggregate chart data for better visualization on long daily frequencies
  const aggregatedChartData = useMemo((): ChartDataPoint[] | undefined => {
    if (!chartData || !chartData.length) return undefined;

    const { years: durationInYears } = getDurationDetails(goalDuration);
    const startDateForCalc = new Date(); // Base date for calculations

    // Aggregate to weekly if daily frequency and duration > 6 months
    if (frequency === 'daily' && durationInYears > 0.5) {
      const weeklyData: ChartDataPoint[] = [];
      let weekSats = 0;
      let weekUsd = 0; // Use this to sum usdValueThisPeriod for the week
      let lastPointOfWeek: ChartDataPoint | null = null;
      let weekStartDateLabel = '';

      chartData.forEach((point, index) => {
        const isStartOfWeek = index % 7 === 0;
        const periodDate = addPeriods(startDateForCalc, frequency, index);

        if (isStartOfWeek) {
          // Push previous week's data if it exists
          if (lastPointOfWeek) {
            weeklyData.push({
              ...lastPointOfWeek, // Carries over accumulatedSats, cumulativeUsdValue, est. price from week end
              date: weekStartDateLabel, // Label with the start date of the week
              periodicSats: weekSats,
              usdValueThisPeriod: weekUsd, // Sum of USD invested during the week
            });
          }
          // Reset for new week
          weekSats = 0;
          weekUsd = 0;
          weekStartDateLabel = formatDateLabel(periodDate, frequency, chartData.length); // Format start date
        }

        // Accumulate stats for the current week
        weekSats += point.periodicSats;
        weekUsd += point.usdValueThisPeriod || 0; // Sum the USD value for the week
        lastPointOfWeek = point; // Keep track of the last point of the week

        // Push the last week's data if it's the end of the loop
        if (index === chartData.length - 1 && lastPointOfWeek) {
           weeklyData.push({
              ...lastPointOfWeek,
              date: weekStartDateLabel,
              periodicSats: weekSats,
              usdValueThisPeriod: weekUsd,
           });
        }
      });
      return weeklyData;
    }

    // Otherwise, return the original data (no aggregation needed)
    return chartData;
  }, [chartData, frequency, goalDuration]);

  const isValidSatsInputValue = (value: string): boolean => {
    // Allow empty input
    if (value === '') return true;
    // Remove existing commas for validation
    const cleanValue = value.replace(/,/g, '');
    // Allow only whole numbers (no decimals for sats)
    return /^[0-9]+$/.test(cleanValue) && !cleanValue.includes('.');
  };

  // Handler for the BTC input field
  const handleBtcGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserEditing(true);
    
    // Save cursor position
    if (satsGoalInputRef.current) {
      cursorPositionRef.current = satsGoalInputRef.current.selectionStart;
    }
    
    const value = e.target.value;
    
    setDisplayGoalValue(value); // Update the display value directly
  };

  // Handler for the Sats input field
  const handleSatsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserEditing(true);
    
    // Save cursor position
    if (satsGoalInputRef.current) {
      cursorPositionRef.current = satsGoalInputRef.current.selectionStart;
    }
    
    const value = e.target.value;
    
    // Validate input (allow only whole numbers)
    if (!isValidSatsInputValue(value)) {
        return; // Reject invalid input
    }
    
    // Remove commas and convert to number
    const cleanValue = value.replace(/,/g, '');
    const satsNum = parseInt(cleanValue, 10);
    
    // Update display value
    setDisplayGoalValue(formatNumber(cleanValue)); // Format with commas for display
    
    // Convert sats to BTC string for internal state, handle 0/NaN case
    if (isNaN(satsNum) || satsNum === 0) {
      setSatsGoal('0');
    } else {
      const btcValue = satsNum / 100000000;
      // Format to avoid scientific notation and ensure sufficient precision
      setSatsGoal(btcValue.toFixed(8));
    }
  };

  // Update displayGoalValue whenever satsGoal (underlying BTC value) or bitcoinUnit changes
  useEffect(() => {
    if (isUserEditing) return; // Don't reformat while user is typing
    
    const btcNum = parseFloat(satsGoal); // Parse the underlying BTC value
    if (isNaN(btcNum)) {
        setDisplayGoalValue('0'); // Reset display if underlying is invalid
        return;
    }
    
    if (bitcoinUnit === 'satoshi') {
      const satsValue = Math.round(btcNum * 100000000);
      setDisplayGoalValue(formatNumber(satsValue)); // Format as Sats string
    } else {
      // Format as BTC string - use satsGoal directly if it's just a decimal point
      setDisplayGoalValue(satsGoal === '.' ? '.' : formatNumber(satsGoal, { minimumFractionDigits: 1, maximumFractionDigits: 8 }));
    }
  }, [satsGoal, bitcoinUnit, isUserEditing]);

  // Handler for the Recurring Buy Amount input field
  const handleRecurringBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic validation: allow digits, one decimal point, max 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setRecurringBuyAmount(value);
    }
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

  // Format currency (USD)
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Convert BTC to sats
  const btcToSats = (btc: string): string => {
    const btcNum = parseFloat(btc);
    if (isNaN(btcNum)) return '0';
    // Use rounding for conversion, then format
    return Math.round(btcNum * 100000000).toLocaleString();
  };

  // Convert Sats string (potentially with commas) to BTC string
  const satsToBtc = (sats: string): string => {
    const cleanSats = sats.replace(/,/g, '');
    const satsNum = parseInt(cleanSats, 10);
    if (isNaN(satsNum) || satsNum === 0) return formatBTC('0');
    return formatBTC(satsNum / 100000000);
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-6">
  
        {/* Top Tabs - Reordered and Renamed */}
        <div className="flex border-b border-border">
          {/* Savings Goal Tab (Moved First) */}
          <Button
            variant="ghost"
            onClick={() => setCalculatorMode('savingsGoal')}
            className={`rounded-b-none border-b-2 ${
              calculatorMode === 'savingsGoal' 
                ? 'border-bitcoin-orange text-bitcoin-orange' 
                : 'border-transparent hover:border-border hover:bg-transparent'
            }`}
          >
            Savings Goal
          </Button>
          {/* Fixed Goal Tab (Renamed) */}
          <Button
            variant="ghost"
            onClick={() => setCalculatorMode('satsGoal')}
            className={`ml-1 rounded-b-none border-b-2 ${
              calculatorMode === 'satsGoal' 
                ? 'border-bitcoin-orange text-bitcoin-orange' 
                : 'border-transparent hover:border-border hover:bg-transparent'
            }`}
          >
            Fixed Goal
          </Button>
          {/* Recurring Goal Tab (Renamed) */}
          <Button
            variant="ghost"
            onClick={() => setCalculatorMode('recurringBuy')}
            className={`ml-1 rounded-b-none border-b-2 ${
              calculatorMode === 'recurringBuy' 
                ? 'border-bitcoin-orange text-bitcoin-orange' 
                : 'border-transparent hover:border-border hover:bg-transparent'
            }`}
          >
            Recurring Goal
          </Button>
        </div>

        {/* Conditional Rendering based on Mode */}
        {calculatorMode === 'savingsGoal' ? (
          // Render SavingsGoalCalculator directly, taking full width
          <SavingsGoalCalculator />
        ) : (
          // Original layout for other modes
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input Section (Left) */}
            <div className="md:col-span-1">
              <div className="h-full p-4 rounded-md border border-border bg-muted/30 space-y-4 flex flex-col">
                {/* Bitcoin Unit */}
                <div className="space-y-2">
                  <Label>Bitcoin Unit</Label>
                  <RadioGroup value={bitcoinUnit} onValueChange={(value) => setBitcoinUnit(value as 'bitcoin' | 'satoshi')} className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bitcoin" id="bitcoin" className="peer sr-only" />
                      <Label
                        htmlFor="bitcoin"
                        className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
                      >
                        Bitcoin
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="satoshi" id="satoshi" className="peer sr-only" />
                      <Label
                        htmlFor="satoshi"
                        className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
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
                    <SelectTrigger className="bg-background border-input">
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
                          className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange text-center capitalize text-xs sm:text-sm"
                        >
                          {getFrequencyDetails(period).label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Mode-specific inputs */}
                {calculatorMode === 'satsGoal' && (
                  <div className="space-y-2">
                    <Label>BTC Goal</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {bitcoinUnit === 'bitcoin' ? (
                        <>
                          {/* BTC Input Field */}
                          <div className="relative">
                            <Input
                              ref={satsGoalInputRef}
                              type="text"
                              placeholder="0.1"
                              value={displayGoalValue} // Show formatted BTC
                              onChange={handleBtcGoalChange}
                              className="pr-16 bg-muted/50 border-input"
                              inputMode="decimal"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                              BTC
                            </span>
                          </div>
                          {/* Sats Display Field */}
                          <div className="relative">
                            <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background h-10">
                              <span className="text-sm mr-2 text-muted-foreground">=</span>
                              <span className="flex-1 text-sm font-medium">{btcToSats(satsGoal)}</span>
                              <span className="ml-1 text-sm text-muted-foreground">sats</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Sats Input Field */}
                          <div className="relative">
                            <Input
                              ref={satsGoalInputRef}
                              type="text"
                              placeholder="10,000,000"
                              value={displayGoalValue} // Show formatted Sats
                              onChange={handleSatsInputChange}
                              className="pr-16 bg-muted/50 border-input"
                              inputMode="numeric" // Use numeric for sats
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                              sats
                            </span>
                          </div>
                          {/* BTC Display Field */}
                          <div className="relative">
                            <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background h-10">
                              <span className="text-sm mr-2 text-muted-foreground">=</span>
                              <span className="flex-1 text-sm font-medium">{formatBTC(satsGoal)}</span>
                              <span className="ml-1 text-sm text-muted-foreground">BTC</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {calculatorMode === 'recurringBuy' && (
                  <div className="space-y-2">
                    <Label>Recurring Buy Amount</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="100"
                        value={recurringBuyAmount} // Display the raw state value
                        onChange={handleRecurringBuyAmountChange}
                        className="pl-8 pr-10 bg-muted/50 border-input" // Padding for symbols
                        inputMode="decimal"
                      />
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                        $
                      </span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                        USD
                      </span>
                    </div>
                  </div>
                )}

                {/* Goal Date & Future Price Estimate - Common for these two modes */}
                <div className="space-y-2">
                  <Label>Goal Date</Label>
                  <div className="space-y-4">
                    <div className="relative pt-5">
                      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-1">
                        <span>1M</span>
                        <span>6M</span>
                        <span>1Y</span>
                        <span>3Y</span>
                        <span>5Y</span>
                        <span>10Y</span>
                      </div>
                      <Slider
                        min={0}
                        max={5}
                        step={1}
                        value={[
                          goalDuration === '1_month' ? 0 :
                          goalDuration === '6_month' ? 1 :
                          goalDuration === '1_year' ? 2 :
                          goalDuration === '3_year' ? 3 :
                          goalDuration === '5_year' ? 4 : 5
                        ]}
                        onValueChange={(value) => {
                          const index = value[0];
                          const newDuration =
                            index === 0 ? '1_month' :
                            index === 1 ? '6_month' :
                            index === 2 ? '1_year' :
                            index === 3 ? '3_year' :
                            index === 4 ? '5_year' : '10_year';
                          setGoalDuration(newDuration);
                        }}
                        className="w-full cursor-pointer h-2 rounded-lg appearance-none bg-muted dark:bg-gray-700"
                      />
                    </div>
                    <div className="text-center font-medium dark:text-gray-100">
                      {getDurationDetails(goalDuration).label}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">Future Price Estimate</Label>
                  <div className="space-y-4">
                    <div className="relative pt-5">
                      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-muted-foreground dark:text-gray-400 px-1">
                        <span>48%</span>
                        <span>85%</span>
                        <span>15%</span>
                        <span>72%</span>
                        <span>65%</span>
                        <span>74%</span>
                        <span>84%</span>
                        <span>75%</span>
                      </div>
                      <Slider
                        min={0}
                        max={7}
                        step={1}
                        value={[
                          priceGrowth === '48' ? 0 :
                          priceGrowth === '85' ? 1 :
                          priceGrowth === '15' ? 2 :
                          priceGrowth === '72' ? 3 :
                          priceGrowth === '65' ? 4 :
                          priceGrowth === '74' ? 5 :
                          priceGrowth === '84' ? 6 : 7
                        ]}
                        onValueChange={(value) => {
                          const index = value[0];
                          setPriceGrowth(
                            index === 0 ? '48' :
                            index === 1 ? '85' :
                            index === 2 ? '15' :
                            index === 3 ? '72' :
                            index === 4 ? '65' :
                            index === 5 ? '74' :
                            index === 6 ? '84' : '75'
                          );
                        }}
                        className="w-full cursor-pointer h-2 rounded-lg appearance-none bg-muted dark:bg-gray-700"
                      />
                    </div>
                    <div className="text-center font-medium dark:text-gray-100">
                      CAGR: {priceGrowth}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section (Chart for non-Savings Goal modes) */}
            <div className="md:col-span-2 space-y-4">
              <div className="h-full w-full rounded-md border border-border bg-background overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Satoshi Accumulation Forecast</h3>
                </div>
                <div className="px-4 py-6 flex-grow">
                  <CalculatorChart
                    chartData={aggregatedChartData} // Use aggregated data here
                    title=""
                    bitcoinUnit={bitcoinUnit}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Width Table Section (for non-Savings Goal modes) */}
        {calculatorMode !== 'savingsGoal' && (
          <div className="mt-10 w-full">
            <div className="w-full rounded-md border border-border bg-background overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Accumulation Details</h3>
              </div>
              <div className="w-full overflow-x-auto p-0">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{getFrequencyDetails(frequency).label} Date</th> 
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{bitcoinUnit === 'satoshi' ? 'Sats' : 'BTC'} Stacked</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{calculatorMode === 'satsGoal' ? 'Est. Cost' : 'Amount Invested'}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Total {bitcoinUnit === 'satoshi' ? 'Sats' : 'BTC'}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{calculatorMode === 'satsGoal' ? 'Est. Total Cost' : 'Total Invested'}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Est. BTC Price</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Est. Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData && chartData.length > 0 ? (
                      chartData.map((point, index) => {
                        const originalIndex = index;
                        const isFirstRow = index === 0;
                        const isLastRow = originalIndex === chartData.length - 1;
                        const rowTextColorClass = (isFirstRow || isLastRow) ? 'font-medium' : '';
                        const totalInvested = calculatorMode === 'recurringBuy'
                          ? (originalIndex + 1) * parseFloat(recurringBuyAmount.replace(/,/g, '') || '0')
                          : (chartData || []).slice(0, originalIndex + 1).reduce((sum, p) => sum + (p.usdValueThisPeriod || 0), 0);

                        return (
                          <tr key={point.date + '-' + originalIndex}
                            className={`border-b border-border ${originalIndex % 2 === 0 ? 'bg-muted/5' : 'bg-transparent'} hover:bg-muted/10`}>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{point.date}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.periodicSats) : formatBTC(point.periodicSats / 100000000)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.usdValueThisPeriod)}</td> 
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.accumulatedSats) : formatBTC(point.accumulatedSats / 100000000)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(totalInvested)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.estimatedBtcPrice)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.cumulativeUsdValue)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted-foreground dark:text-gray-500">
                          Enter details above to see accumulation forecast.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 