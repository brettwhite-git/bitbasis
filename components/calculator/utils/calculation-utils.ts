import { 
  ChartDataPoint, 
  CalculateProjectionParams, 
  ProjectionResult, 
  ProjectionPoint 
} from '../types/calculator-types';
import { getDurationDetails, getFrequencyDetails, addPeriods, formatDateLabel } from './date-utils';

/**
 * Calculates chart data for a fixed sats goal
 */
export function calculateSatsGoalData(
  btcGoal: number,
  duration: string,
  frequency: string,
  btcPrice: number,
  priceGrowth: number
): ChartDataPoint[] | undefined {
  if (isNaN(btcGoal) || btcGoal <= 0) return undefined;
  
  const { years: durationInYears } = getDurationDetails(duration);
  const { periodsPerYear } = getFrequencyDetails(frequency);
  const totalPeriods = Math.round(durationInYears * periodsPerYear);
  
  if (totalPeriods <= 0) return undefined;
  
  const annualGrowthRate = parseFloat(priceGrowth.toString()) / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const startDate = new Date();
  const totalSatsGoal = Math.round(btcGoal * 100000000);
  const satsPerPeriod = Math.round(totalSatsGoal / totalPeriods);
  
  if (satsPerPeriod <= 0 && totalSatsGoal > 0) return undefined;
  
  const result: ChartDataPoint[] = [];
  let currentPrice = btcPrice;
  let cumulativeSats = 0;
  
  for (let i = 0; i < totalPeriods; i++) {
    const periodDate = addPeriods(startDate, frequency, i);
    const estimatedPriceThisPeriod = currentPrice;
    const btcNeededThisPeriod = satsPerPeriod / 100000000;
    const usdNeededThisPeriod = btcNeededThisPeriod * estimatedPriceThisPeriod;
    cumulativeSats += satsPerPeriod;
    const finalSats = (i === totalPeriods - 1) ? totalSatsGoal : cumulativeSats;

    result.push({
      date: formatDateLabel(periodDate, frequency, totalPeriods),
      accumulatedSats: finalSats,
      periodicSats: satsPerPeriod,
      estimatedBtcPrice: estimatedPriceThisPeriod,
      usdValueThisPeriod: usdNeededThisPeriod,
      cumulativeUsdValue: finalSats / 100000000 * estimatedPriceThisPeriod
    });
    
    currentPrice *= (1 + periodicGrowthRate);
  }
  
  // Adjust final period calculations
  if (result.length > 0) {
    const lastPoint = result[result.length - 1];
    const finalPrice = currentPrice;
    
    if (lastPoint) {
      lastPoint.cumulativeUsdValue = totalSatsGoal / 100000000 * finalPrice;
      const previousAccumulatedSats = result.length > 1 ? result[result.length - 2]?.accumulatedSats || 0 : 0;
      const satsInLastPeriod = totalSatsGoal - previousAccumulatedSats;
      lastPoint.periodicSats = satsInLastPeriod;
      const priceForLastPeriodCalc = lastPoint.estimatedBtcPrice ?? finalPrice;
      lastPoint.usdValueThisPeriod = (satsInLastPeriod / 100000000) * priceForLastPeriodCalc;
    }
  }
  
  return result;
}

/**
 * Calculates chart data for recurring buy
 */
export function calculateRecurringBuyData(
  recurringUSD: number,
  duration: string,
  frequency: string,
  btcPrice: number,
  priceGrowth: number
): ChartDataPoint[] | undefined {
  if (isNaN(recurringUSD) || recurringUSD <= 0) return undefined;
  
  const { years: durationInYears } = getDurationDetails(duration);
  const { periodsPerYear } = getFrequencyDetails(frequency);
  const totalPeriods = Math.round(durationInYears * periodsPerYear);
  
  if (totalPeriods <= 0) return undefined;
  
  const annualGrowthRate = parseFloat(priceGrowth.toString()) / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const startDate = new Date();
  const result: ChartDataPoint[] = [];
  let currentPrice = btcPrice;
  let cumulativeSats = 0;
  
  for (let i = 0; i < totalPeriods; i++) {
    const periodDate = addPeriods(startDate, frequency, i);
    const estimatedPriceThisPeriod = currentPrice;
    const btcBoughtThisPeriod = recurringUSD / estimatedPriceThisPeriod;
    const satsBoughtThisPeriod = Math.round(btcBoughtThisPeriod * 100000000);
    cumulativeSats += satsBoughtThisPeriod;

    result.push({
      date: formatDateLabel(periodDate, frequency, totalPeriods),
      accumulatedSats: cumulativeSats,
      periodicSats: satsBoughtThisPeriod,
      estimatedBtcPrice: estimatedPriceThisPeriod,
      usdValueThisPeriod: recurringUSD,
      cumulativeUsdValue: cumulativeSats / 100000000 * estimatedPriceThisPeriod
    });
    
    currentPrice *= (1 + periodicGrowthRate);
  }
  
  // Adjust final value calculation
  if (result.length > 0) {
    const lastPoint = result[result.length - 1];
    const finalPrice = currentPrice;
    
    if (lastPoint) {
      lastPoint.cumulativeUsdValue = lastPoint.accumulatedSats / 100000000 * finalPrice;
    }
  }
  
  return result;
}

