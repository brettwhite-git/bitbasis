import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { 
  PerformanceMetrics,
  DCAPerformanceResult
} from './types'
import { 
  calculateYearsBetween, 
  getPortfolioStateAtDate, 
  calculateCAGR,
  calculateApproximateCAGR,
  calculateBTCHoldingsAtDate,
  getHistoricalBTCPrice
} from '@/lib/utils/portfolio-utils'
import { getBenchmarkCAGR, getAvailableBenchmarkPeriods } from '@/lib/constants/benchmark-cagr'

// Import the unified transaction type from types
import { UnifiedTransaction } from '@/types/transactions'

/**
 * Calculates HODL time as days since last sell, or days since first buy if no sells
 */
function calculateWeightedHodlTime(transactions: UnifiedTransaction[], currentDate: Date): number {
  // Find the most recent sell transaction
  const sellTransactions = transactions
    .filter(transaction => transaction.type === 'sell')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const lastSell = sellTransactions[0]
  
  if (lastSell) {
    // If there's a sell, calculate days since last sell
    const lastSellDate = new Date(lastSell.date)
    return Math.floor((currentDate.getTime() - lastSellDate.getTime()) / (1000 * 60 * 60 * 24))
  } else {
    // If no sells, calculate days since first buy
    const buyTransactions = transactions
      .filter(transaction => transaction.type === 'buy')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    const firstBuy = buyTransactions[0]
    if (firstBuy) {
      const firstBuyDate = new Date(firstBuy.date)
      return Math.floor((currentDate.getTime() - firstBuyDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  
  return 0
}

/**
 * Calculates DCA performance vs lump sum performance
 */
export function calculateDCAPerformance(transactions: UnifiedTransaction[], currentPrice: number): DCAPerformanceResult {
  // Filter to get only buy transactions from the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const recentBuyTransactions = transactions.filter(transaction => 
    transaction.type === 'buy' && 
    new Date(transaction.date) >= sixMonthsAgo
  )

  if (recentBuyTransactions.length === 0) {
    return {
      dcaReturn: 0,
      lumpSumReturn: 0,
      outperformance: 0
    }
  }

  // Calculate DCA performance
  let totalInvested = 0
  let totalBtcBought = 0
  
  recentBuyTransactions.forEach(transaction => {
    if (transaction.sent_amount && transaction.received_amount) {
      totalInvested += transaction.sent_amount
      totalBtcBought += transaction.received_amount
    }
  })

  // Current value of DCA strategy
  const currentValue = totalBtcBought * currentPrice
  const dcaReturn = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0

  // Calculate hypothetical lump sum performance
  const firstTransaction = recentBuyTransactions[0]
  const lumpSumBtc = firstTransaction && firstTransaction.price ? totalInvested / firstTransaction.price : 0
  const lumpSumValue = lumpSumBtc * currentPrice
  const lumpSumReturn = totalInvested > 0 ? ((lumpSumValue - totalInvested) / totalInvested) * 100 : 0

  return {
    dcaReturn,
    lumpSumReturn,
    outperformance: dcaReturn - lumpSumReturn
  }
}

/**
 * Fetches and calculates performance metrics for a user's portfolio
 */
export async function getPerformanceMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<PerformanceMetrics> {
  try {
    // Fetch all necessary data in parallel using unified transactions table
    const [transactionsResult, priceResult, athResult] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          id, date, type,
          sent_amount, sent_currency,
          received_amount, received_currency, 
          fee_amount, fee_currency,
          price, from_address_name, to_address_name
        `)
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),
      supabase // Fetch ATH price
        .from('ath')
        .select('price_usd, ath_date')
        .order('price_usd', { ascending: false })
        .limit(1)
        .single()
    ])

    if (transactionsResult.error) throw transactionsResult.error
    if (priceResult.error) throw priceResult.error
    if (athResult.error && athResult.error.code !== 'PGRST116') { // Ignore 'Not found' for ATH
      throw athResult.error
    }

    // Convert partial transaction data to UnifiedTransaction with required fields
    const transactions: UnifiedTransaction[] = (transactionsResult.data || []).map(tx => ({
      ...tx,
      created_at: '', // Not needed for performance calculations
      updated_at: null,
      user_id: userId,
      asset: 'BTC',
      sent_cost_basis: null,
      received_cost_basis: null,
      fee_cost_basis: null,
      realized_return: null,
      fee_realized_return: null,
      from_address: null,
      to_address: null,
      transaction_hash: null,
      comment: null,
      csv_upload_id: null
    }))
    if (!priceResult.data) throw new Error('No Bitcoin price data available')
    const currentPrice = priceResult.data.price_usd
    const marketAthPrice = athResult.data?.price_usd ?? 0
    const marketAthDate = athResult.data?.ath_date ?? 'N/A'

    if (transactions.length === 0) {
      // Handle case with no transactions gracefully
      return {
        cumulative: {
          total: { percent: 0, dollar: 0 },
          day: { percent: 0, dollar: 0 },
          week: { percent: 0, dollar: 0 },
          month: { percent: null, dollar: null },
          ytd: { percent: null, dollar: null },
          threeMonth: { percent: null, dollar: null },
          year: { percent: null, dollar: null },
          twoYear: { percent: null, dollar: null },
          threeYear: { percent: null, dollar: null },
          fourYear: { percent: null, dollar: null },
          fiveYear: { percent: null, dollar: null }
        },
        compoundGrowth: {
          total: null, oneYear: null, twoYear: null, threeYear: null,
          fourYear: null, fiveYear: null, sixYear: null, sevenYear: null, eightYear: null
        },
        allTimeHigh: { price: marketAthPrice, date: marketAthDate },
        maxDrawdown: { percent: 0, fromDate: 'N/A', toDate: 'N/A', portfolioATH: 0, portfolioLow: 0 },
        hodlTime: 0
      }
    }

    // Data structure to hold portfolio value over time
    const portfolioHistory: { date: Date; btc: number; usdValue: number; investment: number }[] = []
    let currentBtc = 0
    let currentInvestment = 0 // Total USD spent on buys

    // Calculate historical portfolio value and investment using unified schema
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date)
      let btcChange = 0
      let investmentChange = 0

      if (transaction.type === 'buy' && transaction.received_amount) {
        btcChange = transaction.received_amount
        // Investment includes buy amount + USD service fee
        const fee = (transaction.fee_amount && transaction.fee_currency === 'USD') ? transaction.fee_amount : 0
        investmentChange = (transaction.sent_amount || 0) + fee
      } else if (transaction.type === 'sell' && transaction.sent_amount) {
        btcChange = -transaction.sent_amount
        // Sells reduce BTC but don't change the *initial* investment amount directly
        // Realized gains handle the profit/loss aspect
      }

      currentBtc += btcChange
      currentInvestment += investmentChange
      
      // Use the price at the time of the transaction for historical value
      const valueAtTx = currentBtc * (transaction.price || 0)

      portfolioHistory.push({
        date: transactionDate,
        btc: currentBtc,
        usdValue: valueAtTx,
        investment: currentInvestment
      })
    })

    // Add current state
    const now = new Date()
    const currentValue = currentBtc * currentPrice
    portfolioHistory.push({
      date: now,
      btc: currentBtc,
      usdValue: currentValue,
      investment: currentInvestment
    })
    
    // Add monthly points for more accurate drawdown calculation
    if (portfolioHistory.length >= 2) {
      const additionalPoints = [];
      // Get all months between first and last transaction
      const firstPoint = portfolioHistory[0];
      if (!firstPoint) {
        throw new Error("No first point in portfolio history");
      }
      
      const firstDate = new Date(firstPoint.date);
      const lastDate = new Date();
      
      // Create a sorted copy so we can reliably find transactions by date
      const sortedHistory = [...portfolioHistory].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      // Iterate through each month
      let currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 1);
      
      while (currentMonth < lastDate) {
        // Check if we already have a point for this month
        const existingPoint = sortedHistory.find(point => {
          const pointDate = point.date;
          return pointDate.getFullYear() === currentMonth.getFullYear() && 
                 pointDate.getMonth() === currentMonth.getMonth();
        });
        
        if (!existingPoint) {
          // Find the last transaction before this month
          let prevPoint = sortedHistory[0]; // Default to first point
          
          for (const point of sortedHistory) {
            if (point.date < currentMonth) {
              prevPoint = point;
            } else {
              break; // Found first point after current month
            }
          }
          
          // Create a new point for this month with accurate price data
          // For now, use current price as an approximation
          if (prevPoint) {
            additionalPoints.push({
              date: new Date(currentMonth),
              btc: prevPoint.btc,
              usdValue: prevPoint.btc * currentPrice,
              investment: prevPoint.investment
            });
          }
        }
        
        // Move to next month
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      }
      
      // Add all the new points
      if (additionalPoints.length > 0) {
        portfolioHistory.push(...additionalPoints);
        
        // Sort the entire portfolio history chronologically after adding points
        portfolioHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
      }
    }
    
    // Improve historical valuation by using real price data instead of just transaction prices
    // This is critical for accurate drawdown calculation
    if (portfolioHistory.length > 0) {
      // Apply current price to the most recent data points (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      portfolioHistory.forEach(point => {
        // For recent points, update using current price
        if (point.date >= thirtyDaysAgo) {
          point.usdValue = point.btc * currentPrice;
        }
        
        // Important: when the price used to calculate usdValue is 0 or very small,
        // it can create artificial drawdowns that don't reflect reality
        if (point.usdValue <= 0 && point.btc > 0) {
          point.usdValue = point.btc * currentPrice; // Fallback to current price
        }
      });
    }

    // Calculate performance over different periods using precise date calculations
    const today = new Date()
    
    // Use millisecond-based calculations for more precision
    const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000))
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    
    // For months and years, use the date methods but be more careful about edge cases
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    // Handle case where today is 31st and previous month has fewer days
    if (lastMonth.getMonth() === today.getMonth()) {
      lastMonth.setDate(0) // Go to last day of previous month
    }
    
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    
    const threeMonthsAgo = new Date(today)
    threeMonthsAgo.setMonth(today.getMonth() - 3)
    if (threeMonthsAgo.getMonth() !== (today.getMonth() - 3 + 12) % 12) {
      threeMonthsAgo.setDate(0) // Adjust for month-end edge cases
    }
    
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    const twoYearsAgo = new Date(today)
    twoYearsAgo.setFullYear(today.getFullYear() - 2)
    
    const threeYearsAgo = new Date(today)
    threeYearsAgo.setFullYear(today.getFullYear() - 3)
    
    const fourYearsAgo = new Date(today)
    fourYearsAgo.setFullYear(today.getFullYear() - 4)
    
    const fiveYearsAgo = new Date(today)
    fiveYearsAgo.setFullYear(today.getFullYear() - 5)

    const valueNow = { usdValue: currentValue, investment: currentInvestment }
    const valueYesterday = getPortfolioStateAtDate(portfolioHistory, yesterday, currentPrice)
    const valueLastWeek = getPortfolioStateAtDate(portfolioHistory, lastWeek, currentPrice)
    const valueLastMonth = getPortfolioStateAtDate(portfolioHistory, lastMonth, currentPrice)
    const valueStartOfYear = getPortfolioStateAtDate(portfolioHistory, startOfYear, currentPrice)
    const valueThreeMonthsAgo = getPortfolioStateAtDate(portfolioHistory, threeMonthsAgo, currentPrice)
    const valueOneYearAgo = getPortfolioStateAtDate(portfolioHistory, oneYearAgo, currentPrice)
    const valueTwoYearsAgo = getPortfolioStateAtDate(portfolioHistory, twoYearsAgo, currentPrice)
    const valueThreeYearsAgo = getPortfolioStateAtDate(portfolioHistory, threeYearsAgo, currentPrice)
    const valueFourYearsAgo = getPortfolioStateAtDate(portfolioHistory, fourYearsAgo, currentPrice)
    const valueFiveYearsAgo = getPortfolioStateAtDate(portfolioHistory, fiveYearsAgo, currentPrice)

    // Helper for cumulative return calculation (End Value / Start Value) - 1
    const calculateCumulativeReturnPercent = (endValue: number, startValue: number) => {
      return startValue > 0 ? ((endValue / startValue) - 1) * 100 : 0
    }
    
    // Helper for ROI calculation (Gain / Investment) - for specific use cases
    const calculateROIPercent = (endValue: number, startValue: number, startInvestment: number) => {
      return startInvestment > 0 ? ((endValue - startValue) / startInvestment) * 100 : 0
    }
    
    // Helper for dollar calculation (End Value - Start Value)
    const calculateReturnDollar = (endValue: number, startValue: number) => {
      return endValue - startValue
    }

    const firstOrderDate = portfolioHistory[0]?.date
    const totalInvestment = currentInvestment

    // Cumulative Returns - Using proper cumulative return formula: (End Value / Start Value) - 1
    const cumulative = {
      total: {
        percent: totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0, // Total return is still ROI
        dollar: currentValue - totalInvestment
      },
      day: {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueYesterday.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueYesterday.usdValue)
      },
      week: {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueLastWeek.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueLastWeek.usdValue)
      },
      month: firstOrderDate && firstOrderDate <= lastMonth ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueLastMonth.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueLastMonth.usdValue)
      } : { percent: null, dollar: null },
      ytd: firstOrderDate && firstOrderDate <= startOfYear ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueStartOfYear.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueStartOfYear.usdValue)
      } : { percent: null, dollar: null },
      threeMonth: firstOrderDate && firstOrderDate <= threeMonthsAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueThreeMonthsAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueThreeMonthsAgo.usdValue)
      } : { percent: null, dollar: null },
      year: firstOrderDate && firstOrderDate <= oneYearAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueOneYearAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueOneYearAgo.usdValue)
      } : { percent: null, dollar: null },
      twoYear: firstOrderDate && firstOrderDate <= twoYearsAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueTwoYearsAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueTwoYearsAgo.usdValue)
      } : { percent: null, dollar: null },
      threeYear: firstOrderDate && firstOrderDate <= threeYearsAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueThreeYearsAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueThreeYearsAgo.usdValue)
      } : { percent: null, dollar: null },
      fourYear: firstOrderDate && firstOrderDate <= fourYearsAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueFourYearsAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueFourYearsAgo.usdValue)
      } : { percent: null, dollar: null },
      fiveYear: firstOrderDate && firstOrderDate <= fiveYearsAgo ? {
        percent: calculateCumulativeReturnPercent(valueNow.usdValue, valueFiveYearsAgo.usdValue),
        dollar: calculateReturnDollar(valueNow.usdValue, valueFiveYearsAgo.usdValue)
      } : { percent: null, dollar: null }
    }

    // Initialize compoundGrowth with all null values
    const compoundGrowth = {
      total: null as number | null, 
      oneYear: null as number | null, // Will calculate properly below
      twoYear: null as number | null,
      threeYear: null as number | null,
      fourYear: null as number | null,
      fiveYear: null as number | null,
      sixYear: null as number | null,
      sevenYear: null as number | null,
      eightYear: null as number | null
    };

    // Calculate total CAGR from first transaction to today
    if (portfolioHistory.length > 0 && portfolioHistory[0]) {
      const firstPoint = portfolioHistory[0];
      const yearsSinceFirstTx = calculateYearsBetween(firstPoint.date, today);
      
      if (yearsSinceFirstTx >= 0.5 && firstPoint.usdValue > 0) { // At least 6 months of data
        compoundGrowth.total = calculateCAGR(
          currentValue,
          firstPoint.usdValue,
          yearsSinceFirstTx
        );
      }
    }

    // Function to get initial investment for a period
    const getInitialInvestmentForPeriod = (yearsAgo: number): { value: number, date: Date | null } => {
      // Find the cutoff date for this period
      const cutoffDate = new Date(today)
      cutoffDate.setFullYear(today.getFullYear() - yearsAgo)
      
      // Find the point closest to the cutoff date without going over
      let closestPoint = null;
      let smallestDiff = Infinity;
      
      for (const point of portfolioHistory) {
        if (!point) continue;
        if (point.date > cutoffDate) continue;
        
        const timeDiff = Math.abs(cutoffDate.getTime() - point.date.getTime());
        if (timeDiff < smallestDiff) {
          smallestDiff = timeDiff;
          closestPoint = point;
        }
      }
      
      if (!closestPoint) return { value: 0, date: null };
      
      return { 
        value: closestPoint.usdValue,
        date: closestPoint.date
      };
    };

    // Calculate transaction-based CAGR for user's portfolio
    const calculateTransactionBasedCAGR = async (years: number): Promise<number | null> => {
      const targetDate = new Date(today);
      targetDate.setFullYear(today.getFullYear() - years);
      
      // Check if user has transactions going back that far
      const firstTransactionDate = transactions.length > 0 
        ? new Date(Math.min(...transactions.map(tx => new Date(tx.date).getTime())))
        : today;
      
      if (firstTransactionDate > targetDate) {
        return null;
      }
      
      // Calculate BTC holdings at the target date
      const historicalBTCHoldings = calculateBTCHoldingsAtDate(transactions, targetDate);
      
      if (historicalBTCHoldings === 0) {
        return null; // No holdings at that time
      }
      
      // Get historical BTC price for that date
      const historicalBTCPrice = await getHistoricalBTCPrice(targetDate, supabase);
      
      if (!historicalBTCPrice) {
        return null; // No price data available
      }
      
      // Calculate historical portfolio value
      const historicalPortfolioValue = historicalBTCHoldings * historicalBTCPrice;
      
      // Calculate actual years between the dates
      const actualYears = calculateYearsBetween(targetDate, today);
      
      // Calculate CAGR
      const cagr = calculateCAGR(currentValue, historicalPortfolioValue, actualYears);
      
      return cagr;
    };
    
    // Calculate approximate CAGR for users with less than 1 year of data
    const calculateApproximateUserCAGR = (): number | null => {
      if (transactions.length === 0) return null;
      
      const firstTransactionDate = new Date(Math.min(...transactions.map(tx => new Date(tx.date).getTime())));
      const actualYears = calculateYearsBetween(firstTransactionDate, today);
      
      // Only show approximate CAGR if user has between 3 months and 11 months of data
      if (actualYears < 0.25 || actualYears >= 0.9) return null;
      
      // Calculate the portfolio value at the first transaction date
      const firstTransactionBTC = calculateBTCHoldingsAtDate(transactions, firstTransactionDate);
      if (firstTransactionBTC === 0) return null;
      
      // Use the price from the first transaction as approximation
      const firstTransaction = transactions.find(tx => new Date(tx.date).getTime() === firstTransactionDate.getTime());
      const firstTransactionPrice = firstTransaction?.price;
      
      if (!firstTransactionPrice) return null;
      
      const firstPortfolioValue = firstTransactionBTC * firstTransactionPrice;
      
      return calculateApproximateCAGR(currentValue, firstPortfolioValue, actualYears);
    };

    // Map years to correct period keys
    const yearToPeriodKey = (years: number): keyof typeof compoundGrowth => {
      switch (years) {
        case 1: return 'oneYear';
        case 2: return 'twoYear';
        case 3: return 'threeYear';
        case 4: return 'fourYear';
        case 5: return 'fiveYear';
        case 6: return 'sixYear';
        case 7: return 'sevenYear';
        case 8: return 'eightYear';
        default: return 'oneYear';
      }
    };

    // Calculate CAGR for each period
    const cagrPromises = [1, 2, 3, 4, 5, 6, 7, 8].map(async (years) => {
      const periodKey = yearToPeriodKey(years);
      const cagr = await calculateTransactionBasedCAGR(years);
      return { periodKey, cagr };
    });
    
    const cagrResults = await Promise.all(cagrPromises);
    
    // Apply the results to compoundGrowth
    cagrResults.forEach(({ periodKey, cagr }) => {
      compoundGrowth[periodKey] = cagr;
    });
    
    console.log('✅ CAGR Calculation Complete:', compoundGrowth);
    
    // For users with less than 1 year, show approximate 1-year CAGR
    if (compoundGrowth.oneYear === null) {
      compoundGrowth.oneYear = calculateApproximateUserCAGR();
    }

    // Calculate average, lowest, and highest buy prices from transactions
    const buyTransactions = transactions.filter(transaction => transaction.type === 'buy' && transaction.received_amount && transaction.price);
    
    // Calculate average buy price as total cost basis / total BTC
    const averageBuyPrice = totalInvestment > 0 && currentBtc > 0 
      ? totalInvestment / currentBtc 
      : 0;
    
    // Find lowest and highest buy prices
    let lowestBuyPrice = Infinity;
    let highestBuyPrice = 0;
    
    if (buyTransactions.length > 0) {
      buyTransactions.forEach(transaction => {
        if (transaction.price) {
          lowestBuyPrice = Math.min(lowestBuyPrice, transaction.price);
          highestBuyPrice = Math.max(highestBuyPrice, transaction.price);
        }
      });
    } else {
      lowestBuyPrice = 0;
    }

    // Calculate max drawdown from portfolio history
    let maxDrawdownPercent = 0
    let maxDrawdownFromDate = 'N/A'
    let maxDrawdownToDate = 'N/A'
    let maxDrawdownPortfolioATH = 0
    let maxDrawdownPortfolioLow = Infinity

    // Only calculate if we have at least one transaction
    if (portfolioHistory.length > 0) {
      // First, build a timeline of actual transactions with accurate values 
      const timeline = [...portfolioHistory]
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure chronological order
      
      // Find global maximum portfolio value
      let peakIndex = -1;
      let peakValue = -Infinity;
      
      for (let i = 0; i < timeline.length; i++) {
        const point = timeline[i];
        if (!point) continue;
        
        const value = point.usdValue;
        if (value > peakValue) {
          peakValue = value;
          peakIndex = i;
        }
      }
      
      if (peakIndex >= 0) {
        // Find the lowest subsequent value after this peak
        let troughIndex = -1;
        let troughValue = Infinity;
        
        for (let i = peakIndex + 1; i < timeline.length; i++) {
          const point = timeline[i];
          if (!point) continue;
          
          const value = point.usdValue;
          if (value < troughValue) {
            troughValue = value;
            troughIndex = i;
          }
        }
        
        if (troughIndex > 0 && peakValue > 0) {
          // Calculate drawdown percentage
          const drawdown = ((peakValue - troughValue) / peakValue) * 100;
          
          maxDrawdownPercent = drawdown;
          const peakPoint = timeline[peakIndex];
          const troughPoint = timeline[troughIndex];
          
          if (peakPoint && troughPoint) {
            const peakDateStr = peakPoint.date.toISOString().split('T')[0] || 'N/A';
            const troughDateStr = troughPoint.date.toISOString().split('T')[0] || 'N/A';
            maxDrawdownFromDate = peakDateStr;
            maxDrawdownToDate = troughDateStr;
            maxDrawdownPortfolioATH = peakValue;
            maxDrawdownPortfolioLow = troughValue;
          }
        }
      }
      
      // Also check for drawdowns from intermediate peaks
      timeline.forEach((peak, peakIdx) => {
        if (!peak) return;
        
        for (let i = peakIdx + 1; i < timeline.length; i++) {
          const trough = timeline[i];
          if (!trough) continue;
          
          if (peak.usdValue > 0 && trough.usdValue < peak.usdValue) {
            const drawdown = ((peak.usdValue - trough.usdValue) / peak.usdValue) * 100;
            
            if (drawdown > maxDrawdownPercent) {
              maxDrawdownPercent = drawdown;
              const peakDate = peak.date?.toISOString().split('T')[0] || 'N/A';
              const troughDate = trough.date?.toISOString().split('T')[0] || 'N/A';
              maxDrawdownFromDate = peakDate;
              maxDrawdownToDate = troughDate;
              maxDrawdownPortfolioATH = peak.usdValue;
              maxDrawdownPortfolioLow = trough.usdValue;
            }
          }
        }
      });
    }

    return {
      cumulative,
      compoundGrowth,
      allTimeHigh: { price: marketAthPrice, date: marketAthDate },
      maxDrawdown: {
        percent: maxDrawdownPercent,
        fromDate: maxDrawdownFromDate,
        toDate: maxDrawdownToDate,
        portfolioATH: maxDrawdownPortfolioATH,
        portfolioLow: maxDrawdownPortfolioLow
      },
      hodlTime: calculateWeightedHodlTime(transactions, today),
      currentPrice,
      averageBuyPrice,
      lowestBuyPrice: lowestBuyPrice === Infinity ? 0 : lowestBuyPrice,
      highestBuyPrice
    }
  } catch (error) {
    console.error('Error calculating performance metrics:', error)
    // Return a default/error state
    return {
      cumulative: {
        total: { percent: 0, dollar: 0 }, day: { percent: 0, dollar: 0 }, week: { percent: 0, dollar: 0 },
        month: { percent: null, dollar: null }, ytd: { percent: null, dollar: null }, threeMonth: { percent: null, dollar: null },
        year: { percent: null, dollar: null }, twoYear: { percent: null, dollar: null }, threeYear: { percent: null, dollar: null },
        fourYear: { percent: null, dollar: null }, fiveYear: { percent: null, dollar: null }
      },
      compoundGrowth: {
        total: null, oneYear: null, twoYear: null, threeYear: null,
        fourYear: null, fiveYear: null, sixYear: null, sevenYear: null, eightYear: null
      },
      allTimeHigh: { price: 0, date: 'N/A' },
      maxDrawdown: {
        percent: 0,
        fromDate: 'N/A',
        toDate: 'N/A',
        portfolioATH: 0,
        portfolioLow: 0
      },
      hodlTime: 0,
      currentPrice: 0,
      averageBuyPrice: 0,
      lowestBuyPrice: 0,
      highestBuyPrice: 0
    }
  }
}
