"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ProjectionChart } from "./projection-chart";
import { useSavingsGoalProgress } from '@/hooks/useSavingsGoalProgress';
import { calculateTimeRemaining } from '@/lib/utils';
import { CheckCircle, Circle, LoaderCircle } from "lucide-react";
// import { Line } from 'react-chartjs-2'; // We'll add chart imports later
// We'll need Chart.js core and scales too later

// Define the structure for the saved goal data (based on our plan)
interface SavedGoalData {
  goalName: string;
  startDate: string; // ISO string

  // Input parameters at the time of saving
  savedProjection: {
    contributionAmountUSD: number;
    contributionFrequency: string;
    expectedGrowthPercent: number;
    projectionPeriodYears: number; // Still save user's projection period for context/loading
    targetBtcAmount: number; // Make non-optional for saved goal
    currentBtcPriceUSD: number; // Make non-optional for saved goal
    inflationRatePercent: number; // Make non-optional for saved goal
  };

  // Calculated outcomes based on reaching the BTC target
  estimatedTargetDateISO: string | null; // ISO string, or null if unreachable
  projectedValueAtTarget: number | null; // Value when target reached (null if unreachable)
  principalAtTarget: number | null; // Principal when target reached (null if unreachable)
  roiAtTarget: number | null; // ROI when target reached (null if unreachable)
}

// Define the structure for chart data points including inflation
interface ProjectionPoint {
    year: number;
    nominalValue: number;
    adjustedValue: number;
}

// --- Reusable Calculation Function --- 

interface CalculateProjectionParams {
  contributionAmountUSD: number;
  contributionFrequency: string;
  expectedGrowthPercent: number;
  projectionPeriodYears: number; // For chart length
  inflationRatePercent: number;
  targetBtcAmount: number;
  currentBtcPriceUSD: number;
  startDate?: Date; // Optional start date (defaults to now)
}

interface ProjectionResult {
  dataPoints: ProjectionPoint[]; // Chart data up to projectionPeriodYears
  estimatedTargetDate: Date | null;
  projectedValueAtTarget: number | null;
  principalAtTarget: number | null;
  nominalValueAtPeriodEnd: number; // Value at end of projectionPeriodYears
  adjustedValueAtPeriodEnd: number; // Adjusted value at end of projectionPeriodYears
  principalAtPeriodEnd: number; // Principal at end of projectionPeriodYears
}

