"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useSavingsGoalProgress } from '@/hooks/useSavingsGoalProgress';
import { differenceInMonths } from 'date-fns';
import Link from 'next/link';

// Define the structure for the saved goal data
interface SavedGoalData {
  goalName: string;
  startDate: string; // ISO string
  savedProjection: {
    contributionAmountUSD: number;
    contributionFrequency: string;
    expectedGrowthPercent: number;
    projectionPeriodYears: number;
    targetBtcAmount: number;
    currentBtcPriceUSD: number;
    inflationRatePercent: number;
  };
  estimatedTargetDateISO: string | null;
  projectedValueAtTarget: number | null;
  principalAtTarget: number | null;
  roiAtTarget: number | null;
}

interface SavingsGoalWidgetProps {
  className?: string;
}

export function SavingsGoalWidget({ className }: SavingsGoalWidgetProps) {
  const [activeGoal, setActiveGoal] = useState<SavedGoalData | null>(null);
  const [timeLeftMonths, setTimeLeftMonths] = useState<number | null>(null);
  
  // Get progress data using the hook
  const goalProgress = useSavingsGoalProgress(
    activeGoal
      ? {
          startDate: activeGoal.startDate,
          targetBtcAmount: activeGoal.savedProjection.targetBtcAmount,
        }
      : null
  );
  
  // Load goal from localStorage on mount
  useEffect(() => {
    const savedGoalString = localStorage.getItem('savingsGoal');
    if (savedGoalString) {
      try {
        const loadedGoal = JSON.parse(savedGoalString) as SavedGoalData;
        setActiveGoal(loadedGoal);
        
        // Calculate time left if end date exists
        if (loadedGoal.estimatedTargetDateISO) {
          const endDate = new Date(loadedGoal.estimatedTargetDateISO);
          const now = new Date();
          const monthsLeft = differenceInMonths(endDate, now);
          setTimeLeftMonths(monthsLeft > 0 ? monthsLeft : 0);
        }
      } catch (error) {
        console.error("Failed to parse saved savings goal:", error);
      }
    }
  }, []);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // If no goal is saved, show placeholder or nothing
  if (!activeGoal) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">No Savings Goal Set</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set a savings goal to track your progress
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/calculator">Create Goal</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate current saved amount (accumulated BTC × current price)
  const currentSaved = goalProgress.isLoading
    ? "Loading..."
    : `$${formatCurrency(goalProgress.accumulatedBtcSinceStart * activeGoal.savedProjection.currentBtcPriceUSD)}`;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Saved</CardTitle>
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs" asChild>
          <Link href="/dashboard/calculator">Details</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-bitcoin-orange">{currentSaved}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Target: {activeGoal.savedProjection.targetBtcAmount} BTC
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Time left: {timeLeftMonths !== null ? `${timeLeftMonths} months` : 'Calculating...'}
        </p>
        
        {/* Progress bar */}
        <div className="w-full h-2 mt-2 bg-muted rounded-full">
          <div 
            className="bg-bitcoin-orange h-2 rounded-full" 
            style={{ width: `${goalProgress.btcProgressPercent}%` }}
          ></div>
        </div>
      </CardContent>
    </Card>
  );
} 