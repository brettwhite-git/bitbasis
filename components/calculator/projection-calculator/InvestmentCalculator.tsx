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
import { InvestmentChart } from "./InvestmentChart"
import { SavingsGoalCalculator } from "../savings-goal/SavingsGoalCalculator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  BitcoinUnit, 
  CalculatorMode, 
  ChartDataPoint 
} from "../types/calculator-types"
import { 
  getDurationDetails,
  getFrequencyDetails, 
  addPeriods, 
  formatDateLabel 
} from "../utils/date-utils"
import { 
  isValidSatsInputValue,
  formatBTC, 
  formatNumber, 
  formatCurrency,
  btcToSats,
  satsToBtc
} from "../utils/format-utils"
import {
  calculateSatsGoalData,
  calculateRecurringBuyData,
  aggregateChartData
} from "../utils/calculation-utils"
import { useBitcoinPrice } from "@/hooks/useBitcoinPrice"

export function InvestmentCalculator() {
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('savingsGoal'); // Default to Savings Goal
  const [goalType, setGoalType] = useState<'fixed' | 'recurring'>('fixed'); // Default to fixed goal
  const [bitcoinUnit, setBitcoinUnit] = useState<BitcoinUnit>('bitcoin');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [recurringBuyAmount, setRecurringBuyAmount] = useState('100'); // Default recurring buy amount
  const [satsGoal, setSatsGoal] = useState('0.1'); // Underlying goal stored ALWAYS as BTC string
  const [displayGoalValue, setDisplayGoalValue] = useState('0.1'); // Formatted value shown in the active input
  const [priceGrowth, setPriceGrowth] = useState('30'); // Default 30% CAGR
  const [inflationRate, setInflationRate] = useState('3'); // Default 3% inflation
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(true); // Default to showing inflation-adjusted values
  
  // Use Bitcoin price hook
  const { price: btcPrice, loading: priceLoading } = useBitcoinPrice();
  
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
  }, [displayGoalValue, isUserEditing]);

  // Generate chart data based on inputs
  const chartData = useMemo((): ChartDataPoint[] | undefined => {
    // For fixed goal mode
    if (calculatorMode === 'investmentGoal' && goalType === 'fixed') {
      const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
      return calculateSatsGoalData(
        btcGoal,
        goalDuration,
        frequency,
        btcPrice,
        parseFloat(priceGrowth),
        parseFloat(inflationRate),
        showInflationAdjusted
      );
    }
    // For recurring buy mode
    else if (calculatorMode === 'investmentGoal' && goalType === 'recurring') {
      const recurringUSD = parseFloat(recurringBuyAmount);
      return calculateRecurringBuyData(
        recurringUSD,
        goalDuration,
        frequency,
        btcPrice,
        parseFloat(priceGrowth),
        parseFloat(inflationRate),
        showInflationAdjusted
      );
    }
    
    // Fallback if mode is somehow invalid (shouldn't happen)
    return undefined;
  }, [
    calculatorMode,
    goalType,
    satsGoal, // Dependency for fixed goal mode
    recurringBuyAmount, // Dependency for recurring mode
    goalDuration,
    btcPrice,
    priceGrowth,
    frequency,
    inflationRate,
    showInflationAdjusted
  ]);

  // Aggregate chart data for better visualization on long daily frequencies
  const aggregatedChartData = useMemo((): ChartDataPoint[] | undefined => {
    if (!chartData || !chartData.length) return undefined;
    return aggregateChartData(chartData, frequency, goalDuration);
  }, [chartData, frequency, goalDuration]);

  // Handle BTC goal change (when bitcoin unit is selected)
  const handleBtcGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isValidSatsInputValue(newValue)) {
      setIsUserEditing(true);
      cursorPositionRef.current = e.target.selectionStart;
      setSatsGoal(newValue);
      setDisplayGoalValue(newValue);
    }
  };

  // Handle satoshi input change (when satoshi unit is selected)
  const handleSatsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/,/g, ''); // Remove commas for processing
    
    if (isValidSatsInputValue(newValue)) {
      setIsUserEditing(true);
      cursorPositionRef.current = e.target.selectionStart;
      
      // Convert sats input to BTC for internal storage
      const btcValue = satsToBtc(newValue);
      setSatsGoal(btcValue);
      
      // Keep displaying the sats value the user entered
      setDisplayGoalValue(newValue);
    }
  };

  // Handle recurring buy amount change
  const handleRecurringBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^\d.-]/g, ''); // Allow decimal and negative sign
    // Basic validation to ensure it's a plausible number string
    if (newValue === '' || newValue === '-' || /^-?\d*\.?\d*$/.test(newValue)) {
        setRecurringBuyAmount(newValue);
    }
  };

  // Handle price growth change
  const handlePriceGrowthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Handle backspace to empty field
    if (value === '') {
      setPriceGrowth('');
      return;
    }
    
    // Remove non-numeric and non-decimal characters
    value = value.replace(/[^\d.-]/g, '');
    
    // Handle negative values
    const isNegative = value.startsWith('-');
    value = value.replace(/-/g, '');
    
    // Parse to number and apply constraints
    let numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      if (isNegative) numValue = -numValue;
      
      // Clamp value between -100 and 1000
      numValue = Math.max(-100, Math.min(1000, numValue));
      
      setPriceGrowth(numValue.toString());
    }
  };

  // Handle inflation rate change
  const handleInflationRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Handle backspace to empty field
    if (value === '') {
      setInflationRate('');
      return;
    }
    
    // Remove non-numeric and non-decimal characters
    value = value.replace(/[^\d.-]/g, '');
    
    // Handle negative values
    const isNegative = value.startsWith('-');
    value = value.replace(/-/g, '');
    
    // Parse to number and apply constraints
    let numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      if (isNegative) numValue = -numValue;
      
      // Clamp value between 0 and 20
      numValue = Math.max(0, Math.min(20, numValue));
      
      setInflationRate(numValue.toString());
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
      <div className="p-6 space-y-6 flex flex-col h-full">
        <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as typeof calculatorMode)} className="w-full flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="savingsGoal">
              Savings Goal
            </TabsTrigger>
            <TabsTrigger value="investmentGoal">
              Investment Goal
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 flex flex-col">
            <TabsContent value="savingsGoal" className="flex-1">
              <SavingsGoalCalculator />
            </TabsContent>
            
            <TabsContent value="investmentGoal" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[650px]">
                {/* Input Section (Left) - Combined calculator */}
                <div className="md:col-span-1">
                  <div className="h-full p-6 rounded-md border border-border bg-muted/30 space-y-8 flex flex-col">
                    {/* Goal Type Selector */}
                    <div className="space-y-3">
                      <Label className="text-base">Goal Type</Label>
                      <Select value={goalType} onValueChange={(value) => setGoalType(value as 'fixed' | 'recurring')}>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Bitcoin Goal</SelectItem>
                          <SelectItem value="recurring">Recurring Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fiat Currency */}
                    <div className="space-y-3">
                      <Label className="text-base">Fiat Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bitcoin Unit */}
                    <div className="space-y-3">
                      <Label className="text-base">Bitcoin Unit</Label>
                      <RadioGroup value={bitcoinUnit} onValueChange={(value) => setBitcoinUnit(value as BitcoinUnit)} className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bitcoin" id="bitcoin" className="peer sr-only" />
                          <Label
                            htmlFor="bitcoin"
                            className="flex-1 cursor-pointer rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/50 peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
                          >
                            Bitcoin
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="satoshi" id="satoshi" className="peer sr-only" />
                          <Label
                            htmlFor="satoshi"
                            className="flex-1 cursor-pointer rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/50 peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
                          >
                            Satoshi
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Buying Frequency */}
                    <div className="space-y-3">
                      <Label className="text-base">Buying Frequency</Label>
                      <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-4 gap-3">
                        {["daily", "weekly", "monthly", "yearly"].map((period) => (
                          <div key={`freq-${period}`} className="flex items-center space-x-2">
                            <RadioGroupItem value={period} id={`freq-${period}`} className="peer sr-only" />
                            <Label
                              htmlFor={`freq-${period}`}
                              className="flex-1 cursor-pointer rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/50 peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange text-center capitalize"
                            >
                              {getFrequencyDetails(period).label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Conditional Input based on Goal Type */}
                    {goalType === 'fixed' ? (
                      <div className="space-y-3">
                        <Label className="text-base">BTC Goal</Label>
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
                                <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background h-9">
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
                                <div className="flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background h-9">
                                  <span className="text-sm mr-2 text-muted-foreground">=</span>
                                  <span className="flex-1 text-sm font-medium">{formatBTC(satsGoal)}</span>
                                  <span className="ml-1 text-sm text-muted-foreground">BTC</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label className="text-base">Recurring Buy Amount</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="100"
                            value={recurringBuyAmount} // Display the raw state value
                            onChange={handleRecurringBuyAmountChange}
                            className="pl-8 pr-10 bg-muted/50 border-input" // Padding for symbols and increased height
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

                    {/* Goal Date Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base">Goal Date</Label>
                        <span className="font-medium dark:text-gray-100 text-base">{getDurationDetails(goalDuration).label}</span>
                      </div>
                      <div className="space-y-3 mt-2">
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
                            className="w-full cursor-pointer h-3 rounded-lg appearance-none bg-primary/20 dark:bg-primary/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compound Annual Growth Rate (CAGR) Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="cagrSlider" className="dark:text-gray-300 text-base">Compound Annual Growth Rate (CAGR)</Label>
                        <span className="font-medium dark:text-gray-100 text-base">{priceGrowth}%</span>
                      </div>
                      <div className="space-y-3 mt-2">
                        <Slider
                          id="cagrSlider"
                          min={0}
                          max={100} // Set max to 100%
                          step={1}
                          value={[parseFloat(priceGrowth)]} // Use the numeric value
                          onValueChange={(value) => {
                            setPriceGrowth(value[0]?.toString() || '30'); // Add null check and fallback
                          }}
                          className="w-full cursor-pointer h-3 rounded-lg appearance-none bg-primary/20 dark:bg-primary/10"
                        />
                      </div>
                    </div>

                    {/* Inflation Rate Slider */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="inflationSlider" className="dark:text-gray-300 text-base">Inflation Rate</Label>
                        <span className="font-medium dark:text-gray-100 text-base">{inflationRate}%</span>
                      </div>
                      <div className="space-y-3 mt-2">
                        <Slider
                          id="inflationSlider"
                          min={0}
                          max={15} // Set max to 15% for inflation
                          step={0.25}
                          value={[parseFloat(inflationRate)]} // Use the numeric value
                          onValueChange={(value) => {
                            setInflationRate(value[0]?.toString() || '3'); // Add null check and fallback
                          }}
                          className="w-full cursor-pointer h-3 rounded-lg appearance-none bg-primary/20 dark:bg-primary/10"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="showInflationAdjusted" 
                          checked={showInflationAdjusted}
                          onCheckedChange={(checked) => setShowInflationAdjusted(checked === true)} 
                        />
                        <Label 
                          htmlFor="showInflationAdjusted" 
                          className="text-sm text-muted-foreground cursor-pointer"
                        >
                          Show inflation-adjusted values
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section (Chart) */}
                <div className="md:col-span-2 space-y-4 h-full">
                  <div className="h-full w-full rounded-md border border-border bg-background overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-border">
                      <h3 className="text-lg font-semibold text-foreground">
                        {bitcoinUnit === 'satoshi' ? 'Satoshi' : 'Bitcoin'} Accumulation Forecast
                      </h3>
                    </div>
                    <div className="px-4 py-6 flex-1 min-h-[500px]">
                      <InvestmentChart
                        chartData={aggregatedChartData}
                        title=""
                        bitcoinUnit={bitcoinUnit}
                        showInflationAdjusted={showInflationAdjusted}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Full Width Table Section */}
        {calculatorMode === 'investmentGoal' && (
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
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{goalType === 'fixed' ? 'Est. Cost' : 'Amount Invested'}{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Total {bitcoinUnit === 'satoshi' ? 'Sats' : 'BTC'}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">{goalType === 'fixed' ? 'Est. Total Cost' : 'Total Invested'}{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Est. BTC Price</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium">Est. Total Value{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData && chartData.length > 0 ? (
                      chartData.map((point, index) => {
                        const originalIndex = index;
                        const isFirstRow = index === 0;
                        const isLastRow = originalIndex === chartData.length - 1;
                        const rowTextColorClass = (isFirstRow || isLastRow) ? 'font-medium' : '';
                        let totalInvested = 0;

                        if (goalType === 'recurring') {
                          totalInvested = point.totalInvested || (originalIndex + 1) * parseFloat(recurringBuyAmount.replace(/,/g, '') || '0');
                          // Apply inflation adjustment if needed
                          if (showInflationAdjusted && point.inflationFactor) {
                            totalInvested = totalInvested / point.inflationFactor;
                          }
                        } else if (goalType === 'fixed') {
                          totalInvested = (chartData || []).slice(0, originalIndex + 1).reduce((sum, p) => sum + (p.usdValueThisPeriod || 0), 0);
                        }

                        return (
                          <tr key={point.date + '-' + originalIndex}
                            className={`border-b border-border ${originalIndex % 2 === 0 ? 'bg-muted/5' : 'bg-transparent'} hover:bg-muted/10`}>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{point.date}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.periodicSats) : formatBTC(point.periodicSats / 100000000)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.usdValueThisPeriod ?? 0)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.accumulatedSats) : formatBTC(point.accumulatedSats / 100000000)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(totalInvested)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.estimatedBtcPrice ?? 0)}</td>
                            <td className={`w-[14%] text-center py-2 px-3 ${rowTextColorClass}`}>{formatCurrency(point.cumulativeUsdValue ?? 0)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4">No data available</td>
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