function calculateProjection(params: CalculateProjectionParams): ProjectionResult {
  const { 
      contributionAmountUSD, 
      contributionFrequency, 
      expectedGrowthPercent, 
      projectionPeriodYears, 
      inflationRatePercent, 
      targetBtcAmount, 
      currentBtcPriceUSD,
      startDate = new Date() // Default start date to now
  } = params;

  const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
  const totalPeriodsForChart = projectionPeriodYears * periodsPerYear;
  const annualGrowthRate = expectedGrowthPercent / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const annualInflationRate = inflationRatePercent / 100;

  const targetUsd = targetBtcAmount > 0 && currentBtcPriceUSD > 0 ? targetBtcAmount * currentBtcPriceUSD : null;

  let currentNominalValue = 0;
  let principal = 0;
  let targetReachedPeriod: number | null = null;

  let nominalValueAtPeriodEnd = 0;
  let principalAtPeriodEnd = 0;
  let adjustedValueAtPeriodEnd = 0;

  let projectedValueAtTarget: number | null = null;
  let principalAtTarget: number | null = null;

  const dataPoints: ProjectionPoint[] = [{ year: 0, nominalValue: 0, adjustedValue: 0 }];

  const maxProjectionYears = 100; // Safety limit
  const maxPeriods = maxProjectionYears * periodsPerYear;

  for (let period = 1; period <= maxPeriods; period++) {
      currentNominalValue += contributionAmountUSD;
      principal += contributionAmountUSD;
      currentNominalValue *= (1 + periodicGrowthRate);

      const yearsElapsed = period / periodsPerYear;
      const currentAdjustedValue = currentNominalValue / Math.pow(1 + annualInflationRate, yearsElapsed);

      // Check if adjusted target is reached
      if (targetUsd !== null && currentAdjustedValue >= targetUsd && targetReachedPeriod === null) {
          targetReachedPeriod = period;
          projectedValueAtTarget = currentNominalValue; // Store nominal value when adjusted target hit
          principalAtTarget = principal;
          // Don't break yet, need to continue for chart data up to totalPeriodsForChart
      }

       // Capture values at the end of the user's specified projection period (for interactive KPIs)
       if (period === totalPeriodsForChart) {
           nominalValueAtPeriodEnd = currentNominalValue;
           principalAtPeriodEnd = principal;
           adjustedValueAtPeriodEnd = currentAdjustedValue;
       }

      // Store data points *only* within the user's selected projection period for the chart
      if (period <= totalPeriodsForChart && period % periodsPerYear === 0) { 
          const currentYear = Math.ceil(period / periodsPerYear);
          dataPoints.push({ year: currentYear, nominalValue: currentNominalValue, adjustedValue: currentAdjustedValue });
      }

      // Stop loop early if target is found AND we have passed the chart period
      if (targetReachedPeriod !== null && period >= totalPeriodsForChart) {
          break;
      }

      // Safety Break
      if (period === maxPeriods && targetReachedPeriod === null) {
          break;
      }
  }

  // Calculate final estimated date
  let estimatedTargetDate: Date | null = null;
  if (targetReachedPeriod !== null) {
      const targetYear = Math.ceil(targetReachedPeriod / periodsPerYear);
      const dateEstimate = new Date(startDate); // Use provided start date
      dateEstimate.setFullYear(dateEstimate.getFullYear() + targetYear);
      const monthEstimate = (targetReachedPeriod % periodsPerYear) * (12 / periodsPerYear);
      dateEstimate.setMonth(dateEstimate.getMonth() + Math.floor(monthEstimate));
      estimatedTargetDate = dateEstimate;
  }

   // Ensure the end values are captured even if totalPeriodsForChart wasn't hit exactly (e.g., projection < 1 year)
   if (totalPeriodsForChart < periodsPerYear && nominalValueAtPeriodEnd === 0) {
       nominalValueAtPeriodEnd = currentNominalValue;
       principalAtPeriodEnd = principal;
       adjustedValueAtPeriodEnd = currentNominalValue / Math.pow(1 + annualInflationRate, projectionPeriodYears);
   }

  return {
      dataPoints,
      estimatedTargetDate,
      projectedValueAtTarget,
      principalAtTarget,
      nominalValueAtPeriodEnd,
      adjustedValueAtPeriodEnd,
      principalAtPeriodEnd,
  };
}

