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
  priceGrowth: number,
  inflationRate: number = 3,
  showInflationAdjusted: boolean = true
): ChartDataPoint[] | undefined {
  if (isNaN(btcGoal) || btcGoal <= 0) return undefined;
  
  const { years: durationInYears } = getDurationDetails(duration);
  const { periodsPerYear } = getFrequencyDetails(frequency);
  const totalPeriods = Math.round(durationInYears * periodsPerYear);
  
  if (totalPeriods <= 0) return undefined;
  
  const annualGrowthRate = parseFloat(priceGrowth.toString()) / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const annualInflationRate = parseFloat(inflationRate.toString()) / 100;
  
  const startDate = new Date();
  const totalSatsGoal = Math.round(btcGoal * 100000000);
  const satsPerPeriod = Math.round(totalSatsGoal / totalPeriods);
  
  if (satsPerPeriod <= 0 && totalSatsGoal > 0) return undefined;
  
  const result: ChartDataPoint[] = [];
  let currentPrice = btcPrice;
  let cumulativeSats = 0;
  let cumulativeCost = 0;
  
  for (let i = 0; i < totalPeriods; i++) {
    const periodDate = addPeriods(startDate, frequency, i);
    const estimatedPriceThisPeriod = currentPrice;
    const btcNeededThisPeriod = satsPerPeriod / 100000000;
    const usdNeededThisPeriod = btcNeededThisPeriod * estimatedPriceThisPeriod;
    cumulativeSats += satsPerPeriod;
    const finalSats = (i === totalPeriods - 1) ? totalSatsGoal : cumulativeSats;

    // Calculate inflation-adjusted values if needed
    const yearsElapsed = i / periodsPerYear;
    const inflationFactor = Math.pow(1 + annualInflationRate, yearsElapsed);
    const adjustedUsdThisPeriod = showInflationAdjusted ? usdNeededThisPeriod / inflationFactor : usdNeededThisPeriod;
    const adjustedCumulativeValue = showInflationAdjusted ? 
      (finalSats / 100000000 * estimatedPriceThisPeriod) / inflationFactor : 
      (finalSats / 100000000 * estimatedPriceThisPeriod);

    result.push({
      date: formatDateLabel(periodDate, frequency, totalPeriods),
      accumulatedSats: finalSats,
      periodicSats: satsPerPeriod,
      estimatedBtcPrice: estimatedPriceThisPeriod,
      usdValueThisPeriod: adjustedUsdThisPeriod,
      cumulativeUsdValue: adjustedCumulativeValue,
      inflationAdjusted: showInflationAdjusted,
      rawUsdValue: usdNeededThisPeriod,
      rawCumulativeValue: finalSats / 100000000 * estimatedPriceThisPeriod,
      inflationFactor: inflationFactor
    });
    
    currentPrice *= (1 + periodicGrowthRate);
  }
  
  // Adjust final period calculations
  if (result.length > 0) {
    const lastPoint = result[result.length - 1];
    const finalPrice = currentPrice;
    
    if (lastPoint) {
      const lastInflationFactor = lastPoint.inflationFactor || 1;
      const rawValue = totalSatsGoal / 100000000 * finalPrice;
      lastPoint.rawCumulativeValue = rawValue;
      lastPoint.cumulativeUsdValue = showInflationAdjusted ? rawValue / lastInflationFactor : rawValue;
      
      const previousAccumulatedSats = result.length > 1 ? result[result.length - 2]?.accumulatedSats || 0 : 0;
      const satsInLastPeriod = totalSatsGoal - previousAccumulatedSats;
      lastPoint.periodicSats = satsInLastPeriod;
      
      const priceForLastPeriodCalc = lastPoint.estimatedBtcPrice ?? finalPrice;
      const rawUsdThisPeriod = (satsInLastPeriod / 100000000) * priceForLastPeriodCalc;
      lastPoint.rawUsdValue = rawUsdThisPeriod;
      lastPoint.usdValueThisPeriod = showInflationAdjusted ? rawUsdThisPeriod / lastInflationFactor : rawUsdThisPeriod;
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
  priceGrowth: number,
  inflationRate: number = 3,
  showInflationAdjusted: boolean = true
): ChartDataPoint[] | undefined {
  if (isNaN(recurringUSD) || recurringUSD <= 0) return undefined;
  
  const { years: durationInYears } = getDurationDetails(duration);
  const { periodsPerYear } = getFrequencyDetails(frequency);
  const totalPeriods = Math.round(durationInYears * periodsPerYear);
  
  if (totalPeriods <= 0) return undefined;
  
  const annualGrowthRate = parseFloat(priceGrowth.toString()) / 100;
  const periodicGrowthRate = Math.pow(1 + annualGrowthRate, 1 / periodsPerYear) - 1;
  const annualInflationRate = parseFloat(inflationRate.toString()) / 100;
  
  const startDate = new Date();
  const result: ChartDataPoint[] = [];
  let currentPrice = btcPrice;
  let cumulativeSats = 0;
  let totalInvested = 0;
  
  for (let i = 0; i < totalPeriods; i++) {
    const periodDate = addPeriods(startDate, frequency, i);
    const estimatedPriceThisPeriod = currentPrice;
    
    // Calculate inflation-adjusted recurring USD if needed
    const yearsElapsed = i / periodsPerYear;
    const inflationFactor = Math.pow(1 + annualInflationRate, yearsElapsed);
    const adjustedRecurringUSD = showInflationAdjusted ? 
      recurringUSD / inflationFactor : 
      recurringUSD;
    
    totalInvested += recurringUSD;
    
    // Calculate how much BTC can be bought with the adjusted USD
    const btcBoughtThisPeriod = adjustedRecurringUSD / estimatedPriceThisPeriod;
    const satsBoughtThisPeriod = Math.round(btcBoughtThisPeriod * 100000000);
    cumulativeSats += satsBoughtThisPeriod;
    
    // Calculate total value (possibly inflation-adjusted)
    const rawCumulativeValue = cumulativeSats / 100000000 * estimatedPriceThisPeriod;
    const adjustedCumulativeValue = showInflationAdjusted ? 
      rawCumulativeValue / inflationFactor : 
      rawCumulativeValue;

    result.push({
      date: formatDateLabel(periodDate, frequency, totalPeriods),
      accumulatedSats: cumulativeSats,
      periodicSats: satsBoughtThisPeriod,
      estimatedBtcPrice: estimatedPriceThisPeriod,
      usdValueThisPeriod: adjustedRecurringUSD,
      cumulativeUsdValue: adjustedCumulativeValue,
      inflationAdjusted: showInflationAdjusted,
      rawUsdValue: recurringUSD,
      rawCumulativeValue: rawCumulativeValue,
      inflationFactor: inflationFactor,
      totalInvested: totalInvested
    });
    
    currentPrice *= (1 + periodicGrowthRate);
  }
  
  // Adjust final value calculation
  if (result.length > 0) {
    const lastPoint = result[result.length - 1];
    const finalPrice = currentPrice;
    
    if (lastPoint) {
      const lastInflationFactor = lastPoint.inflationFactor || 1;
      const rawValue = lastPoint.accumulatedSats / 100000000 * finalPrice;
      lastPoint.rawCumulativeValue = rawValue;
      lastPoint.cumulativeUsdValue = showInflationAdjusted ? rawValue / lastInflationFactor : rawValue;
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
    projectionPeriodMonths, 
    inflationRatePercent, 
    targetBtcAmount, 
    currentBtcPriceUSD,
    startDate = new Date()
  } = params;

  const periodsPerYear = contributionFrequency === 'monthly' ? 12 : 52;
  const projectionPeriodYears = projectionPeriodMonths / 12;
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

  const dataPoints: ProjectionPoint[] = [{ month: 0, nominalValue: 0, adjustedValue: 0 }];

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
    if (period === Math.floor(totalPeriodsForChart)) {
      nominalValueAtPeriodEnd = currentNominalValue;
      principalAtPeriodEnd = principal;
      adjustedValueAtPeriodEnd = currentAdjustedValue;
    }

    // Store data points for chart - add points at regular intervals based on total periods
    const intervalForDataPoints = Math.max(1, Math.floor(totalPeriodsForChart / 50)); // Limit to ~50 data points max
    if (period <= totalPeriodsForChart && (period % intervalForDataPoints === 0 || period === Math.floor(totalPeriodsForChart))) { 
      const currentMonth = Math.ceil(period / periodsPerYear * 12);
      dataPoints.push({ 
        month: currentMonth, 
        nominalValue: currentNominalValue, 
        adjustedValue: currentAdjustedValue 
      });
    }

    // Stop loop early if target is found AND we have passed the chart period
    if (targetReachedPeriod !== null && period >= Math.floor(totalPeriodsForChart)) {
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

  // Add final data point if not already included
  if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].month < projectionPeriodMonths) {
    dataPoints.push({ 
      month: projectionPeriodMonths, 
      nominalValue: nominalValueAtPeriodEnd, 
      adjustedValue: adjustedValueAtPeriodEnd 
    });
  }

  // Ensure we have at least a few data points for the chart
  if (dataPoints.length < 3 && nominalValueAtPeriodEnd > 0) {
    // Generate evenly spaced data points
    const pointsToGenerate = Math.min(5, projectionPeriodMonths);
    const monthInterval = projectionPeriodMonths / pointsToGenerate;
    
    dataPoints.length = 1; // Keep only the starting point
    
    for (let i = 1; i <= pointsToGenerate; i++) {
      const monthAtPoint = Math.round(i * monthInterval);
      const periodAtPoint = Math.round((monthAtPoint / 12) * periodsPerYear);
      
      // Calculate values at this point
      let valueAtPoint = 0;
      
      for (let p = 1; p <= periodAtPoint; p++) {
        valueAtPoint += contributionAmountUSD;
        valueAtPoint *= (1 + periodicGrowthRate);
      }
      
      const yearsAtPoint = monthAtPoint / 12;
      const adjustedValueAtPoint = valueAtPoint / Math.pow(1 + annualInflationRate, yearsAtPoint);
      
      dataPoints.push({
        month: monthAtPoint,
        nominalValue: valueAtPoint,
        adjustedValue: adjustedValueAtPoint
      });
    }
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
    let weekRawUsd = 0;
    let weekTotalInvested = 0;

    chartData.forEach((point, index) => {
      const isStartOfWeek = index % 7 === 0;

      if (isStartOfWeek) {
        // Push previous week's data if it exists
        if (lastPointOfWeek) {
          weeklyData.push({
            ...lastPointOfWeek,
            date: weekStartDateLabel,
            periodicSats: weekSats,
            usdValueThisPeriod: weekUsd,
            rawUsdValue: weekRawUsd,
            totalInvested: weekTotalInvested
          });
        }
        
        // Reset for new week
        weekSats = 0;
        weekUsd = 0;
        weekRawUsd = 0;
        weekTotalInvested = 0;
        weekStartDateLabel = point.date;
      }

      // Accumulate for the week
      weekSats += point.periodicSats;
      if (point.usdValueThisPeriod) {
        weekUsd += point.usdValueThisPeriod;
      }
      if (point.rawUsdValue) {
        weekRawUsd += point.rawUsdValue;
      }
      if (point.totalInvested) {
        weekTotalInvested = point.totalInvested; // Use the latest value for the week
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
          rawUsdValue: weekRawUsd,
          totalInvested: weekTotalInvested
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