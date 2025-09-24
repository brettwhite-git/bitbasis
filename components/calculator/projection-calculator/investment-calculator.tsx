"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { InvestmentChart } from "./investment-chart"
import { SavingsGoalCalculator } from "../savings-goal/savings-goal-calculator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BtcPriceInput } from "../utils/btc-price-input"
import { 
  BitcoinUnit, 
  CalculatorMode, 
  ChartDataPoint 
} from "../types/calculator-types"
import { 
  getDurationDetails,
  getFrequencyDetails
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
import { useBitcoinPrice } from "@/lib/hooks"

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
  const [customBtcPrice, setCustomBtcPrice] = useState<string | null>(null); // Custom BTC price input by user
  
  // Use Bitcoin price hook
  const { price: btcPrice, loading: priceLoading } = useBitcoinPrice();
  
  // Get effective BTC price (custom if set, otherwise spot price)
  const effectiveBtcPrice = useMemo(() => {
    if (customBtcPrice !== null) {
      const parsedCustomPrice = parseFloat(customBtcPrice);
      return !isNaN(parsedCustomPrice) && parsedCustomPrice > 0 ? parsedCustomPrice : btcPrice;
    }
    return btcPrice;
  }, [customBtcPrice, btcPrice]);
  
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

  // Unique ID for BTC price input event
  const btcPriceEventId = "investment-calculator-btc-price-change";

  // Add this near other useEffect hooks
  useEffect(() => {
    // Handler for BTC price change events
    const handleBtcPriceChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCustomBtcPrice(customEvent.detail);
    };
    
    // Add event listener
    window.addEventListener(btcPriceEventId, handleBtcPriceChange);
    
    // Clean up
    return () => {
      window.removeEventListener(btcPriceEventId, handleBtcPriceChange);
    };
  }, []);

  // Generate chart data based on inputs
  const chartData = useMemo((): ChartDataPoint[] | undefined => {
    // For fixed goal mode
    if (calculatorMode === 'investmentGoal' && goalType === 'fixed') {
      const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
      return calculateSatsGoalData(
        btcGoal,
        goalDuration,
        frequency,
        effectiveBtcPrice,
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
        effectiveBtcPrice,
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
    effectiveBtcPrice,
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

  // Defensive check to ensure we have valid price data
  if (priceLoading || btcPrice <= 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Loading Bitcoin price data...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as typeof calculatorMode)} className="w-full flex-1 flex flex-col">
        <TabsList className="flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border">
          <TabsTrigger 
            value="savingsGoal" 
            className="relative overflow-hidden data-[state=active]:bg-gradient-to-r data-[state=active]:from-bitcoin-orange data-[state=active]:to-[#D4A76A] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-bitcoin-orange/30 data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-all duration-300 rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/20 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border group"
          >
            <span className="relative z-10">Savings Goal</span>
            <span className="absolute inset-0 bg-white opacity-0 data-[state=active]:group-hover:opacity-10 transition-opacity duration-100"></span>
          </TabsTrigger>
          <TabsTrigger 
            value="investmentGoal" 
            className="relative overflow-hidden data-[state=active]:bg-gradient-to-r data-[state=active]:from-bitcoin-orange data-[state=active]:to-[#D4A76A] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-bitcoin-orange/30 data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-all duration-300 rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/20 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border group"
          >
            <span className="relative z-10">Investment Goal</span>
            <span className="absolute inset-0 bg-white opacity-0 data-[state=active]:group-hover:opacity-10 transition-opacity duration-100"></span>
          </TabsTrigger>
        </TabsList>
          
        <div className="flex-1 flex flex-col">
          <TabsContent value="savingsGoal" className="flex-1 mt-0">
            <div className="rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border border-gray-700/50 shadow-2xl h-full">
              <div className="p-6">
                <SavingsGoalCalculator />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="investmentGoal" className="flex-1 mt-0">
            <div className="rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border border-gray-700/50 shadow-2xl h-full">
              <div className="p-6 space-y-6 flex flex-col h-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[650px]">
                {/* Input Section (Left) - Combined calculator */}
                <div className="md:col-span-1">
                  <div className="h-full p-6 rounded-xl bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm border border-gray-700/30 space-y-5 flex flex-col">
                    {/* Goal Type Selector */}
                    <div>
                      <Label className="text-base mb-2 block text-white">Goal Type</Label>
                      <Select value={goalType} onValueChange={(value) => setGoalType(value as 'fixed' | 'recurring')}>
                        <SelectTrigger className="h-10 bg-gray-800/30 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700/50">
                          <SelectItem value="fixed" className="text-white hover:bg-gray-800/50">Fixed Bitcoin Goal</SelectItem>
                          <SelectItem value="recurring" className="text-white hover:bg-gray-800/50">Recurring Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* BTC Price */}
                    <div>
                      <Label className="text-base mb-2 block text-white">BTC Price</Label>
                      <div className="mt-0">
                        <BtcPriceInput 
                          customBtcPrice={customBtcPrice}
                          onCustomBtcPriceChange={btcPriceEventId}
                          spotPrice={btcPrice}
                          loading={priceLoading}
                        />
                      </div>
                    </div>

                    {/* Bitcoin Unit */}
                    <div>
                      <Label className="text-base mb-2 block text-white">Bitcoin Unit</Label>
                      <Select value={bitcoinUnit} onValueChange={(value) => setBitcoinUnit(value as BitcoinUnit)}>
                        <SelectTrigger className="h-10 bg-gray-800/30 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select bitcoin unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700/50">
                          <SelectItem value="bitcoin" className="text-white hover:bg-gray-800/50">Bitcoin</SelectItem>
                          <SelectItem value="satoshi" className="text-white hover:bg-gray-800/50">Satoshi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Buying Frequency */}
                    <div>
                      <Label className="text-base mb-2 block text-white">Buying Frequency</Label>
                      <Select value={frequency} onValueChange={setFrequency}>
                        <SelectTrigger className="h-10 bg-gray-800/30 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select buying frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700/50">
                          {["daily", "weekly", "monthly", "yearly"].map((period) => (
                            <SelectItem 
                              key={`freq-${period}`} 
                              value={period} 
                              className="text-white hover:bg-gray-800/50"
                            >
                              {getFrequencyDetails(period).label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional Input based on Goal Type */}
                    {goalType === 'fixed' ? (
                      <div>
                        <Label className="text-base mb-2 block text-white">BTC Goal</Label>
                        <div className="grid grid-cols-2 gap-3 mt-0">
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
                                  className="pr-16 pl-3 h-10 bg-gray-800/30 border-gray-600/50 text-white"
                                  inputMode="decimal"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                                  BTC
                                </span>
                              </div>
                              {/* Sats Display Field */}
                              <div className="relative">
                                <div className="flex items-center rounded-md border border-gray-600/50 bg-gray-800/30 px-3 h-10 text-sm">
                                  <span className="text-sm mr-2 text-gray-400">=</span>
                                  <span className="flex-1 text-sm font-medium text-white">{btcToSats(satsGoal)}</span>
                                  <span className="ml-1 text-sm text-gray-400">sats</span>
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
                                  className="pr-16 pl-3 h-10 bg-gray-800/30 border-gray-600/50 text-white"
                                  inputMode="numeric" // Use numeric for sats
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                                  sats
                                </span>
                              </div>
                              {/* BTC Display Field */}
                              <div className="relative">
                                <div className="flex items-center rounded-md border border-gray-600/50 bg-gray-800/30 px-3 h-10 text-sm">
                                  <span className="text-sm mr-2 text-gray-400">=</span>
                                  <span className="flex-1 text-sm font-medium text-white">{formatBTC(satsGoal)}</span>
                                  <span className="ml-1 text-sm text-gray-400">BTC</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-base mb-2 block text-white">Recurring Buy Amount</Label>
                        <div className="relative mt-0">
                          <Input
                            type="text"
                            placeholder="100"
                            value={recurringBuyAmount} // Display the raw state value
                            onChange={handleRecurringBuyAmountChange}
                            className="pl-8 pr-10 h-10 bg-gray-800/30 border-gray-600/50 text-white" // Match height with other inputs
                            inputMode="decimal"
                          />
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400">
                            $
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                            USD
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Goal Date Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-base text-white">Goal Date</Label>
                        <span className="font-medium text-bitcoin-orange text-base">{getDurationDetails(goalDuration).label}</span>
                      </div>
                      <div className="mt-0">
                        <div className="relative pt-5">
                          <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-1">
                            <span>1M</span>
                            <span>3M</span>
                            <span>6M</span>
                            <span>1Y</span>
                            <span>2Y</span>
                            <span>3Y</span>
                            <span>4Y</span>
                            <span>5Y</span>
                            <span>10Y</span>
                          </div>
                          <Slider
                            min={0}
                            max={8}
                            step={1}
                            value={[
                              goalDuration === '1_month' ? 0 :
                              goalDuration === '3_month' ? 1 :
                              goalDuration === '6_month' ? 2 :
                              goalDuration === '1_year' ? 3 :
                              goalDuration === '2_year' ? 4 :
                              goalDuration === '3_year' ? 5 :
                              goalDuration === '4_year' ? 6 :
                              goalDuration === '5_year' ? 7 : 8
                            ]}
                            onValueChange={(value) => {
                              const index = value[0];
                              const newDuration =
                                index === 0 ? '1_month' :
                                index === 1 ? '3_month' :
                                index === 2 ? '6_month' :
                                index === 3 ? '1_year' :
                                index === 4 ? '2_year' :
                                index === 5 ? '3_year' :
                                index === 6 ? '4_year' :
                                index === 7 ? '5_year' : '10_year';
                              setGoalDuration(newDuration);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compound Annual Growth Rate (CAGR) Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="cagrSlider" className="text-base text-white">Compound Annual Growth Rate (CAGR)</Label>
                        <span className="font-medium text-bitcoin-orange text-base">{priceGrowth}%</span>
                      </div>
                      <div className="mt-0">
                        <Slider
                          id="cagrSlider"
                          min={0}
                          max={100} // Set max to 100%
                          step={1}
                          value={[parseFloat(priceGrowth)]} // Use the numeric value
                          onValueChange={(value) => {
                            setPriceGrowth(value[0]?.toString() || '30'); // Add null check and fallback
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Inflation Rate Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="inflationSlider" className="text-base text-white">Inflation Rate</Label>
                        <span className="font-medium text-bitcoin-orange text-base">{inflationRate}%</span>
                      </div>
                      <div className="mt-0">
                        <Slider
                          id="inflationSlider"
                          min={0}
                          max={15} // Set max to 15% for inflation
                          step={0.25}
                          value={[parseFloat(inflationRate)]} // Use the numeric value
                          onValueChange={(value) => {
                            setInflationRate(value[0]?.toString() || '3'); // Add null check and fallback
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <Checkbox 
                          id="showInflationAdjusted" 
                          checked={showInflationAdjusted}
                          onCheckedChange={(checked) => setShowInflationAdjusted(checked === true)} 
                        />
                        <Label 
                          htmlFor="showInflationAdjusted" 
                          className="text-sm text-gray-300 cursor-pointer"
                        >
                          Show inflation-adjusted values
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section (Chart) */}
                <div className="md:col-span-2 space-y-4 h-full">
                  <div className="h-full w-full rounded-xl bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm border border-gray-700/30 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-700/30">
                      <h3 className="text-lg font-semibold text-white">
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
                  
              {/* Full Width Table Section */}
              <div className="mt-10 w-full">
                <div className="w-full rounded-xl bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm border border-gray-700/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white">Accumulation Details</h3>
                  </div>
                  <div className="w-full overflow-x-auto p-0 max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm table-fixed">
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-gray-700/30 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl">
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">{getFrequencyDetails(frequency).label} Date</th> 
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">{bitcoinUnit === 'satoshi' ? 'Sats' : 'BTC'} Stacked</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">{goalType === 'fixed' ? 'Est. Cost' : 'Amount Invested'}{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">Total {bitcoinUnit === 'satoshi' ? 'Sats' : 'BTC'}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">{goalType === 'fixed' ? 'Est. Total Cost' : 'Total Invested'}{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">Est. BTC Price</th>
                      <th className="w-[14%] text-center py-2 px-3 font-medium text-white">Est. Total Value{showInflationAdjusted ? ' (Infl. Adj.)' : ''}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData && chartData.length > 0 ? (
                      chartData.map((point, index) => {
                        const originalIndex = index;
                        const isFirstRow = index === 0;
                        const isLastRow = originalIndex === chartData.length - 1;
                        const rowTextColorClass = (isFirstRow || isLastRow) ? 'font-medium text-white' : 'text-white';
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
                            className={`group relative overflow-hidden ${originalIndex % 2 === 0 ? 'bg-gray-800/10' : 'bg-transparent'} ${isLastRow ? 'border-b border-gray-700/30' : ''} hover:bg-gradient-to-r hover:from-bitcoin-orange/10 hover:to-[#D4A76A]/10 transition-all duration-300`}>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{point.date}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.periodicSats) : formatBTC(point.periodicSats / 100000000)}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{formatCurrency(point.usdValueThisPeriod ?? 0)}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{bitcoinUnit === 'satoshi' ? formatNumber(point.accumulatedSats) : formatBTC(point.accumulatedSats / 100000000)}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{formatCurrency(totalInvested)}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{formatCurrency(point.estimatedBtcPrice ?? 0)}</span>
                              </div>
                            </td>
                            <td className={`w-[14%] p-0 ${isLastRow ? 'border-b border-gray-700/30' : ''}`}>
                              <div className="py-2 px-3 text-center relative">
                                <span className={`${rowTextColorClass} relative z-10 group-hover:text-white transition-colors duration-300`}>{formatCurrency(point.cumulativeUsdValue ?? 0)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-gray-400">No data available</td>
                      </tr>
                    )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}