export function SavingsGoalCalculator() {
  // State for Inputs
  const [goalName, setGoalName] = useState("My Savings Goal");
  // const [initialInvestmentUSD, setInitialInvestmentUSD] = useState(0); // Removed
  const [contributionAmountUSD, setContributionAmountUSD] = useState(250);
  const [contributionFrequency, setContributionFrequency] = useState('weekly');
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState(80); // Annual %
  const [projectionPeriodYears, setProjectionPeriodYears] = useState(1);
  const [inflationRatePercent, setInflationRatePercent] = useState(3); // New state for inflation rate
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(true); // New state for checkbox
  const [currentBtcPriceUSD, setCurrentBtcPriceUSD] = useState(85000); // New state for BTC price
  const [targetBtcAmount, setTargetBtcAmount] = useState(0.1); // New state for target BTC
  const [startDate, setStartDate] = useState(new Date()); // <<< Add state for start date

  // State for Calculated Outputs
  const [projectedValueUSD, setProjectedValueUSD] = useState(0);
  const [projectedValueAdjustedUSD, setProjectedValueAdjustedUSD] = useState(0); // New state for adjusted value
  const [roiPercent, setRoiPercent] = useState(0);
  // const [completionDate, setCompletionDate] = useState<Date | null>(null); // Removed, calculated dynamically
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]); // Updated state for chart data structure
  const [targetUsdValue, setTargetUsdValue] = useState<number | null>(null); // New state: USD value of BTC target
  const [estimatedBtcTargetDate, setEstimatedBtcTargetDate] = useState<Date | null>(null); // New state: Estimated date to reach target
  const [savedGoalEstBtcDate, setSavedGoalEstBtcDate] = useState<Date | null>(null); // New state: Estimated date for the *saved* goal's BTC target

  const [activeGoal, setActiveGoal] = useState<SavedGoalData | null>(null);

  // --- Log activeGoal right after setting/loading ---
  useEffect(() => {
    console.log("Active goal state in component:", activeGoal);
  }, [activeGoal]);

  // --- Call the new hook for progress calculation ---
  const goalProgress = useSavingsGoalProgress(
    activeGoal
        ? {
              startDate: activeGoal.startDate,
              targetBtcAmount: activeGoal.savedProjection.targetBtcAmount,
          }
        : null
);

  // Calculation logic
  useEffect(() => {
    const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
    const totalPeriods = projectionPeriodYears * periodsPerYear;
    const periodicGrowthRate = Math.pow(1 + expectedGrowthPercent / 100, 1 / periodsPerYear) - 1;

    // Start from 0, no initial investment
    let currentValue = 0;
    let principal = 0;
    // We might want chart data later, so let's prepare an array
    // let projectionData = [{ period: 0, value: 0 }]; // Start chart at 0

    for (let i = 1; i <= totalPeriods; i++) {
      // Add contribution at the start of the period (adjust if needed)
      currentValue += contributionAmountUSD;
      principal += contributionAmountUSD;
      // Apply growth for the period
      currentValue *= (1 + periodicGrowthRate);
      // projectionData.push({ period: i, value: currentValue });
    }

    const finalProjectedValue = currentValue;
    const finalTotalPrincipal = principal;
    const finalTotalInterest = finalProjectedValue - finalTotalPrincipal;
    const roi = finalTotalPrincipal > 0 ? (finalTotalInterest / finalTotalPrincipal) * 100 : 0;

    // Update state
    setProjectedValueUSD(finalProjectedValue);
    setTotalPrincipal(finalTotalPrincipal); // This now excludes initial investment
    setTotalInterest(finalTotalInterest);
    setRoiPercent(roi);
    // setChartData(projectionData); // Update chart data state later

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + projectionPeriodYears);
    // setCompletionDate(futureDate);

  }, [
    // initialInvestmentUSD, // Removed dependency
    contributionAmountUSD,
    contributionFrequency,
    expectedGrowthPercent,
    projectionPeriodYears
  ]);

  // --- Load Goal from localStorage on Mount ---
  useEffect(() => {
    const savedGoalString = localStorage.getItem('savingsGoal');
    if (savedGoalString) {
      try {
        const loadedGoal = JSON.parse(savedGoalString) as SavedGoalData;
        setActiveGoal(loadedGoal);
        // Optional: Pre-fill interactive calculator with saved goal's parameters
        setGoalName(loadedGoal.goalName);
        // setInitialInvestmentUSD(loadedGoal.savedProjection.initialInvestmentUSD); // Removed
        setContributionAmountUSD(loadedGoal.savedProjection.contributionAmountUSD);
        setContributionFrequency(loadedGoal.savedProjection.contributionFrequency);
        setExpectedGrowthPercent(loadedGoal.savedProjection.expectedGrowthPercent);
        setProjectionPeriodYears(loadedGoal.savedProjection.projectionPeriodYears);
        // Potential future: Load saved BTC price and target if we add them to SavedGoalData
        setCurrentBtcPriceUSD(loadedGoal.savedProjection.currentBtcPriceUSD ?? 60000); // Load saved or default
        setTargetBtcAmount(loadedGoal.savedProjection.targetBtcAmount ?? 0.1); // Load saved or default
        // Optional: Load saved inflation rate if we add it later
        setInflationRatePercent(loadedGoal.savedProjection.inflationRatePercent ?? 3); // Load saved or default (3%)
      } catch (error) {
        console.error("Failed to parse saved savings goal:", error);
        localStorage.removeItem('savingsGoal'); // Clear corrupted data
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Run Calculation for Interactive Display --- 
  useEffect(() => {
    const results = calculateProjection({
        contributionAmountUSD,
        contributionFrequency,
        expectedGrowthPercent,
        projectionPeriodYears,
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
    projectionPeriodYears,
    inflationRatePercent,
    targetBtcAmount,
    currentBtcPriceUSD,
    startDate
  ]);

  // --- Calculate Estimated BTC Target Date for the *Saved* Goal ---
  useEffect(() => {
    if (!activeGoal || !activeGoal.savedProjection.targetBtcAmount || !activeGoal.savedProjection.currentBtcPriceUSD) {
      setSavedGoalEstBtcDate(null);
      return;
    }

    const { contributionAmountUSD, contributionFrequency, expectedGrowthPercent, projectionPeriodYears, targetBtcAmount, currentBtcPriceUSD } = activeGoal.savedProjection;

    const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
    // Use the full saved projection period to see if target is reachable within that original timeframe
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
    const currentCompletionDate = new Date();
    currentCompletionDate.setFullYear(currentCompletionDate.getFullYear() + projectionPeriodYears);

    // Run calculation with current inputs to get target-based results
    const calcResults = calculateProjection({
      contributionAmountUSD,
      contributionFrequency,
      expectedGrowthPercent,
      projectionPeriodYears, // Pass this along for saving in savedProjection
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
            projectionPeriodYears: projectionPeriodYears,
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
      localStorage.removeItem('savingsGoal');
      setActiveGoal(null); // Clear state to hide the tracker
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
    setGoalName("My Savings Goal"); // Default value
    setContributionAmountUSD(250); // Default value
    setContributionFrequency('weekly'); // Default value
    setExpectedGrowthPercent(80); // Default value
    setProjectionPeriodYears(1); // Default value
    setInflationRatePercent(3); // Default value
    setCurrentBtcPriceUSD(85000); // Default value
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

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-8"> 

      {/* === Section A: Saved Goal Tracker (Conditional) === */}
      {activeGoal && (
        <div className="p-6 bg-black rounded-lg border border-border relative"> 
            {/* Delete Button - Absolute positioned */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeleteGoal} 
                className="absolute top-6 right-6 text-xs text-muted-foreground hover:text-destructive"
            >
                Delete
            </Button>
            
            <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                {/* Left Container: Progress Tracking */}
                <div className="md:w-5/12 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">{activeGoal.goalName}</h2>
                            <p className="text-xl font-bold text-bitcoin-orange mt-2">
                              {goalProgress.isLoading 
                                ? "Loading..." 
                                : `$${formatCurrency(goalProgress.accumulatedBtcSinceStart * activeGoal.savedProjection.currentBtcPriceUSD)}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                                Target: {activeGoal.savedProjection.targetBtcAmount} BTC
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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
                                <p className="text-xl font-bold mr-2">
                                    {goalProgress.isLoading ? '...' : `${goalProgress.btcProgressPercent.toFixed(0)}%`}
                                </p>
                                {goalProgress.isLoading ? (
                                    <LoaderCircle className="animate-spin text-muted-foreground h-5 w-5" />
                                ) : goalProgress.btcProgressPercent >= 100 ? (
                                    <CheckCircle className="text-bitcoin-orange h-6 w-6" />
                                ) : (
                                    <LoaderCircle className="text-bitcoin-orange h-5 w-5" />
                                )}
                            </div>
                            {activeGoal.estimatedTargetDateISO && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {calculateTimeRemaining(activeGoal.estimatedTargetDateISO, new Date(), 'long')}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-2">
                        <div className="w-full h-3 bg-muted/70 rounded-full overflow-hidden"> 
                            <div 
                                className="h-3 bg-bitcoin-orange rounded-full transition-all duration-700"
                                style={{ width: goalProgress.isLoading ? '0%' : `${goalProgress.btcProgressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>Start: {formatSavedDate(activeGoal.startDate)}</span>
                            <span>Est. Completion: {activeGoal.estimatedTargetDateISO ? formatSavedDate(activeGoal.estimatedTargetDateISO) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right Container: KPIs */}
                <div className="md:w-7/12 bg-muted/20 rounded-lg p-4 flex items-center">
                    <div className="grid grid-cols-3 w-full">
                        {/* KPI: Projected Value */}
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Projected Value</div>
                            <div className="text-xl font-semibold">${formatCurrency(activeGoal.projectedValueAtTarget ?? 0)}</div>
                        </div>
                        
                        {/* KPI: Contribution */}
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                                {activeGoal.savedProjection.contributionFrequency.charAt(0).toUpperCase() + 
                                activeGoal.savedProjection.contributionFrequency.slice(1)} Contribution
                            </div>
                            <div className="text-xl font-semibold">${activeGoal.savedProjection.contributionAmountUSD.toLocaleString()}</div>
                        </div>
                        
                        {/* KPI: ROI */}
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">ROI</div>
                            <div className="text-xl font-semibold">{(activeGoal.roiAtTarget ?? 0).toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* === Section B: Interactive Calculator & Goal Setter === */}
      <div className="pt-6 border-t border-border">
        <h2 className="text-xl font-semibold mb-4">
            {activeGoal ? "Update Your Projection / Goal" : "Calculate Savings Projection"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {/* Left Column: Inputs - Wrapped in a styled container */}
           <div className="md:col-span-2 space-y-4 p-6 rounded-lg border bg-muted/20">
             {/* Put Input Title and Clear Button in a flex container */}
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium">Inputs</h3>
                 <Button variant="ghost" size="sm" onClick={handleClearInputs} className="text-xs text-muted-foreground hover:text-primary">
                      Clear Inputs
                 </Button>
             </div>
             <div>
                <Label htmlFor="goalName">Goal/Projection Name</Label>
                <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., House Down Payment"
                />
            </div>
             {/* Initial Investment - REMOVED */}
            {/* <div>
                <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                <Input
                id="initialInvestment"
                type="number"
                value={initialInvestmentUSD}
                onChange={(e) => setInitialInvestmentUSD(parseFloat(e.target.value) || 0)}
                min="0"
                />
            </div> */}

            {/* Contribution Amount & Frequency & Start Date in one row */}
            <div className="flex gap-4 items-end"> {/* Use items-end to align labels nicely */} 
                {/* Contribution Amount */}
                <div className='flex-1'>
                    <Label htmlFor="contributionAmount">Contribution ($)</Label>
                    <Input
                    id="contributionAmount"
                    type="number"
                    value={contributionAmountUSD}
                    onChange={(e) => setContributionAmountUSD(parseFloat(e.target.value) || 0)}
                    min="0"
                    />
                </div>
                {/* Frequency */}
                <div className='flex-1'>
                    <Label htmlFor="contributionFrequency">Frequency</Label>
                    <Select value={contributionFrequency} onValueChange={setContributionFrequency}>
                        <SelectTrigger id="contributionFrequency">
                            <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Start Date */}
                <div className='flex-1'>
                   <Label htmlFor="startDate">Start Date</Label>
                   <Input
                       id="startDate"
                       type="date"
                       value={formatDateForInput(startDate)}
                       onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))} // Ensure correct parsing
                   />
                </div>
            </div>

             {/* Current BTC Price Input */}
             <div>
                <Label htmlFor="currentBtcPrice">Current BTC Price ($)</Label>
                <Input
                id="currentBtcPrice"
                type="number"
                value={currentBtcPriceUSD}
                onChange={(e) => setCurrentBtcPriceUSD(parseFloat(e.target.value) || 0)}
                min="0"
                step="100" // Allow reasonable steps
                />
            </div>

             {/* Target BTC Amount */}
             <div>
                <Label htmlFor="targetBtc">Target BTC Goal Amount</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="targetBtc"
                        min={0}
                        max={2} // Max target of 2 BTC
                        step={0.05} // Step by 0.05 BTC
                        value={[targetBtcAmount]}
                        onValueChange={(value: number[]) => setTargetBtcAmount(value[0] ?? 0)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={targetBtcAmount}
                        onChange={(e) => setTargetBtcAmount(parseFloat(e.target.value) || 0)}
                        className='w-20 text-right flex-none'
                        min="0"
                        max="10" // Allow higher input manually if needed
                        step="0.01"
                    />
                    <span className="text-sm text-muted-foreground min-w-[3ch] text-left">BTC</span>
                </div>
            </div>

            {/* Expected Growth Rate */}
            <div>
                <Label htmlFor="expectedGrowth">Expected Annual Growth (%)</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="expectedGrowth"
                        min={0}
                        max={200} // Adjusted max for typical returns
                        step={0.5}
                        value={[expectedGrowthPercent]}
                        onValueChange={(value: number[]) => setExpectedGrowthPercent(value[0] ?? 0)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={expectedGrowthPercent}
                        onChange={(e) => setExpectedGrowthPercent(parseFloat(e.target.value) || 0)}
                        className='w-20 text-right flex-none'
                        min="0"
                        max="100" // Allow higher input but slider is capped
                        step="0.5"
                    />
                    <span className="text-sm text-muted-foreground min-w-[3ch] text-left">%</span>
                </div>
            </div>

            {/* Inflation Rate - Moved Here */}
            <div>
               <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
               <div className='flex items-center gap-2'>
                   <Slider
                       id="inflationRate"
                       min={0}
                       max={15} // Cap slider at 15%
                       step={0.25}
                       value={[inflationRatePercent]}
                       onValueChange={(value: number[]) => setInflationRatePercent(value[0] ?? 0)}
                       className='flex-grow'
                   />
                   <Input
                       type="number"
                       value={inflationRatePercent}
                       onChange={(e) => setInflationRatePercent(parseFloat(e.target.value) || 0)}
                       className='w-20 text-right flex-none'
                       min="0"
                       max="100" // Allow higher input
                       step="0.25"
                   />
                   <span className="text-sm text-muted-foreground min-w-[3ch] text-left">%</span>
               </div>
           </div>

            {/* Projection Period */}
            <div>
                <Label htmlFor="projectionPeriod">Contribution Projection (Years)</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="projectionPeriod"
                        min={1}
                        max={25} // Increased max period
                        step={1}
                        value={[projectionPeriodYears]}
                        onValueChange={(value: number[]) => setProjectionPeriodYears(value[0] ?? 1)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={projectionPeriodYears}
                        onChange={(e) => setProjectionPeriodYears(parseInt(e.target.value) || 1)}
                        className='w-20 text-right flex-none'
                        min="1"
                        max="50" // Allow higher input
                    />
                     <span className="text-sm text-muted-foreground min-w-[3ch] text-left">Y</span>
                </div>
            </div>

            {/* Save Button at the Bottom */}
            <Button 
              onClick={handleSaveGoal} 
              className="w-full mt-4"
              variant="default"
            >
              {activeGoal ? 'Update Saved Goal' : 'Save Goal'}
            </Button>
          </div>

          {/* Right Column: Dynamic Outputs & Chart - Wrapped in a styled container */}
          <div className="md:col-span-3 space-y-4 p-6 rounded-lg border bg-muted/20">
             <h3 className="text-lg font-medium mb-4">Projection Results</h3>
             
             {/* Dynamic Output KPIs */}
             <div className="grid grid-cols-3 gap-4 mb-6">
                 <div className="p-4 rounded-lg border border-border/50 bg-card text-center flex flex-col items-center justify-center">
                     <Label className="text-xs text-muted-foreground">Est. Time to 0.1 BTC</Label>
                     <div className="mt-1">
                         {estimatedBtcTargetDate ? (
                             <>
                                 <p className="text-lg font-medium mb-0">
                                     {estimatedBtcTargetDate.toLocaleDateString('en-US', { 
                                         month: 'short', 
                                         year: 'numeric' 
                                     })}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                     Target: ${targetUsdValue ? formatCurrency(targetUsdValue) : 'N/A'}
                                 </p>
                             </>
                         ) : (
                             <p className="text-lg text-muted-foreground">Not reachable</p>
                         )}
                     </div>
                 </div>
                 
                 <div className="p-4 rounded-lg border border-border/50 bg-card text-center flex flex-col items-center justify-center">
                     <Label className="text-xs text-muted-foreground">Projected Value</Label>
                     <div className="mt-1">
                         <p className="text-lg font-medium mb-0">
                             ${formatCurrency(projectedValueUSD)}
                         </p>
                         <p className="text-xs text-muted-foreground">
                             ${formatCurrency(projectedValueAdjustedUSD)} (inflation adj.)
                         </p>
                     </div>
                 </div>
                 
                 <div className="p-4 rounded-lg border border-border/50 bg-card text-center flex flex-col items-center justify-center">
                     <Label className="text-xs text-muted-foreground">Return on Investment</Label>
                     <div className="mt-1">
                         <p className="text-lg font-medium mb-0">
                             {roiPercent.toFixed(1)}%
                         </p>
                         <p className="text-xs text-muted-foreground">
                             Total invested: ${formatCurrency(totalPrincipal)}
                         </p>
                     </div>
                 </div>
             </div>
             
             {/* Dynamic Projected Growth Chart Container */}
             <div className="rounded-lg border border-border/50 bg-card p-4 h-[28rem]">
                 {projectionData.length > 0 ? (
                     <ProjectionChart 
                         data={projectionData} 
                         showInflationAdjusted={showInflationAdjusted}
                     />
                 ) : (
                     <div className="h-full flex items-center justify-center">
                         <p className="text-muted-foreground">Adjust inputs to see projection chart</p>
                     </div>
                 )}
             </div>
             
             {/* Chart Options */}
             <div className="flex items-center space-x-2">
               <Checkbox 
                 id="showInflation" 
                 checked={showInflationAdjusted}
                 onCheckedChange={(checked) => setShowInflationAdjusted(checked === true)}
               />
               <Label htmlFor="showInflation" className="text-sm cursor-pointer">
                 Show inflation-adjusted value in chart
               </Label>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

