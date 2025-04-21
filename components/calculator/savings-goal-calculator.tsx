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
// import { Line } from 'react-chartjs-2'; // We'll add chart imports later
// We'll need Chart.js core and scales too later

// Define the structure for the saved goal data (based on our plan)
interface SavedGoalData {
  goalName: string;
  savedProjection: {
    contributionAmountUSD: number;
    contributionFrequency: string;
    expectedGrowthPercent: number;
    projectionPeriodYears: number;
    initialInvestmentUSD: number;
    // Add inflation rate to saved data if needed in the future
    // inflationRatePercent?: number;
  };
  calculatedOutputs: {
    projectedValueUSD: number;
    projectedValueAdjustedUSD?: number; // Add adjusted value
    roiPercent: number;
    completionDate: string;
    totalPrincipal: number;
    totalInterest: number;
  };
  startDate: string;
  // targetBTC?: string;
}

// Define the structure for chart data points including inflation
interface ProjectionPoint {
    year: number;
    nominalValue: number;
    adjustedValue: number;
}

export function SavingsGoalCalculator() {
  // State for Inputs
  const [goalName, setGoalName] = useState("My Savings Goal");
  const [initialInvestmentUSD, setInitialInvestmentUSD] = useState(0);
  const [contributionAmountUSD, setContributionAmountUSD] = useState(100);
  const [contributionFrequency, setContributionFrequency] = useState('monthly');
  const [expectedGrowthPercent, setExpectedGrowthPercent] = useState(10); // Annual %
  const [projectionPeriodYears, setProjectionPeriodYears] = useState(5);
  const [inflationRatePercent, setInflationRatePercent] = useState(3); // New state for inflation rate
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(true); // New state for checkbox

  // State for Calculated Outputs
  const [projectedValueUSD, setProjectedValueUSD] = useState(0);
  const [projectedValueAdjustedUSD, setProjectedValueAdjustedUSD] = useState(0); // New state for adjusted value
  const [roiPercent, setRoiPercent] = useState(0);
  // const [completionDate, setCompletionDate] = useState<Date | null>(null); // Removed, calculated dynamically
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]); // Updated state for chart data structure

  const [activeGoal, setActiveGoal] = useState<SavedGoalData | null>(null);

  // Calculation logic
  useEffect(() => {
    const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
    const totalPeriods = projectionPeriodYears * periodsPerYear;
    const periodicGrowthRate = Math.pow(1 + expectedGrowthPercent / 100, 1 / periodsPerYear) - 1;

    let currentValue = initialInvestmentUSD;
    let principal = initialInvestmentUSD;
    // We might want chart data later, so let's prepare an array
    // let projectionData = [{ period: 0, value: initialInvestmentUSD }];

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
    setTotalPrincipal(finalTotalPrincipal);
    setTotalInterest(finalTotalInterest);
    setRoiPercent(roi);
    // setChartData(projectionData); // Update chart data state later

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + projectionPeriodYears);
    // setCompletionDate(futureDate);

  }, [
    initialInvestmentUSD,
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
        setInitialInvestmentUSD(loadedGoal.savedProjection.initialInvestmentUSD);
        setContributionAmountUSD(loadedGoal.savedProjection.contributionAmountUSD);
        setContributionFrequency(loadedGoal.savedProjection.contributionFrequency);
        setExpectedGrowthPercent(loadedGoal.savedProjection.expectedGrowthPercent);
        setProjectionPeriodYears(loadedGoal.savedProjection.projectionPeriodYears);
        // Optional: Load saved inflation rate if we add it later
        // setInflationRatePercent(loadedGoal.savedProjection.inflationRatePercent ?? 3);
      } catch (error) {
        console.error("Failed to parse saved savings goal:", error);
        localStorage.removeItem('savingsGoal'); // Clear corrupted data
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Calculation Logic for Interactive Calculator ---
  useEffect(() => {
    const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
    const totalPeriods = projectionPeriodYears * periodsPerYear;
    const annualGrowthRate = expectedGrowthPercent / 100;
    const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
    const annualInflationRate = inflationRatePercent / 100;

    let currentNominalValue = initialInvestmentUSD;
    let principal = initialInvestmentUSD;
    // Initial adjusted value is the same as nominal
    let currentAdjustedValue = initialInvestmentUSD;

    // Start with the initial point for the chart
    const dataPoints: ProjectionPoint[] = [{
        year: 0,
        nominalValue: initialInvestmentUSD,
        adjustedValue: initialInvestmentUSD
    }];

    for (let period = 1; period <= totalPeriods; period++) {
        // Add contribution
        currentNominalValue += contributionAmountUSD;
        principal += contributionAmountUSD;
        // Apply growth
        currentNominalValue *= (1 + periodicGrowthRate);

        // Calculate inflation-adjusted value for the end of this period
        const yearsElapsed = period / periodsPerYear;
        // Correct way to calculate adjusted value at the *end* of the period based on the *nominal* value at the end of the period
        const currentAdjustedValueBasedOnNominal = currentNominalValue / Math.pow(1 + annualInflationRate, yearsElapsed);


        // Store data point annually or at the end
        if (period % periodsPerYear === 0 || period === totalPeriods) {
            const currentYear = Math.ceil(period / periodsPerYear);
            // Use the nominal-based calculation for the chart point
            dataPoints.push({
                year: currentYear,
                nominalValue: currentNominalValue,
                adjustedValue: currentAdjustedValueBasedOnNominal // Store the directly adjusted value
            });
        }
    }

    // Ensure the last point always reflects the final values if totalPeriods isn't perfectly divisible
     if (totalPeriods % periodsPerYear !== 0) {
        const finalAdjustedValue = currentNominalValue / Math.pow(1 + annualInflationRate, projectionPeriodYears);
        const lastYearIndex = dataPoints.findIndex(p => p.year === projectionPeriodYears);
        const finalPoint = {
            year: projectionPeriodYears,
            nominalValue: currentNominalValue,
            adjustedValue: finalAdjustedValue
        };
        if(lastYearIndex !== -1) {
            dataPoints[lastYearIndex] = finalPoint;
        } else {
             dataPoints.push(finalPoint);
        }
     }


    const finalProjectedValue = currentNominalValue;
    const finalProjectedAdjustedValue = finalProjectedValue / Math.pow(1 + annualInflationRate, projectionPeriodYears); // Final adjusted value
    const finalTotalPrincipal = principal;
    const finalTotalInterest = Math.max(0, finalProjectedValue - finalTotalPrincipal);
    const roi = finalTotalPrincipal > 0 ? (finalTotalInterest / finalTotalPrincipal) * 100 : 0;

    // Update state
    setProjectedValueUSD(finalProjectedValue);
    setProjectedValueAdjustedUSD(finalProjectedAdjustedValue); // Update new state
    setTotalPrincipal(finalTotalPrincipal);
    setTotalInterest(finalTotalInterest);
    setRoiPercent(roi);
    setProjectionData(dataPoints);

  }, [
    initialInvestmentUSD,
    contributionAmountUSD,
    contributionFrequency,
    expectedGrowthPercent,
    projectionPeriodYears,
    inflationRatePercent // Add inflation rate to dependencies
  ]);

  // --- Save Goal Function ---
  const handleSaveGoal = () => {
    console.log('Saving goal to localStorage...');
    const currentCompletionDate = new Date();
    currentCompletionDate.setFullYear(currentCompletionDate.getFullYear() + projectionPeriodYears);

    const goalToSave: SavedGoalData = {
        goalName: goalName,
        savedProjection: {
            initialInvestmentUSD: initialInvestmentUSD,
            contributionAmountUSD: contributionAmountUSD,
            contributionFrequency: contributionFrequency,
            expectedGrowthPercent: expectedGrowthPercent,
            projectionPeriodYears: projectionPeriodYears,
            // inflationRatePercent: inflationRatePercent, // Optionally save inflation rate
        },
        calculatedOutputs: {
            projectedValueUSD: projectedValueUSD,
            projectedValueAdjustedUSD: projectedValueAdjustedUSD, // Save adjusted value
            roiPercent: roiPercent,
            completionDate: currentCompletionDate.toISOString(),
            totalPrincipal: totalPrincipal,
            totalInterest: totalInterest,
        },
        startDate: new Date().toISOString(),
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

  // --- Calculate Time Progress ---
  const timeProgressPercent = useMemo(() => {
      if (!activeGoal?.startDate || !activeGoal?.calculatedOutputs?.completionDate) return 0;
      try {
          const startDate = new Date(activeGoal.startDate).getTime();
          const targetDate = new Date(activeGoal.calculatedOutputs.completionDate).getTime();
          const now = new Date().getTime();

          if (now >= targetDate) return 100;
          if (now <= startDate || targetDate <= startDate) return 0;

          const totalDuration = targetDate - startDate;
          const elapsedDuration = now - startDate;
          return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));

      } catch {
          return 0; // Handle invalid dates
      }
  }, [activeGoal]);

  // --- Format Currency ---
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    // Add dark mode classes to the main container
    <div className="rounded-lg border bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 shadow-sm p-6 space-y-8"> 

      {/* === Section A: Saved Goal Tracker (Conditional) === */}
      {activeGoal && (
        // Add dark mode classes for this section
        <div className="p-6 bg-muted/30 dark:bg-gray-800/50 rounded-lg border border-border dark:border-gray-700 space-y-4 relative"> 
            <div className='flex justify-between items-start'>
                <h2 className="text-xl font-semibold text-bitcoin-orange">{activeGoal.goalName}</h2>
                <Button variant="ghost" size="sm" onClick={handleDeleteGoal} className='text-xs text-muted-foreground dark:text-gray-400 hover:text-destructive dark:hover:text-red-500'>
                    Delete Goal
                </Button>
            </div>

             {/* Placeholder for Gauge and KPIs */}
             <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='md:col-span-1 flex flex-col items-center justify-center p-4'>
                    {/* Circular Progress Gauge Placeholder */}
                    {/* Add dark mode border class */}
                    <div className='w-32 h-32 rounded-full border-4 border-border dark:border-gray-600 flex items-center justify-center text-center'>
                         <div>
                            <p className='text-3xl font-bold'>{timeProgressPercent.toFixed(0)}%</p>
                            <p className='text-xs text-muted-foreground dark:text-gray-400'>Time Elapsed</p>
                         </div>
                    </div>
                    {/* Optional Target Amount Display */} 
                    {/* <p className='mt-2 text-sm text-center'>Target: {activeGoal.targetBTC || 'N/A'} BTC</p> */}
                </div>
                <div className='md:col-span-2 grid grid-cols-2 gap-4'>
                     {/* Add dark mode classes to KPI boxes */}
                     <div className="p-3 bg-card dark:bg-gray-700/50 rounded-lg border border-border/50 dark:border-gray-600">
                        <Label className="text-xs text-muted-foreground dark:text-gray-400">Projected Value</Label>
                        <p className="text-lg font-semibold">${formatCurrency(activeGoal.calculatedOutputs.projectedValueUSD)}</p>
                        {/* Display saved adjusted value if available */}
                        {activeGoal.calculatedOutputs.projectedValueAdjustedUSD !== undefined && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                                ${formatCurrency(activeGoal.calculatedOutputs.projectedValueAdjustedUSD)} (inflation adj.)
                            </p>
                        )}
                    </div>
                     <div className="p-3 bg-card dark:bg-gray-700/50 rounded-lg border border-border/50 dark:border-gray-600">
                        <Label className="text-xs text-muted-foreground dark:text-gray-400">Target Date</Label>
                        <p className="text-lg font-semibold">{formatSavedDate(activeGoal.calculatedOutputs.completionDate)}</p>
                    </div>
                    <div className="p-3 bg-card dark:bg-gray-700/50 rounded-lg border border-border/50 dark:border-gray-600">
                        <Label className="text-xs text-muted-foreground dark:text-gray-400">ROI</Label>
                        <p className="text-lg font-semibold">{activeGoal.calculatedOutputs.roiPercent.toFixed(1)}%</p>
                    </div>
                     <div className="p-3 bg-card dark:bg-gray-700/50 rounded-lg border border-border/50 dark:border-gray-600">
                        <Label className="text-xs text-muted-foreground dark:text-gray-400">Saved Contribution</Label>
                        <p className="text-lg font-semibold">
                            ${activeGoal.savedProjection.contributionAmountUSD.toLocaleString()} {activeGoal.savedProjection.contributionFrequency}
                        </p>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* === Section B: Interactive Calculator & Goal Setter === */}
      {/* Add dark mode border */}
      <div className="pt-6 border-t border-border dark:border-gray-700"> 
        <h2 className="text-xl font-semibold mb-4">
            {activeGoal ? "Update Your Projection / Goal" : "Calculate Savings Projection"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Inputs */}
          <div className="md:col-span-1 space-y-4">
             <div>
                <Label htmlFor="goalName">Goal/Projection Name</Label>
                <Input
                id="goalName"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g., House Down Payment"
                />
            </div>
             {/* Initial Investment */}
            <div>
                <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                <Input
                id="initialInvestment"
                type="number"
                value={initialInvestmentUSD}
                onChange={(e) => setInitialInvestmentUSD(parseFloat(e.target.value) || 0)}
                min="0"
                />
            </div>

            {/* Contribution Amount & Frequency */}
            <div className="flex gap-4">
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
            </div>

            {/* Expected Growth Rate */}
            <div>
                <Label htmlFor="expectedGrowth">Expected Annual Growth (%)</Label>
                <div className='flex items-center gap-2'>
                    <Slider
                        id="expectedGrowth"
                        min={0}
                        max={100} // Adjusted max for typical returns
                        step={0.5}
                        value={[expectedGrowthPercent]}
                        onValueChange={(value: number[]) => setExpectedGrowthPercent(value[0] ?? 0)}
                        className='flex-grow'
                    />
                    <Input
                        type="number"
                        value={expectedGrowthPercent}
                        onChange={(e) => setExpectedGrowthPercent(parseFloat(e.target.value) || 0)}
                        className='w-20 text-right'
                        min="0"
                        max="100" // Allow higher input but slider is capped
                        step="0.5"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                </div>
            </div>

            {/* Projection Period */}
            <div>
                <Label htmlFor="projectionPeriod">Projection Period (Years)</Label>
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
                        className='w-20 text-right'
                        min="1"
                        max="50" // Allow higher input
                    />
                     <span className="text-sm text-muted-foreground">Y</span>
                </div>
            </div>

            {/* Inflation Rate */}
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
                       className='w-20 text-right'
                       min="0"
                       max="100" // Allow higher input
                       step="0.25"
                   />
                   <span className="text-sm text-muted-foreground">%</span>
               </div>
           </div>

            {/* Save Button */}
            <Button onClick={handleSaveGoal} className="w-full bg-bitcoin-orange text-black hover:bg-bitcoin-orange/90 mt-4">
               {activeGoal ? "Update Saved Goal" : "Save as Savings Goal"}
            </Button>
          </div>

          {/* Right Column: Dynamic Outputs & Chart */}
          <div className="md:col-span-2 space-y-6">
            {/* Dynamic Output KPIs - Add dark mode classes */}
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 dark:bg-gray-800/50 rounded-lg border border-border dark:border-gray-700">
                    <Label className="text-sm text-muted-foreground dark:text-gray-400">Projected Value</Label>
                    {/* Display nominal and adjusted */}
                    <p className="text-2xl font-semibold">${formatCurrency(projectedValueUSD)}</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                        ${formatCurrency(projectedValueAdjustedUSD)} <span className='text-xs'>(inflation adj.)</span>
                    </p>
                </div>
                <div className="p-4 bg-muted/30 dark:bg-gray-800/50 rounded-lg border border-border dark:border-gray-700">
                    <Label className="text-sm text-muted-foreground dark:text-gray-400">Return on Investment</Label>
                    <p className="text-2xl font-semibold">{roiPercent.toFixed(1)}%</p>
                     <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Total interest: ${formatCurrency(totalInterest)}
                    </p>
                </div>
                <div className="p-4 bg-muted/30 dark:bg-gray-800/50 rounded-lg border border-border dark:border-gray-700">
                    <Label className="text-sm text-muted-foreground dark:text-gray-400">Completion Date</Label>
                    <p className="text-lg font-semibold">
                        {(() => {
                            const futureDate = new Date();
                            futureDate.setFullYear(futureDate.getFullYear() + projectionPeriodYears);
                            return futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        })()}
                    </p>
                    <p className='text-sm text-muted-foreground dark:text-gray-400'>{projectionPeriodYears} Years</p>
                </div>
             </div>

            {/* Dynamic Projected Growth Chart Container - Add dark mode classes */}
            <div className="space-y-2">
                 <div className="h-64 lg:h-80 w-full bg-muted/30 dark:bg-gray-800/50 rounded-md border border-border dark:border-gray-700 p-4">
                    {projectionData.length > 1 ? (
                        // Pass both data series and the toggle state to the chart
                        <ProjectionChart
                            data={projectionData}
                            showInflationAdjusted={showInflationAdjusted}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-muted-foreground dark:text-gray-400 text-center">Chart will appear here.</p>
                        </div>
                    )}
                    </div>
                 {/* Inflation Adjusted Checkbox */}
                 <div className="flex items-center space-x-2 pt-2">
                     <Checkbox
                         id="showInflationAdjusted"
                         checked={showInflationAdjusted}
                         onCheckedChange={(checked) => setShowInflationAdjusted(!!checked)} // Handle boolean conversion
                     />
                     <Label htmlFor="showInflationAdjusted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                         Show inflation-adjusted value in chart
                     </Label>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