/**
 * Calculates projection data for savings goal
 */
export function calculateProjection(params: CalculateProjectionParams): ProjectionResult {
  const { 
    contributionAmountUSD, 
    contributionFrequency, 
    expectedGrowthPercent, 
    projectionPeriodYears, 
    inflationRatePercent, 
    targetBtcAmount, 
    currentBtcPriceUSD,
    startDate = new Date()
  } = params;

  const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
  const totalPeriodsForChart = projectionPeriodYears * periodsPerYear;
  const annualGrowthRate = expectedGrowthPercent / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const annualInflationRate = inflationRatePercent / 100;

  const targetUsd = targetBtcAmount > 0 && currentBtcPriceUSD > 0 
    ? targetBtcAmount * currentBtcPriceUSD 
    : null;

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
      projectedValueAtTarget = currentNominalValue;
      principalAtTarget = principal;
    }

    // Capture values at the end of the user's specified projection period
    if (period === totalPeriodsForChart) {
      nominalValueAtPeriodEnd = currentNominalValue;
      principalAtPeriodEnd = principal;
      adjustedValueAtPeriodEnd = currentAdjustedValue;
    }

    // Store data points only within the user's selected projection period for the chart
    if (period <= totalPeriodsForChart && period % periodsPerYear === 0) { 
      const currentYear = Math.ceil(period / periodsPerYear);
      dataPoints.push({ 
        year: currentYear, 
        nominalValue: currentNominalValue, 
        adjustedValue: currentAdjustedValue 
      });
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
    const dateEstimate = new Date(startDate);
    dateEstimate.setFullYear(dateEstimate.getFullYear() + targetYear);
    const monthEstimate = (targetReachedPeriod % periodsPerYear) * (12 / periodsPerYear);
    dateEstimate.setMonth(dateEstimate.getMonth() + Math.floor(monthEstimate));
    estimatedTargetDate = dateEstimate;
  }

  // Ensure the end values are captured even if totalPeriodsForChart wasn't hit exactly
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

/**
 * Aggregates chart data for better visualization on long daily frequencies
 */
export function aggregateChartData(
  chartData: ChartDataPoint[],
  frequency: string,
  goalDuration: string
): ChartDataPoint[] | undefined {
  if (!chartData || !chartData.length) return undefined;

  const { years: durationInYears } = getDurationDetails(goalDuration);
  const startDateForCalc = new Date();

  // Aggregate to weekly if daily frequency and duration > 6 months
  if (frequency === 'daily' && durationInYears > 0.5) {
    const weeklyData: ChartDataPoint[] = [];
    let weekSats = 0;
    let weekUsd = 0;
    let lastPointOfWeek: ChartDataPoint | null = null;
    let weekStartDateLabel = '';

    chartData.forEach((point, index) => {
      const isStartOfWeek = index % 7 === 0;
      const periodDate = addPeriods(startDateForCalc, frequency, index);

      if (isStartOfWeek) {
        // Push previous week's data if it exists
        if (lastPointOfWeek) {
          weeklyData.push({
            ...lastPointOfWeek,
            date: weekStartDateLabel,
            periodicSats: weekSats,
            usdValueThisPeriod: weekUsd,
          });
        }
        
        // Reset for new week
        weekSats = 0;
        weekUsd = 0;
        weekStartDateLabel = point.date;
      }

      // Accumulate for the week
      weekSats += point.periodicSats;
      if (point.usdValueThisPeriod) {
        weekUsd += point.usdValueThisPeriod;
      }

      // Save the last point for each week
      lastPointOfWeek = point;

      // If it's the last point, push the current week as-is
      if (index === chartData.length - 1 && lastPointOfWeek) {
        weeklyData.push({
          ...lastPointOfWeek,
          date: weekStartDateLabel,
          periodicSats: weekSats,
          usdValueThisPeriod: weekUsd,
        });
      }
    });

    return weeklyData;
  }

  // For monthly aggregation on daily data if duration > 2 years
  if (frequency === 'daily' && durationInYears > 2) {
    // Similar logic to weekly aggregation but with month groups
    // ...
  }

  // Return the original data if no aggregation is needed
  return chartData;
} 