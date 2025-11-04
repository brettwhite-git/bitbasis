"use client";

import { useState, useEffect, useMemo } from 'react';

import { Button } from "@/components/ui/button";
import { useSavingsGoalData } from '@/lib/hooks';
import { calculateTimeRemaining } from '@/lib/utils/utils';
import { CheckCircle, LoaderCircle, ExternalLink } from "lucide-react";
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
  
  // Memoize the goal object to prevent infinite re-renders
  const memoizedGoal = useMemo(() => {
    return activeGoal
      ? {
          startDate: activeGoal.startDate,
          targetBtcAmount: activeGoal.savedProjection.targetBtcAmount,
        }
      : null;
  }, [activeGoal]);

  // Get progress data using the hook
  const goalProgress = useSavingsGoalData(memoizedGoal);
  
  // Load goal from localStorage on mount
  useEffect(() => {
    const savedGoalString = localStorage.getItem('savingsGoal');
    if (savedGoalString) {
      try {
        const loadedGoal = JSON.parse(savedGoalString) as SavedGoalData;
        setActiveGoal(loadedGoal);
      } catch (error) {
        console.error("Failed to parse saved savings goal:", error);
      }
    }
  }, []);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Format date for display in MMM D, YYYY format (like "Jun 7, 2027")
  const formatDateCompact = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } catch {
      return 'Invalid Date';
    }
  };

  // If no goal is saved, show placeholder
  if (!activeGoal) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm flex flex-col ${className || ''}`}>
        <div className="relative z-10 flex flex-col h-full justify-center min-h-[140px]">
          <h3 className="text-lg font-bold text-white mb-4">No Savings Goal Set</h3>
          <p className="text-sm text-gray-400 mb-4">
            Set a savings goal to track your progress
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/calculator">Create Goal</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate current saved amount (accumulated BTC × current price)
  const currentSaved = goalProgress.isLoading
    ? "Loading..."
    : `$${formatCurrency(goalProgress.accumulatedBtcSinceStart * activeGoal.savedProjection.currentBtcPriceUSD)}`;

  // Calculate current sats accumulated and format in millions with one decimal
  const currentSatsInMillions = goalProgress.isLoading 
    ? "Loading..." 
    : ((goalProgress.accumulatedBtcSinceStart * 100000000) / 1000000).toFixed(1) + 'M';

  // Calculate target sats in millions
  const targetSatsInMillions = (activeGoal.savedProjection.targetBtcAmount * 100000000) / 1000000;
  const formattedTargetSats = targetSatsInMillions.toFixed(1) + 'M';

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm ${className || ''}`}>
      <div className="relative z-10">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-md font-bold text-white">{activeGoal.goalName}</h3>
          <Link href="/dashboard/calculator" className="text-gray-400 hover:text-white transition-colors">
            <ExternalLink className="h-5 w-5" />
          </Link>
        </div>
        <div className="space-y-3">
        {/* Header Section with Current Value and Progress */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xl font-bold text-bitcoin-orange">
              <span>{currentSaved}</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Target: {activeGoal.savedProjection.targetBtcAmount} BTC
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ${activeGoal.savedProjection.contributionAmountUSD.toLocaleString()} {activeGoal.savedProjection.contributionFrequency.charAt(0).toUpperCase() + 
                activeGoal.savedProjection.contributionFrequency.slice(1)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-xl font-bold text-bitcoin-orange mb-1 flex justify-end items-center">
              {goalProgress.isLoading ? '...' : (
                <>
                  <span>{currentSatsInMillions}</span>
                  <span className="mx-1">/</span>
                  <span>{formattedTargetSats}</span>
                  <span className="text-sm ml-1">sats</span>
                </>
              )}
            </p>
            <div className="flex items-center justify-end">
              <p className="text-xl font-bold mr-1">
                {goalProgress.isLoading ? '...' : `${goalProgress.btcProgressPercent.toFixed(0)}%`}
              </p>
              {goalProgress.isLoading ? (
                <LoaderCircle className="animate-spin text-gray-400 h-4 w-4" />
              ) : goalProgress.btcProgressPercent >= 100 ? (
                <CheckCircle className="text-bitcoin-orange h-5 w-5" />
              ) : (
                <LoaderCircle className="text-bitcoin-orange h-4 w-4" />
              )}
            </div>
            {activeGoal.estimatedTargetDateISO && (
              <p className="text-xs text-gray-400 mt-1">
                {calculateTimeRemaining(activeGoal.estimatedTargetDateISO, new Date(), 'long')}
              </p>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div>
          <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-bitcoin-orange h-2 rounded-full transition-all duration-700" 
              style={{ width: `${goalProgress.btcProgressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-3">
            <span>Start: {formatDateCompact(activeGoal.startDate)}</span>
            <span>Est. Completion: {formatDateCompact(activeGoal.estimatedTargetDateISO)}</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
} 