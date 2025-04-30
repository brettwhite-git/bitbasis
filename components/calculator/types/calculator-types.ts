/**
 * Shared types for calculator components
 */

// Bitcoin unit types
export type BitcoinUnit = 'bitcoin' | 'satoshi';

// Calculator mode types
export type CalculatorMode = 'satsGoal' | 'recurringBuy' | 'savingsGoal';

// Chart data structure
export interface ChartDataPoint {
  date: string;
  accumulatedSats: number;
  periodicSats: number;
  estimatedBtcPrice?: number;
  usdValueThisPeriod?: number;
  cumulativeUsdValue?: number;
}

// Projection chart data structure
export interface ProjectionPoint {
  year: number;
  nominalValue: number;
  adjustedValue: number;
}

// Savings goal data structure
export interface SavedGoalData {
  goalName: string;
  startDate: string; // ISO string

  // Input parameters at the time of saving
  savedProjection: {
    contributionAmountUSD: number;
    contributionFrequency: string;
    expectedGrowthPercent: number;
    projectionPeriodYears: number;
    targetBtcAmount: number;
    currentBtcPriceUSD: number;
    inflationRatePercent: number;
  };

  // Calculated outcomes
  estimatedTargetDateISO: string | null;
  projectedValueAtTarget: number | null;
  principalAtTarget: number | null;
  roiAtTarget: number | null;
}

// Projection calculation parameters
export interface CalculateProjectionParams {
  contributionAmountUSD: number;
  contributionFrequency: string;
  expectedGrowthPercent: number;
  projectionPeriodYears: number;
  inflationRatePercent: number;
  targetBtcAmount: number;
  currentBtcPriceUSD: number;
  startDate?: Date;
}

// Projection calculation result
export interface ProjectionResult {
  dataPoints: ProjectionPoint[];
  estimatedTargetDate: Date | null;
  projectedValueAtTarget: number | null;
  principalAtTarget: number | null;
  nominalValueAtPeriodEnd: number;
  adjustedValueAtPeriodEnd: number;
  principalAtPeriodEnd: number;
} 