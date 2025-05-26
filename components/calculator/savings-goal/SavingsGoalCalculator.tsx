"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ProjectionChart } from "./SavingsGoalProjectionChart";
import { useSavingsGoalData } from '@/lib/hooks/useSavingsGoalData';
import { calculateTimeRemaining } from '@/lib/utils/utils';
import { CheckCircle, Circle, LoaderCircle, Trash2 } from "lucide-react";
import { useBitcoinPrice } from '@/lib/hooks/useBitcoinPrice';
import { formatCurrency } from '../utils/format-utils';
import { calculateProjection } from '../utils/calculation-utils';
import { BtcPriceInput } from "../utils/BtcPriceInput";
import { ProjectionPoint, CalculateProjectionParams, ProjectionResult, SavedGoalData } from '../types/calculator-types';
// import { Line } from 'react-chartjs-2'; // We'll add chart imports later
// We'll need Chart.js core and scales too later

// Removed local type definitions and calculation function as they are now imported

export function SavingsGoalCalculator() {
  // State for Inputs
  const [goalName, setGoalName] = useState("My Savings Goal");
  const [contributionAmountUSD, setContributionAmountUSD] = useState(250);
  const [contributionFrequency, setContributionFrequency] = useState('weekly');
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState(80); // Annual %
  const [projectionPeriodMonths, setProjectionPeriodMonths] = useState(12);
  const [inflationRatePercent, setInflationRatePercent] = useState(3);
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(true);
  const [targetBtcAmount, setTargetBtcAmount] = useState(0.1);
  const [startDate, setStartDate] = useState(new Date());
  const [customBtcPrice, setCustomBtcPrice] = useState<string | null>(null); // Custom BTC price input by user

  // Use Bitcoin price hook instead of manual input
  const { price: spotBtcPrice, loading: priceLoading } = useBitcoinPrice();

  // Get effective BTC price (custom if set, otherwise spot price)
  const currentBtcPriceUSD = useMemo(() => {
    if (customBtcPrice !== null) {
      const parsedCustomPrice = parseFloat(customBtcPrice);
      return !isNaN(parsedCustomPrice) && parsedCustomPrice > 0 ? parsedCustomPrice : spotBtcPrice;
    }
    return spotBtcPrice;
  }, [customBtcPrice, spotBtcPrice]);

  // State for Calculated Outputs
  const [projectedValueUSD, setProjectedValueUSD] = useState(0);
  const [projectedValueAdjustedUSD, setProjectedValueAdjustedUSD] = useState(0);
  const [roiPercent, setRoiPercent] = useState(0);
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]);
  const [targetUsdValue, setTargetUsdValue] = useState<number | null>(null);
  const [estimatedBtcTargetDate, setEstimatedBtcTargetDate] = useState<Date | null>(null);
  const [savedGoalEstBtcDate, setSavedGoalEstBtcDate] = useState<Date | null>(null);

  const [activeGoal, setActiveGoal] = useState<SavedGoalData | null>(null);

  // --- Log activeGoal right after setting/loading ---
  useEffect(() => {
    console.log("Active goal state in component:", activeGoal);
  }, [activeGoal]);

  // --- Call the new hook for progress calculation ---
  const goalProgress = useSavingsGoalData(
    activeGoal
      ? {
          startDate: activeGoal.startDate,
          targetBtcAmount: activeGoal.savedProjection.targetBtcAmount,
        }
      : null
  );

  // Note: Removed old calculation logic - now using calculateProjection function below

  // --- Load Goal from localStorage on Mount ---
  useEffect(() => {
    const savedGoalString = localStorage.getItem('savingsGoal');
    if (savedGoalString) {
      try {
        const loadedGoal = JSON.parse(savedGoalString) as SavedGoalData;
        setActiveGoal(loadedGoal);
        // Note: We don't populate input fields from saved goal
        // The inputs remain independent for creating new projections
        // Only the activeGoal state is used for displaying the saved goal tracker
      } catch (error) {
        console.error("Failed to parse saved savings goal:", error);
        localStorage.removeItem('savingsGoal'); // Clear corrupted data
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Run Calculation for Interactive Display --- 
  useEffect(() => {
    // Only run calculation if we have valid data and price is not loading
    if (priceLoading || currentBtcPriceUSD <= 0 || contributionAmountUSD <= 0 || projectionPeriodMonths <= 0) {
      // Reset to default values when data is invalid or still loading
      setProjectedValueUSD(0);
      setProjectedValueAdjustedUSD(0);
      setTotalPrincipal(0);
      setTotalInterest(0);
      setRoiPercent(0);
      setProjectionData([]);
      setEstimatedBtcTargetDate(null);
      setTargetUsdValue(null);
      return;
    }

    const results = calculateProjection({
        contributionAmountUSD,
        contributionFrequency,
        expectedGrowthPercent,
        projectionPeriodMonths,
        inflationRatePercent,
        targetBtcAmount,
        currentBtcPriceUSD,
        startDate: startDate, // Pass the state here
    });

    // Update state for interactive display
    setProjectedValueUSD(results.nominalValueAtPeriodEnd);
    setProjectedValueAdjustedUSD(results.adjustedValueAtPeriodEnd);
    setTotalPrincipal(results.principalAtPeriodEnd);
    const interest = Math.max(0, results.nominalValueAtPeriodEnd - results.principalAtPeriodEnd);
    setTotalInterest(interest);
    const roi = results.principalAtPeriodEnd > 0 ? (interest / results.principalAtPeriodEnd) * 100 : 0;
    setRoiPercent(roi);
    setProjectionData(results.dataPoints);
    setEstimatedBtcTargetDate(results.estimatedTargetDate);

    // Update target USD value display
    const currentTargetUsd = targetBtcAmount > 0 && currentBtcPriceUSD > 0 ? targetBtcAmount * currentBtcPriceUSD : null;
    setTargetUsdValue(currentTargetUsd);

  }, [
    // initialInvestmentUSD, // Removed dependency
    contributionAmountUSD,
    contributionFrequency,
    expectedGrowthPercent,
    projectionPeriodMonths,
    inflationRatePercent,
    targetBtcAmount,
    currentBtcPriceUSD,
    startDate,
    priceLoading
  ]);

  // --- Calculate Estimated BTC Target Date for the *Saved* Goal ---
  useEffect(() => {
    if (!activeGoal || !activeGoal.savedProjection.targetBtcAmount || !activeGoal.savedProjection.currentBtcPriceUSD) {
      setSavedGoalEstBtcDate(null);
      return;
    }

    const { contributionAmountUSD, contributionFrequency, expectedGrowthPercent, projectionPeriodMonths, targetBtcAmount, currentBtcPriceUSD } = activeGoal.savedProjection;

    const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
    // Use the full saved projection period to see if target is reachable within that original timeframe
    const projectionPeriodYears = projectionPeriodMonths / 12;
    const totalPeriods = projectionPeriodYears * periodsPerYear;
    const annualGrowthRate = expectedGrowthPercent / 100;
    const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
    const savedTargetUsd = targetBtcAmount * currentBtcPriceUSD;

    // Define a safety limit (e.g., 100 years)
    const maxProjectionYears = 100;
    const maxPeriods = maxProjectionYears * periodsPerYear;

    let currentNominalValue = 0;
    let targetReachedPeriod: number | null = null;

    // Loop until target is reached or maxPeriods safety limit is hit
    for (let period = 1; period <= maxPeriods; period++) {
      currentNominalValue += contributionAmountUSD;
      currentNominalValue *= (1 + periodicGrowthRate);

      // Calculate inflation-adjusted value to compare against target
      const yearsElapsed = period / periodsPerYear;
      const currentAdjustedValue = currentNominalValue / Math.pow(1 + annualGrowthRate, yearsElapsed); // Note: Using annualGrowthRate here assumes it implicitly includes inflation, which might be wrong. Let's use annualInflationRate if available.
      // TODO: Refine this - Need annualInflationRate here, which isn't currently saved in activeGoal.savedProjection.
      // For now, let's assume we need to retrieve/pass inflation rate or revert this part.

      // Check if the *adjusted* value meets the target USD
      if (currentAdjustedValue >= savedTargetUsd && targetReachedPeriod === null) { 
           targetReachedPeriod = period;
           break; // Stop calculation once target is reached
      }
    }

    if (targetReachedPeriod !== null) {
      const targetYear = Math.ceil(targetReachedPeriod / periodsPerYear);
      const dateEstimate = activeGoal.startDate ? new Date(activeGoal.startDate) : new Date(); // Base calculation on saved start date
      dateEstimate.setFullYear(dateEstimate.getFullYear() + targetYear);
      const monthEstimate = (targetReachedPeriod % periodsPerYear) * (12 / periodsPerYear);
      dateEstimate.setMonth(dateEstimate.getMonth() + Math.floor(monthEstimate));
      setSavedGoalEstBtcDate(dateEstimate);
    } else {
      // Target not reached within the safety limit (or target not set)
      setSavedGoalEstBtcDate(null); 
    }

  }, [activeGoal]); // Recalculate whenever the activeGoal changes

  // --- Save Goal Function ---
  const handleSaveGoal = () => {
    console.log('Saving goal to localStorage...');
    const projectionPeriodYears = projectionPeriodMonths / 12;
    const currentCompletionDate = new Date();
    currentCompletionDate.setFullYear(currentCompletionDate.getFullYear() + projectionPeriodYears);

    // Run calculation with current inputs to get target-based results
    const calcResults = calculateProjection({
      contributionAmountUSD,
      contributionFrequency,
      expectedGrowthPercent,
      projectionPeriodMonths, // Pass this along for saving in savedProjection
      inflationRatePercent,
      targetBtcAmount,
      currentBtcPriceUSD,
      startDate: startDate, // Pass the state here
    });

    // Calculate ROI specifically for the target outcome
    const roiAtTarget = calcResults.principalAtTarget !== null && calcResults.principalAtTarget > 0
      ? ((calcResults.projectedValueAtTarget ?? 0) - calcResults.principalAtTarget) / calcResults.principalAtTarget * 100
      : null;

    const goalToSave: SavedGoalData = {
        goalName: goalName,
        savedProjection: {
            contributionAmountUSD: contributionAmountUSD,
            contributionFrequency: contributionFrequency,
            expectedGrowthPercent: expectedGrowthPercent,
            projectionPeriodMonths: projectionPeriodMonths,
            projectionPeriodYears: projectionPeriodYears, // Add for widget compatibility
            targetBtcAmount: targetBtcAmount,         // Save target BTC
            currentBtcPriceUSD: currentBtcPriceUSD,   // Save price context
            inflationRatePercent: inflationRatePercent, // Save inflation rate
        },
        estimatedTargetDateISO: calcResults.estimatedTargetDate ? calcResults.estimatedTargetDate.toISOString() : null,
        projectedValueAtTarget: calcResults.projectedValueAtTarget,
        principalAtTarget: calcResults.principalAtTarget,
        roiAtTarget: roiAtTarget,
        startDate: startDate.toISOString(), // Save the current start date state
    };

    try {
        localStorage.setItem('savingsGoal', JSON.stringify(goalToSave));
        setActiveGoal(goalToSave); // Update state to show the tracker immediately
        console.log('Goal saved:', goalToSave);
    } catch (error) {
        console.error("Failed to save goal to localStorage:", error);
        // TODO: Inform user about the error (e.g., quota exceeded)
    }
  };

  // --- Delete Goal Function ---
  const handleDeleteGoal = () => {
      console.log("Deleting goal from localStorage...");
      try {
        localStorage.removeItem('savingsGoal');
        setActiveGoal(null); // Clear state to hide the tracker
        console.log("Goal deleted successfully");
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
  };

  // --- Helper to format date string from ISO ---
  const formatSavedDate = (dateString: string | undefined) => {
      if (!dateString) return 'N/A';
      try {
          return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
          return 'Invalid Date';
      }
  };

  // --- Calculate Time Progress --- // REMOVED
  // const timeProgressPercent = useMemo(() => { ... }, [activeGoal]);

  // --- Format Currency ---
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // --- Clear Inputs Function ---
  const handleClearInputs = () => {
    setGoalName("My Savings Goal");
    // setInitialInvestmentUSD(0);
    setContributionAmountUSD(250);
    setContributionFrequency('weekly');
    setExpectedGrowthPercent(80);
    setProjectionPeriodMonths(12); // Default value (1 year)
    setInflationRatePercent(3); // Default value
    // Don't set BTC price as we're using the hook now: setCurrentBtcPriceUSD(85000);
    setTargetBtcAmount(0.1); // Default value
    setStartDate(new Date()); // Reset start date
    // Output states (like projectedValueUSD, roiPercent, etc.) will recalculate automatically via useEffect
  };

  // Helper function to format Date to YYYY-MM-DD for input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Add this where state is defined (after the useState hooks)
  // Unique ID for BTC price input event
  const btcPriceEventId = "savings-goal-btc-price-change";

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

  return (
    <div className="w-full space-y-6">

      {/* === Section A: Saved Goal Tracker (Conditional) === */}
      {activeGoal && (
        <div className="p-6 calculator-container-active relative">
            {/* Delete Button - Absolute positioned - Use Trash Icon */}
            <Button 
                variant="ghost" 
                onClick={handleDeleteGoal} 
                className="absolute top-4 right-4 text-bitcoin-orange hover:text-red-400 h-auto p-3 hover:bg-gray-800/70 rounded-lg transition-all duration-200 z-10"
                aria-label="Delete goal"
                type="button"
            >
                <Trash2 className="h-5 w-5" />
            </Button>
            
            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                {/* Left Container: Progress Tracking */}
                <div className="md:w-5/12 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-white">{activeGoal.goalName}</h2>
                            <p className="text-xl font-bold text-bitcoin-orange mt-2">
                              {goalProgress.isLoading 
                                ? "Loading..." 
                                : `$${formatCurrency(goalProgress.accumulatedBtcSinceStart * activeGoal.savedProjection.currentBtcPriceUSD)}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-3">
                                Target: {activeGoal.savedProjection.targetBtcAmount} BTC
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                ${activeGoal.savedProjection.contributionAmountUSD.toLocaleString()} {activeGoal.savedProjection.contributionFrequency.charAt(0).toUpperCase() + 
                                activeGoal.savedProjection.contributionFrequency.slice(1)}
                            </p>
                        </div>
                        <div className="text-right flex flex-col pt-5">
                            <p className="text-xl font-bold text-bitcoin-orange mb-1 flex justify-end items-center">
                              {goalProgress.isLoading ? '...' : (
                                <>
                                  <span>{((goalProgress.accumulatedBtcSinceStart * 100000000) / 1000000).toFixed(1)}M</span>
                                  <span className="mx-1">/</span>
                                  <span>{((activeGoal.savedProjection.targetBtcAmount * 100000000) / 1000000).toFixed(1)}M</span>
                                  <span className="text-sm ml-1">sats</span>
                                </>
                              )}
                            </p>
                            <div className="flex items-center justify-end">
                                <p className="text-xl font-bold mr-2 text-white">
                                    {goalProgress.isLoading ? '...' : `${goalProgress.btcProgressPercent.toFixed(0)}%`}
                                </p>
                                {goalProgress.isLoading ? (
                                    <LoaderCircle className="animate-spin text-gray-400 h-5 w-5" />
                                ) : goalProgress.btcProgressPercent >= 100 ? (
                                    <CheckCircle className="text-bitcoin-orange h-6 w-6" />
                                ) : (
                                    <LoaderCircle className="text-bitcoin-orange h-5 w-5" />
                                )}
                            </div>
                            {activeGoal.estimatedTargetDateISO && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {calculateTimeRemaining(activeGoal.estimatedTargetDateISO, new Date(), 'long')}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-2">
                        <div className="w-full h-3 bg-gray-800/50 rounded-full overflow-hidden"> 
                            <div 
                                className="h-3 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] rounded-full transition-all duration-700"
                                style={{ width: goalProgress.isLoading ? '0%' : `${goalProgress.btcProgressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>Start: {formatSavedDate(activeGoal.startDate)}</span>
                            <span>Est. Completion: {activeGoal.estimatedTargetDateISO ? formatSavedDate(activeGoal.estimatedTargetDateISO) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right Container: KPIs */}
                <div className="md:w-8/12 calculator-input-section p-4 flex items-center">
                    <div className="grid grid-cols-3 w-full">
                        {/* KPI: Projected Value */}
                        <div className="text-center">
                            <div className="text-lg text-gray-400 mb-1">Projected Value</div>
                            <div className="text-xl font-semibold text-white">${formatCurrency(activeGoal.projectedValueAtTarget ?? 0)}</div>
                        </div>
                        
                        {/* KPI: Contribution */}
                        <div className="text-center">
                            <div className="text-lg text-gray-400 mb-1">
                                {activeGoal.savedProjection.contributionFrequency.charAt(0).toUpperCase() + 
                                activeGoal.savedProjection.contributionFrequency.slice(1)} Contribution
                            </div>
                            <div className="text-xl font-semibold text-white">${activeGoal.savedProjection.contributionAmountUSD.toLocaleString()}</div>
                        </div>
                        
                        {/* KPI: ROI */}
                        <div className="text-center">
                            <div className="text-lg text-gray-400 mb-1">ROI</div>
                            <div className="text-lg font-semibold text-white">{(activeGoal.roiAtTarget ?? 0).toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* === Section B: Interactive Calculator & Goal Setter === */}
      <div className="pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {/* Left Column: Inputs - Wrapped in a styled container */}
           <div className="md:col-span-2 space-y-4 p-6 calculator-input-section">
             {/* Put Input Title and Clear Button in a flex container */}
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium text-white">Inputs</h3>
                 <Button variant="outline" size="sm" onClick={handleClearInputs} className="text-xs text-bitcoin-orange border-gray-600/50 hover:bg-gray-800/50 hover:border-bitcoin-orange/50">
                      Clear Inputs
                 </Button>
             </div>
             <div>
                <Label htmlFor="goalName" className="text-white">Goal/Projection Name</Label>
                <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., House Down Payment"
                className="bg-gray-800/30 border-gray-600/50 text-white placeholder:text-gray-400"
                />
            </div>

            {/* Contribution Amount & Frequency & Start Date in one row */}
            <div className="flex gap-4 items-end">
                {/* Contribution Amount */}
                <div className='flex-1'>
                    <Label htmlFor="contributionAmount" className="text-white">Contribution ($)</Label>
                    <Input
                    id="contributionAmount"
                    type="number"
                    value={contributionAmountUSD}
                    onChange={(e) => setContributionAmountUSD(parseFloat(e.target.value) || 0)}
                    min="0"
                    className="bg-gray-800/30 border-gray-600/50 text-white"
                    />
                </div>
                {/* Frequency */}
                <div className='flex-1'>
                    <Label htmlFor="contributionFrequency" className="text-white">Frequency</Label>
                    <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                        <SelectTrigger id="contributionFrequency" className="bg-gray-800/30 border-gray-600/50 text-white">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/95 backdrop-blur-md border-gray-700/50">
                            <SelectItem value="weekly" className="text-white hover:bg-gray-800/50">Weekly</SelectItem>
                            <SelectItem value="monthly" className="text-white hover:bg-gray-800/50">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Start Date */}
                <div className='flex-1'>
                   <Label htmlFor="startDate" className="text-white">Start Date</Label>
                   <Input
                       id="startDate"
                       type="date"
                       value={formatDateForInput(startDate)}
                       onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))}
                       className="bg-gray-800/30 border-gray-600/50 text-white"
                   />
                </div>
            </div>

             {/* BTC Price Input */}
             <div className="mb-6">
               <BtcPriceInput 
                 customBtcPrice={customBtcPrice}
                 onCustomBtcPriceChange={btcPriceEventId}
                 spotPrice={spotBtcPrice}
                 loading={priceLoading}
                 label="Bitcoin Price"
               />
             </div>

             {/* Target BTC Amount */}
             <div>
                <Label htmlFor="targetBtc" className="text-white">Target BTC Goal Amount</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="targetBtc"
                        min={0}
                        max={2}
                        step={0.05}
                        value={[targetBtcAmount]}
                        onValueChange={(value: number[]) => setTargetBtcAmount(value[0] ?? 0)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={targetBtcAmount}
                        onChange={(e) => setTargetBtcAmount(parseFloat(e.target.value) || 0)}
                        className='w-20 text-right flex-none bg-gray-800/30 border-gray-600/50 text-white'
                        min="0"
                        max="10"
                        step="0.01"
                    />
                    <span className="text-sm text-gray-400 min-w-[3ch] text-left">BTC</span>
                </div>
            </div>

            {/* Expected Growth Rate */}
            <div>
                <Label htmlFor="expectedGrowth" className="text-white">Expected Annual Growth (%)</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="expectedGrowth"
                        min={0}
                        max={200}
                        step={0.5}
                        value={[expectedGrowthPercent]}
                        onValueChange={(value: number[]) => setExpectedGrowthPercent(value[0] ?? 0)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={expectedGrowthPercent}
                        onChange={(e) => setExpectedGrowthPercent(parseFloat(e.target.value) || 0)}
                        className='w-20 text-right flex-none bg-gray-800/30 border-gray-600/50 text-white'
                        min="0"
                        max="100"
                        step="0.5"
                    />
                    <span className="text-sm text-gray-400 min-w-[3ch] text-left">%</span>
                </div>
            </div>

            {/* Inflation Rate */}
            <div>
               <Label htmlFor="inflationRate" className="text-white">Inflation Rate (%)</Label>
               <div className='flex items-center gap-2'>
                   <Slider
                       id="inflationRate"
                       min={0}
                       max={15}
                       step={0.25}
                       value={[inflationRatePercent]}
                       onValueChange={(value: number[]) => setInflationRatePercent(value[0] ?? 0)}
                       className='flex-grow'
                   />
                   <Input
                       type="number"
                       value={inflationRatePercent}
                       onChange={(e) => setInflationRatePercent(parseFloat(e.target.value) || 0)}
                       className='w-20 text-right flex-none bg-gray-800/30 border-gray-600/50 text-white'
                       min="0"
                       max="100"
                       step="0.25"
                   />
                   <span className="text-sm text-gray-400 min-w-[3ch] text-left">%</span>
               </div>
           </div>

            {/* Projection Period */}
            <div>
                <Label htmlFor="projectionPeriod" className="text-white">Contribution Projection (Months)</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="projectionPeriod"
                        min={1}
                        max={120}
                        step={1}
                        value={[projectionPeriodMonths]}
                        onValueChange={(value: number[]) => setProjectionPeriodMonths(value[0] ?? 12)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={projectionPeriodMonths}
                        onChange={(e) => setProjectionPeriodMonths(parseInt(e.target.value) || 12)}
                        className='w-20 text-right flex-none bg-gray-800/30 border-gray-600/50 text-white'
                        min="1"
                        max="120"
                    />
                     <span className="text-sm text-gray-400 min-w-[3ch] text-left">M</span>
                </div>
                
                {/* Chart Options - Moved here */}
                <div className="flex items-center space-x-2 mt-3">
                  <Checkbox 
                    id="showInflation" 
                    checked={showInflationAdjusted}
                    onCheckedChange={(checked) => setShowInflationAdjusted(checked === true)}
                  />
                  <Label htmlFor="showInflation" className="text-sm cursor-pointer text-gray-300">
                    Show inflation-adjusted value in chart
                  </Label>
                </div>
            </div>

            {/* Save Button at the Bottom */}
            <Button 
              onClick={handleSaveGoal} 
              className="w-full mt-4 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold hover:shadow-lg hover:shadow-bitcoin-orange/30 transition-all duration-300"
              variant="default"
            >
              {activeGoal ? 'Update Saved Goal' : 'Save Goal'}
            </Button>
          </div>

          {/* Right Column: Dynamic Outputs & Chart */}
                     <div className="md:col-span-3 space-y-4 p-6 calculator-output-section">
             <h3 className="text-lg font-medium mb-4 text-white">Projection Results</h3>
             
             {/* Dynamic Output KPIs */}
             <div className="p-6 calculator-kpi-container grid grid-cols-3 gap-4">
                 {/* Est. Time to Target BTC */}
                 <div className="text-center flex flex-col items-center justify-center">
                     <Label className="text-sm text-gray-400">Est. Time to {targetBtcAmount} BTC</Label>
                     <div className="mt-1">
                         {estimatedBtcTargetDate ? (
                             <>
                                 <p className="text-lg font-medium mb-1 text-white">
                                     {estimatedBtcTargetDate.toLocaleDateString('en-US', { 
                                         month: 'short', 
                                         year: 'numeric' 
                                     })}
                                 </p>
                                 <p className="text-sm text-gray-400">
                                     Target: ${targetUsdValue ? formatCurrency(targetUsdValue) : 'N/A'}
                                 </p>
                             </>
                         ) : (
                             <p className="text-lg text-gray-400">Not reachable</p>
                         )}
                     </div>
                 </div>
                 
                 {/* Projected Value */}
                 <div className="text-center flex flex-col items-center justify-center">
                     <Label className="text-sm text-gray-400">Projected Value</Label>
                     <div className="mt-1">
                         <p className="text-lg font-medium mb-1 text-white">
                             ${formatCurrency(projectedValueUSD)}
                         </p>
                         <p className="text-sm text-gray-400">
                             ${formatCurrency(projectedValueAdjustedUSD)} (inflation adj.)
                         </p>
                     </div>
                 </div>
                 
                 {/* Return on Investment */}
                 <div className="text-center flex flex-col items-center justify-center">
                     <Label className="text-sm text-gray-400">Return on Investment</Label>
                     <div className="mt-1">
                         <p className="text-lg font-medium mb-1 text-white">
                             {roiPercent.toFixed(1)}%
                         </p>
                         <p className="text-sm text-gray-400">
                             Total invested: ${formatCurrency(totalPrincipal)}
                         </p>
                     </div>
                 </div>
             </div>
             
             {/* Dynamic Projected Growth Chart Container */}
             <div className="calculator-chart-container p-4 h-[28rem]">
                 {priceLoading ? (
                     <div className="h-full flex items-center justify-center">
                         <p className="text-gray-400">Loading Bitcoin price...</p>
                     </div>
                 ) : projectionData.length > 0 ? (
                     <ProjectionChart 
                         data={projectionData} 
                         showInflationAdjusted={showInflationAdjusted}
                     />
                 ) : (
                     <div className="h-full flex items-center justify-center">
                         <p className="text-gray-400">Adjust inputs to see projection chart</p>
                     </div>
                 )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}

