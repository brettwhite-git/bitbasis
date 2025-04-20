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
  const [calculatorMode, setCalculatorMode] = useState('satsGoal'); // 'satsGoal' or 'recurringBuy'
  const [bitcoinUnit, setBitcoinUnit] = useState('bitcoin');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [satsGoal, setSatsGoal] = useState('0.1'); // 0.1 BTC default
  const [btcPrice, setBtcPrice] = useState(85000); // Updated initial price
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [priceGrowth, setPriceGrowth] = useState('48'); // Default 48% (1 year CAGR)
  
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

  // Generate chart data based on inputs (Refactored for Fixed Sats Goal)
  const chartData = useMemo((): ChartDataPoint[] | undefined => {
    if (calculatorMode !== 'satsGoal' || !satsGoal) return undefined; // Only run for satsGoal mode

    const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
    const annualGrowthRate = parseFloat(priceGrowth) / 100;
    if (isNaN(btcGoal) || isNaN(annualGrowthRate) || btcGoal <= 0) return undefined;

    const { years: durationInYears } = getDurationDetails(goalDuration);
    const { periodsPerYear } = getFrequencyDetails(frequency);
    const totalPeriods = Math.round(durationInYears * periodsPerYear);

    if (totalPeriods <= 0) return undefined;

    const totalSatsGoal = Math.round(btcGoal * 100000000);
    const satsPerPeriod = Math.round(totalSatsGoal / totalPeriods);
    if (satsPerPeriod <= 0) return undefined; // Avoid division by zero or nonsensical scenarios

    // Calculate periodic growth rate from annual rate
    const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;

    const startDate = new Date();
    const result: ChartDataPoint[] = [];
    let currentPrice = btcPrice;
    let cumulativeSats = 0;
    let cumulativeUSD = 0;

    for (let i = 0; i < totalPeriods; i++) {
      const periodDate = addPeriods(startDate, frequency, i);

      // Estimate price for the *start* of this period
      // Price grows *after* the investment for the period is made
      const estimatedPriceThisPeriod = currentPrice;

      // Calculate USD needed for this period's sats goal
      const btcNeededThisPeriod = satsPerPeriod / 100000000;
      const usdNeededThisPeriod = btcNeededThisPeriod * estimatedPriceThisPeriod;

      cumulativeSats += satsPerPeriod;
      cumulativeUSD += usdNeededThisPeriod;

      // Ensure the last period exactly reaches the goal
      const finalSats = (i === totalPeriods - 1) ? totalSatsGoal : cumulativeSats;

      result.push({
        date: formatDateLabel(periodDate, frequency, totalPeriods),
        accumulatedSats: finalSats,
        periodicSats: satsPerPeriod, // Constant sats added each period
        estimatedBtcPrice: estimatedPriceThisPeriod,
        usdValueThisPeriod: usdNeededThisPeriod,
        cumulativeUsdValue: finalSats / 100000000 * estimatedPriceThisPeriod // Value at the end of the period
      });

      // Update price for the *next* period
      currentPrice *= (1 + periodicGrowthRate);
    }

     // Ensure the very last data point reflects the final target sats
     if (result.length > 0) {
        const lastPoint = result[result.length - 1];
        // Recalculate final USD value based on final price estimate
        const finalPrice = currentPrice; // Price after the last period's growth
        if (lastPoint) {
          lastPoint.cumulativeUsdValue = totalSatsGoal / 100000000 * finalPrice;

          // Adjust last period's sats if needed due to rounding
          const previousAccumulatedSats = result.length > 1 ? result[result.length - 2]?.accumulatedSats || 0 : 0;
          const satsInLastPeriod = totalSatsGoal - previousAccumulatedSats;
          lastPoint.periodicSats = satsInLastPeriod;

          // Use fallback for potentially undefined estimated price on the last point
          const priceForLastPeriodCalc = lastPoint.estimatedBtcPrice ?? finalPrice; 
          lastPoint.usdValueThisPeriod = (satsInLastPeriod / 100000000) * priceForLastPeriodCalc;
        }
     }


    return result;
  }, [satsGoal, goalDuration, btcPrice, priceGrowth, frequency, calculatorMode]);

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

  // Format currency (USD)
  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Convert BTC to sats
  const btcToSats = (btc: string): string => {
    const btcNum = parseFloat(btc);
    if (isNaN(btcNum)) return '0';
    // Use rounding for potentially large numbers to avoid precision issues before formatting
    return Math.round(btcNum * 100000000).toLocaleString();
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
                      className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 text-center capitalize text-xs sm:text-sm"
                    >
                      {getFrequencyDetails(period).label}
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
                    className="pr-16 bg-muted/50 border-muted"
                    inputMode="decimal"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                    BTC
                  </span>
                </div>
                <div className="relative">
                  <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <span className="text-sm mr-2">=</span>
                    <span className="flex-1 text-sm font-medium">{btcToSats(satsGoal)}</span>
                    <span className="text-sm">sats</span>
                  </div>
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
                      const newDuration =
                        value === 0 ? '1_month' :
                        value === 1 ? '6_month' :
                        value === 2 ? '1_year' :
                        value === 3 ? '3_year' :
                        value === 4 ? '5_year' : '10_year';
                      setGoalDuration(newDuration);
                    }}
                    className="w-full accent-bitcoin-orange cursor-pointer h-2 rounded-lg appearance-none bg-muted"
                  />
                </div>
                <div className="text-center font-medium">
                  {getDurationDetails(goalDuration).label}
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
                    <th className="w-[14%] text-center py-2 px-3 font-medium">{getFrequencyDetails(frequency).label} Date</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Sats Stacked</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Est. Cost</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Total Sats</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Est. Total Cost</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Est. BTC Price</th>
                    <th className="w-[14%] text-center py-2 px-3 font-medium">Est. Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData && chartData.length > 0 ? (
                    chartData.map((point, index) => {
                      // Calculate cumulative values up to this point
                      const cumulativeCost = chartData.slice(0, index + 1).reduce((sum, p) => sum + (p.usdValueThisPeriod || 0), 0);

                      // Determine if it's the first or last row on the current page
                      const isFirstRow = index === 0;
                      const isLastRow = index === chartData.length - 1;
                      const rowTextColorClass = (isFirstRow || isLastRow) ? 'text-bitcoin-orange' : '';

                      return (
                        <tr
                          key={point.date + '-' + index}
                          className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-muted/50' : 'bg-transparent'} hover:bg-bitcoin-orange/50`}>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{point.date}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatNumber(point.periodicSats)}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.usdValueThisPeriod)}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatNumber(point.accumulatedSats)}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(cumulativeCost)}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.estimatedBtcPrice)}</td>
                          <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.cumulativeUsdValue)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted-foreground">
                        Enter details above to see accumulation forecast.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 