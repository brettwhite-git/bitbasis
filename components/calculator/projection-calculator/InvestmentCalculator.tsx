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
import { SavingsGoalCalculator } from "../SavingsGoalCalculator"
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
import { FixedGoalCalculator } from "./FixedGoalCalculator"
import { RecurringGoalCalculator } from "./RecurringGoalCalculator"

export function InvestmentCalculator() {
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('savingsGoal'); // Default to Savings Goal
  const [bitcoinUnit, setBitcoinUnit] = useState<BitcoinUnit>('bitcoin');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');
  const [recurringBuyAmount, setRecurringBuyAmount] = useState('100'); // Default recurring buy amount
  const [satsGoal, setSatsGoal] = useState('0.1'); // Underlying goal stored ALWAYS as BTC string
  const [displayGoalValue, setDisplayGoalValue] = useState('0.1'); // Formatted value shown in the active input
  const [priceGrowth, setPriceGrowth] = useState('30'); // Default 30% CAGR
  
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
    // For satsGoal mode
    if (calculatorMode === 'satsGoal') {
      const btcGoal = parseFloat(satsGoal.replace(/,/g, ''));
      return calculateSatsGoalData(
        btcGoal,
        goalDuration,
        frequency,
        btcPrice,
        parseFloat(priceGrowth)
      );
    }
    // For recurringBuy mode
    else if (calculatorMode === 'recurringBuy') {
      const recurringUSD = parseFloat(recurringBuyAmount);
      return calculateRecurringBuyData(
        recurringUSD,
        goalDuration,
        frequency,
        btcPrice,
        parseFloat(priceGrowth)
      );
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

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
      <div className="p-6 space-y-6 flex flex-col h-full">
        <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as typeof calculatorMode)} className="w-full flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="savingsGoal">
              Savings Goal
            </TabsTrigger>
            <TabsTrigger value="satsGoal">
              Fixed Goal
            </TabsTrigger>
            <TabsTrigger value="recurringBuy">
              Recurring Goal
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 flex flex-col">
            <TabsContent value="savingsGoal" className="flex-1">
              <SavingsGoalCalculator />
            </TabsContent>
            
            <TabsContent value="satsGoal" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[650px]">
                {/* Input Section (Left) - Replaced with FixedGoalCalculator */}
                <FixedGoalCalculator
                  bitcoinUnit={bitcoinUnit}
                  setBitcoinUnit={setBitcoinUnit}
                  satsGoal={satsGoal}
                  displayGoalValue={displayGoalValue}
                  handleBtcGoalChange={handleBtcGoalChange}
                  handleSatsInputChange={handleSatsInputChange}
                  satsGoalInputRef={satsGoalInputRef}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  goalDuration={goalDuration}
                  setGoalDuration={setGoalDuration}
                  priceGrowth={priceGrowth}
                  setPriceGrowth={setPriceGrowth}
                />

                {/* Right Section (Chart for non-Savings Goal modes) */}
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recurringBuy" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[650px]">
                {/* Input Section (Left) - Replaced with RecurringGoalCalculator */}
                <RecurringGoalCalculator
                  bitcoinUnit={bitcoinUnit}
                  setBitcoinUnit={setBitcoinUnit}
                  recurringBuyAmount={recurringBuyAmount}
                  handleRecurringBuyAmountChange={handleRecurringBuyAmountChange}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  goalDuration={goalDuration}
                  setGoalDuration={setGoalDuration}
                  priceGrowth={priceGrowth}
                  setPriceGrowth={setPriceGrowth}
                />

                {/* Right Section (Chart for non-Savings Goal modes) */}
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

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
                        let totalInvested = 0;

                        if (calculatorMode === 'recurringBuy') {
                          totalInvested = (originalIndex + 1) * parseFloat(recurringBuyAmount.replace(/,/g, '') || '0');
                        } else if (calculatorMode === 'satsGoal') {
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
