import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { calculatePortfolioMetrics, PortfolioMetrics } from './calculations'

interface Transaction {
  id: string
  date: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  received_amount: number | null
  sent_amount: number | null
  buy_amount: number | null
  sell_amount: number | null
  price: number
  network_fee: number | null
  service_fee: number | null
  received_currency: string
  sell_currency: string
  buy_currency: string
}

interface ExtendedPortfolioMetrics extends PortfolioMetrics {
  shortTermHoldings: number
  longTermHoldings: number
  sendReceiveMetrics: {
    totalSent: number
    totalReceived: number
    netTransfers: number
  }
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
}

interface CostBasisMethodResult {
  totalCostBasis: number
  averageCost: number
  unrealizedGain: number
  unrealizedGainPercent: number
  potentialTaxLiabilityST: number
  potentialTaxLiabilityLT: number
  realizedGains: number
  remainingBtc: number
}

interface BTCHolding {
  date: string
  amount: number
  costBasis: number
  pricePerCoin: number
}

export interface PerformanceMetrics {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  compoundGrowth: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
  allTimeHigh: {
    price: number
    date: string
  }
  maxDrawdown: {
    percent: number
    fromDate: string
    toDate: string
    portfolioATH: number
    portfolioLow: number
  }
  hodlTime: number
  currentPrice?: number
  averageBuyPrice?: number
  lowestBuyPrice?: number
  highestBuyPrice?: number
}

// Remove standalone client initialization
// Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

function calculateShortTermHoldings(orders: any[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let shortTermHoldings = 0
  
  orders.forEach(order => {
    const txDate = new Date(order.date)
    const isShortTerm = txDate > oneYearAgo

    if (order.type === 'buy' && order.received_btc_amount) {
      if (isShortTerm) {
        shortTermHoldings += order.received_btc_amount
      }
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      const amount = order.sell_btc_amount
      // Deduct sells proportionally from short term holdings
      const totalHoldings = shortTermHoldings
      if (totalHoldings > 0) {
        shortTermHoldings -= amount * (shortTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, shortTermHoldings)
}

function calculateLongTermHoldings(orders: any[]): number {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  let longTermHoldings = 0
  
  orders.forEach(order => {
    const txDate = new Date(order.date)
    const isLongTerm = txDate <= oneYearAgo

    if (order.type === 'buy' && order.received_btc_amount) {
      if (isLongTerm) {
        longTermHoldings += order.received_btc_amount
      }
    } else if (order.type === 'sell' && order.sell_btc_amount) {
      const amount = order.sell_btc_amount
      // Deduct sells proportionally from long term holdings
      const totalHoldings = longTermHoldings
      if (totalHoldings > 0) {
        longTermHoldings -= amount * (longTermHoldings / totalHoldings)
      }
    }
  })

  return Math.max(0, longTermHoldings)
}

export async function getPortfolioMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<ExtendedPortfolioMetrics> {
  try {
    // Get all transactions from orders and transfers tables AND price
    const [ordersResult, transfersResult, priceResult] = await Promise.all([
      supabase
        .from('orders')
        // Fetch necessary columns for both core metrics and cost basis calculation
        .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price') 
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('transfers')
        .select('*') // Keep '*' for transfers for now
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('spot_price')
        .select('price_usd, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
    ])

    if (ordersResult.error) throw ordersResult.error
    if (transfersResult.error) throw transfersResult.error
    if (priceResult.error) throw priceResult.error

    const orders = ordersResult.data || []
    const transfers = transfersResult.data || []
    
    if (!priceResult.data) throw new Error('No Bitcoin price available')
    const currentPrice = priceResult.data.price_usd

    // Calculate core metrics using only buy/sell orders
    const coreMetrics = calculatePortfolioMetrics(orders, currentPrice)

    // Calculate tax liability using Average Cost method for the overview
    // Need to await the result as calculateCostBasis is async
    const avgCostBasisResult = await calculateCostBasis(userId, 'Average Cost', orders, currentPrice);
    const potentialTaxLiabilityST = avgCostBasisResult.potentialTaxLiabilityST;
    const potentialTaxLiabilityLT = avgCostBasisResult.potentialTaxLiabilityLT;

    // Calculate transfer metrics
    const totalSent = transfers
      .filter(t => t.type === 'withdrawal')
      .reduce((total, t) => total + (t.amount_btc || 0), 0)
    
    const totalReceived = transfers
      .filter(t => t.type === 'deposit')
      .reduce((total, t) => total + (t.amount_btc || 0), 0)

    const netTransfers = totalReceived - totalSent

    return {
      ...coreMetrics,
      shortTermHoldings: calculateShortTermHoldings(orders),
      longTermHoldings: calculateLongTermHoldings(orders),
      sendReceiveMetrics: {
        totalSent,
        totalReceived,
        netTransfers
      },
      potentialTaxLiabilityST,
      potentialTaxLiabilityLT
    }
  } catch (error) {
    console.error('Error in getPortfolioMetrics:', error)
    // Return a default structure in case of error, matching the extended interface
    return { 
      totalBtc: 0,
      totalCostBasis: 0,
      totalFees: 0,
      currentValue: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      averageBuyPrice: 0,
      totalTransactions: 0,
      shortTermHoldings: 0,
      longTermHoldings: 0,
      sendReceiveMetrics: { totalSent: 0, totalReceived: 0, netTransfers: 0 },
      potentialTaxLiabilityST: 0,
      potentialTaxLiabilityLT: 0
    }; 
    // Alternatively re-throw: throw error;
  }
}

export async function calculateCostBasis(
  userId: string,
  method: 'FIFO' | 'LIFO' | 'Average Cost',
  orders: any[],
  currentPrice: number
): Promise<CostBasisMethodResult> {
  try {
    // Validate inputs
    if (!userId) throw new Error('User ID is required')
    if (!method) throw new Error('Cost basis method is required')
    if (!Array.isArray(orders)) throw new Error('Orders data must be an array')
    if (typeof currentPrice !== 'number' || isNaN(currentPrice)) throw new Error('Valid current price is required')

    // Calculate running balance and totals from the provided orders
    let runningBalance = 0
    let totalBtcBought = 0
    let totalSold = 0
    let totalShortTermBtcBought = 0
    let totalLongTermBtcBought = 0
    const oneYearAgoForProportion = new Date()
    oneYearAgoForProportion.setFullYear(oneYearAgoForProportion.getFullYear() - 1)

    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount) {
        const amount = order.received_btc_amount
        totalBtcBought += amount
        runningBalance += amount
        const acquisitionDate = new Date(order.date)
        if (acquisitionDate > oneYearAgoForProportion) {
          totalShortTermBtcBought += amount
        } else {
          totalLongTermBtcBought += amount
        }
      } else if (order.type === 'sell' && order.sell_btc_amount) {
        totalSold += order.sell_btc_amount
        runningBalance -= order.sell_btc_amount
      }
    })

    const remainingBtc = Math.max(0, runningBalance)

    // Shared Tax Rates (Consider making these configurable or constants)
    const shortTermTaxRate = 0.37 // Updated placeholder ST rate
    const longTermTaxRate = 0.20  // Updated placeholder LT rate

    // --- Average Cost Method --- 
    if (method === 'Average Cost') {
      let totalUsdSpent = 0
      let totalUsdReceived = 0

      orders.forEach(order => {
        if (order.type === 'buy') {
          if (order.buy_fiat_amount) {
            totalUsdSpent += order.buy_fiat_amount
          }
          // Ensure service_fee and currency are checked correctly
          if (order.service_fee && order.service_fee_currency === 'USD') {
            totalUsdSpent += order.service_fee
          }
        } else if (order.type === 'sell') {
          if (order.received_fiat_amount) {
            totalUsdReceived += order.received_fiat_amount
          }
        }
      })

      const averageCost = totalBtcBought > 0 ? totalUsdSpent / totalBtcBought : 0 
      const currentValue = remainingBtc * currentPrice
      const costBasisOfRemaining = remainingBtc * averageCost
      const realizedGains = totalUsdReceived - (totalSold * averageCost) // Gain/loss from sales
      const unrealizedGain = currentValue - costBasisOfRemaining // Gain/loss on remaining holdings
      const unrealizedGainPercent = costBasisOfRemaining > 0 
        ? (unrealizedGain / costBasisOfRemaining) * 100 
        : 0

      // Calculate potential tax liability using proportions
      let potentialTaxLiabilityST = 0
      let potentialTaxLiabilityLT = 0
      if (unrealizedGain > 0 && totalBtcBought > 0) {
        const shortTermProportion = totalBtcBought > 0 ? totalShortTermBtcBought / totalBtcBought : 0
        const longTermProportion = totalBtcBought > 0 ? totalLongTermBtcBought / totalBtcBought : 0
        potentialTaxLiabilityST = unrealizedGain * shortTermProportion * shortTermTaxRate
        potentialTaxLiabilityLT = unrealizedGain * longTermProportion * longTermTaxRate
      }

      return {
        totalCostBasis: costBasisOfRemaining, // Cost basis of *remaining* BTC
        averageCost, // Average cost of *all* bought BTC
        unrealizedGain,
        unrealizedGainPercent,
        potentialTaxLiabilityST,
        potentialTaxLiabilityLT,
        realizedGains,
        remainingBtc
      }
    }

    // --- FIFO and LIFO Methods --- 
    let btcHoldings: BTCHolding[] = []
    let realizedGains = 0

    // Populate holdings only from buy orders
    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount && order.buy_fiat_amount && order.price != null) { // Ensure price exists
        // Calculate cost basis per buy, including fees
        const fee = (order.service_fee && order.service_fee_currency === 'USD') ? order.service_fee : 0
        const costBasisPerBuy = order.buy_fiat_amount + fee

        btcHoldings.push({
          date: order.date,
          amount: order.received_btc_amount,
          costBasis: costBasisPerBuy,
          pricePerCoin: order.price // Store price per coin at purchase
        })
      }
    })

    // Clone and sort holdings based on method for processing sells
    let holdingsToProcess = [...btcHoldings] // Work on a copy
    holdingsToProcess.sort((a, b) => 
      method === 'FIFO' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Process only sell transactions against the sorted holdings
    orders.forEach(order => {
      if (order.type === 'sell' && order.sell_btc_amount && order.received_fiat_amount) {
        let remainingSellAmount = order.sell_btc_amount
        // Calculate sell price safely
        const sellPrice = order.sell_btc_amount > 0 
            ? order.received_fiat_amount / order.sell_btc_amount
            : 0

        while (remainingSellAmount > 0 && holdingsToProcess.length > 0) {
          const holding = method === 'FIFO' ? holdingsToProcess[0] : holdingsToProcess[holdingsToProcess.length - 1] // Get first for FIFO, last for LIFO
          if (!holding) break // Should not happen if length > 0

          const sellAmountFromHolding = Math.min(remainingSellAmount, holding.amount)
          
          // Calculate gain/loss for this portion
          const costBasisForPortion = holding.costBasis * (sellAmountFromHolding / holding.amount) // Proportional cost basis
          const proceedsForPortion = sellAmountFromHolding * sellPrice
          realizedGains += proceedsForPortion - costBasisForPortion

          // Update or remove the holding
          holding.amount -= sellAmountFromHolding
          holding.costBasis -= costBasisForPortion

          if (holding.amount <= 1e-9) { // Use tolerance for floating point comparison
            if (method === 'FIFO') {
              holdingsToProcess.shift() // Remove from beginning
            } else {
              holdingsToProcess.pop() // Remove from end
            }
          }

          remainingSellAmount -= sellAmountFromHolding
        }
      }
    })

    // --- Calculate final metrics for FIFO/LIFO based on remaining holdings --- 
    const remainingHoldings = holdingsToProcess
    const totalCostBasis = remainingHoldings.reduce((sum, h) => sum + h.costBasis, 0)
    const averageCost = remainingBtc > 0 ? totalCostBasis / remainingBtc : 0 // Avg cost of *remaining* holdings
    const currentValue = remainingBtc * currentPrice
    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 
        ? (unrealizedGain / totalCostBasis) * 100 
        : 0
    
    // Calculate potential tax liability based on remaining holdings
    let potentialTaxLiabilityST = 0
    let potentialTaxLiabilityLT = 0
    const oneYearAgoForTax = new Date()
    oneYearAgoForTax.setFullYear(oneYearAgoForTax.getFullYear() - 1)

    remainingHoldings.forEach(holding => {
      const holdingValue = holding.amount * currentPrice
      const holdingUnrealizedGain = holdingValue - holding.costBasis
      
      if (holdingUnrealizedGain > 0) {
        const acquisitionDate = new Date(holding.date)
        const isLongTerm = acquisitionDate <= oneYearAgoForTax
        if (isLongTerm) {
          potentialTaxLiabilityLT += holdingUnrealizedGain * longTermTaxRate
        } else {
          potentialTaxLiabilityST += holdingUnrealizedGain * shortTermTaxRate
        }
      }
    })

    return {
      totalCostBasis, // Total cost basis of *remaining* holdings
      averageCost,    // Average cost of *remaining* holdings
      realizedGains, // Calculated from sells
      unrealizedGain,
      unrealizedGainPercent,
      potentialTaxLiabilityST,
      potentialTaxLiabilityLT,
      remainingBtc
    }
  } catch (error) {
    console.error(`Error calculating ${method} cost basis:`, error)
    // Return a default error state or re-throw
    // Depending on how you want to handle errors upstream
    return {
      totalCostBasis: 0,
      averageCost: 0,
      realizedGains: 0,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      potentialTaxLiabilityST: 0,
      potentialTaxLiabilityLT: 0,
      remainingBtc: 0
    } // Or throw error
  }
}

function calculateWeightedHodlTime(orders: any[], currentDate: Date): number {
  let totalBTC = 0
  let weightedDaysSum = 0

  // Process only buy orders
  orders
    .filter(order => order.type === 'buy' && order.received_btc_amount)
    .forEach(order => {
      const purchaseDate = new Date(order.date)
      const daysHeld = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      const amount = order.received_btc_amount

      totalBTC += amount
      weightedDaysSum += amount * daysHeld
    })

  return totalBTC > 0 ? Math.round(weightedDaysSum / totalBTC) : 0
}

export async function getPerformanceMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<PerformanceMetrics> {
  try {
    // Fetch all necessary data in parallel
    const [ordersResult, priceResult, athResult] = await Promise.all([
      supabase
        .from('orders')
        .select('date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price') // Select specific columns
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

    if (ordersResult.error) throw ordersResult.error
    if (priceResult.error) throw priceResult.error
    if (athResult.error && athResult.error.code !== 'PGRST116') { // Ignore 'Not found' for ATH
      throw athResult.error
    }

    const orders = ordersResult.data || []
    if (!priceResult.data) throw new Error('No Bitcoin price data available')
    const currentPrice = priceResult.data.price_usd
    const lastUpdated = priceResult.data.updated_at
    const marketAthPrice = athResult.data?.price_usd ?? 0
    const marketAthDate = athResult.data?.ath_date ?? 'N/A'

    if (orders.length === 0) {
      // Handle case with no orders gracefully
      return {
        cumulative: {
          total: { percent: 0, dollar: 0 },
          day: { percent: 0, dollar: 0 },
          week: { percent: 0, dollar: 0 },
          month: { percent: null, dollar: null },
          ytd: { percent: null, dollar: null },
          threeMonth: { percent: null, dollar: null },
          year: { percent: null, dollar: null },
          threeYear: { percent: null, dollar: null },
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

    // Calculate historical portfolio value and investment
    orders.forEach(order => {
      const orderDate = new Date(order.date)
      let btcChange = 0
      let investmentChange = 0

      if (order.type === 'buy' && order.received_btc_amount) {
        btcChange = order.received_btc_amount
        // Investment includes buy amount + USD service fee
        const fee = (order.service_fee && order.service_fee_currency === 'USD') ? order.service_fee : 0
        investmentChange = (order.buy_fiat_amount || 0) + fee
      } else if (order.type === 'sell' && order.sell_btc_amount) {
        btcChange = -order.sell_btc_amount
        // Sells reduce BTC but don't change the *initial* investment amount directly
        // Realized gains handle the profit/loss aspect
      }

      currentBtc += btcChange
      currentInvestment += investmentChange
      
      // Use the price at the time of the transaction for historical value
      const valueAtTx = currentBtc * (order.price || 0)

      portfolioHistory.push({
        date: orderDate,
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
    try {
      console.log("Adding additional monthly data points for more accurate drawdown...");
      
      if (portfolioHistory.length >= 2) {
        const additionalPoints = [];
        // Get all months between first and last transaction
        const firstDate = new Date(portfolioHistory[0].date);
        const lastDate = new Date();
        
        // Create a sorted copy so we can reliably find transactions by date
        const sortedHistory = [...portfolioHistory].sort((a, b) => 
          a.date.getTime() - b.date.getTime()
        );
        
        // Iterate through each month
        let currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 1);
        
        while (currentMonth < lastDate) {
          // Check if we already have a point for this month
          const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
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
            // In a future improvement, we would fetch historical price data for each month
            additionalPoints.push({
              date: new Date(currentMonth),
              btc: prevPoint.btc,
              usdValue: prevPoint.btc * currentPrice, // Use current price - would be better with historical price
              investment: prevPoint.investment
            });
          }
          
          // Move to next month
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
        
        // Add all the new points
        if (additionalPoints.length > 0) {
          console.log(`Adding ${additionalPoints.length} monthly data points`);
          portfolioHistory.push(...additionalPoints);
          
          // Sort the entire portfolio history chronologically after adding points
          portfolioHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
        }
      }
      
      // Now improve historical valuation by using real price data instead of just transaction prices
      // This is critical for accurate drawdown calculation
      if (portfolioHistory.length > 0) {
        console.log("Enhancing portfolio history with accurate price data...");
        
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
            console.log(`Fixed invalid portfolio value of ${point.usdValue} for ${point.date.toISOString().split('T')[0]} with BTC=${point.btc}`);
            point.usdValue = point.btc * currentPrice; // Fallback to current price
          }
        });
      }
    } catch (error) {
      console.error("Error adding monthly data points:", error);
    }

    // Helper to find portfolio state at a specific date
    const getValueAtDate = (targetDate: Date): { btc: number; usdValue: number; investment: number } => {
      let closestPastState = portfolioHistory[0] // Start with the first transaction state
      for (const entry of portfolioHistory) {
        if (entry.date <= targetDate) {
          closestPastState = entry
        } else {
          // Since history is sorted, we found the last state before or on the target date
          break
        }
      }
      // Adjust the USD value using the *current* price for comparison periods
      // except for the total calculation which should use the final actual value
      return {
        btc: closestPastState.btc,
        // Use current price to value holdings at the *end* of the period for comparison
        usdValue: closestPastState.btc * currentPrice, 
        investment: closestPastState.investment
      }
    }

    // Calculate performance over different periods
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const threeMonthsAgo = new Date(today)
    threeMonthsAgo.setMonth(today.getMonth() - 3)
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    const threeYearsAgo = new Date(today)
    threeYearsAgo.setFullYear(today.getFullYear() - 3)
    const fiveYearsAgo = new Date(today)
    fiveYearsAgo.setFullYear(today.getFullYear() - 5)

    const valueNow = { usdValue: currentValue, investment: currentInvestment }
    const valueYesterday = getValueAtDate(yesterday)
    const valueLastWeek = getValueAtDate(lastWeek)
    const valueLastMonth = getValueAtDate(lastMonth)
    const valueStartOfYear = getValueAtDate(startOfYear)
    const valueThreeMonthsAgo = getValueAtDate(threeMonthsAgo)
    const valueOneYearAgo = getValueAtDate(oneYearAgo)
    const valueThreeYearsAgo = getValueAtDate(threeYearsAgo)
    const valueFiveYearsAgo = getValueAtDate(fiveYearsAgo)

    // Helper for percentage calculation (Gain / Investment)
    const calculateReturnPercent = (endValue: number, startValue: number, startInvestment: number) => {
      // Use startInvestment as the denominator for ROI calculation
      return startInvestment > 0 ? ((endValue - startValue) / startInvestment) * 100 : 0
    }
    // Helper for dollar calculation (End Value - Start Value)
    const calculateReturnDollar = (endValue: number, startValue: number) => {
      return endValue - startValue
    }

    const firstOrderDate = portfolioHistory[0]?.date
    const totalInvestment = currentInvestment

    // Cumulative Returns
    const cumulative = {
      total: {
        percent: totalInvestment > 0 ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0,
        dollar: currentValue - totalInvestment
      },
      day: {
        percent: calculateReturnPercent(valueNow.usdValue, valueYesterday.usdValue, valueYesterday.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueYesterday.usdValue)
      },
      week: {
        percent: calculateReturnPercent(valueNow.usdValue, valueLastWeek.usdValue, valueLastWeek.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueLastWeek.usdValue)
      },
      month: firstOrderDate && firstOrderDate <= lastMonth ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueLastMonth.usdValue, valueLastMonth.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueLastMonth.usdValue)
      } : { percent: null, dollar: null },
      ytd: firstOrderDate && firstOrderDate <= startOfYear ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueStartOfYear.usdValue, valueStartOfYear.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueStartOfYear.usdValue)
      } : { percent: null, dollar: null },
      threeMonth: firstOrderDate && firstOrderDate <= threeMonthsAgo ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueThreeMonthsAgo.usdValue, valueThreeMonthsAgo.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueThreeMonthsAgo.usdValue)
      } : { percent: null, dollar: null },
      year: firstOrderDate && firstOrderDate <= oneYearAgo ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueOneYearAgo.usdValue, valueOneYearAgo.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueOneYearAgo.usdValue)
      } : { percent: null, dollar: null },
      threeYear: firstOrderDate && firstOrderDate <= threeYearsAgo ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueThreeYearsAgo.usdValue, valueThreeYearsAgo.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueThreeYearsAgo.usdValue)
      } : { percent: null, dollar: null },
      fiveYear: firstOrderDate && firstOrderDate <= fiveYearsAgo ? {
        percent: calculateReturnPercent(valueNow.usdValue, valueFiveYearsAgo.usdValue, valueFiveYearsAgo.investment),
        dollar: calculateReturnDollar(valueNow.usdValue, valueFiveYearsAgo.usdValue)
      } : { percent: null, dollar: null }
    }

    // Compound Growth Rate calculation (previously Annualized Returns)
    const calculateAnnualizedReturn = (endValue: number, startValue: number, years: number) => {
      if (startValue <= 0 || years <= 0) return null
      // Using standard CAGR formula: (End Value / Start Value)^(1/Years) - 1
      return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
    }

    // For compound growth rate, we want to compare current value with initial investment over the period
    // rather than just the portfolio value at fixed dates
    const getInitialInvestmentForPeriod = (yearsAgo: number): { value: number, date: Date | null } => {
      // Find the cutoff date for this period
      const cutoffDate = new Date(today)
      cutoffDate.setFullYear(today.getFullYear() - yearsAgo)
      
      // We need to find the portfolio value closest to but not after the cutoff date
      // This represents what the portfolio was worth at the beginning of the period
      let closestPoint = null;
      let smallestDiff = Infinity;
      
      // Find the point closest to the cutoff date without going over
      for (const point of portfolioHistory) {
        if (!point) continue; // Skip undefined points
        
        // Skip points that are after the cutoff
        if (point.date > cutoffDate) continue;
        
        const timeDiff = Math.abs(cutoffDate.getTime() - point.date.getTime());
        if (timeDiff < smallestDiff) {
          smallestDiff = timeDiff;
          closestPoint = point;
        }
      }
      
      // For debugging
      if (closestPoint) {
        console.log(`For ${yearsAgo}-year period, found starting point: ${closestPoint.date.toISOString().split('T')[0]}, value: ${closestPoint.usdValue.toFixed(2)}`);
      } else {
        console.log(`No valid starting point found for ${yearsAgo}-year period`);
      }
      
      // If no valid point found, return null
      if (!closestPoint) return { value: 0, date: null };
      
      return { 
        value: closestPoint.usdValue,
        date: closestPoint.date
      };
    };

    // Calculate real years between dates (more precise than using integers)
    const calculateYearsBetween = (startDate: Date | null | undefined, endDate: Date): number => {
      if (!startDate) return 0; // Return 0 if we don't have a valid start date
      
      const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;  // Account for leap years
      const years = (endDate.getTime() - startDate.getTime()) / millisecondsPerYear;
      
      return Math.max(0.01, years); // Ensure we don't return negative or extremely small values
    };

    // Initialize compoundGrowth with all null values
    const compoundGrowth = {
      total: null as number | null, 
      oneYear: cumulative.year.percent, // 1-year cumulative is the same as annualized
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
        compoundGrowth.total = calculateAnnualizedReturn(
          currentValue,
          firstPoint.usdValue,
          yearsSinceFirstTx
        );
      }
    }

    // Calculate each period's CAGR using the precise timeframe
    ;[2, 3, 4, 5, 6, 7, 8].forEach(years => {
      const periodKey = `${years}Year` as keyof typeof compoundGrowth;
      const initialInvestment = getInitialInvestmentForPeriod(years);
      
      if (initialInvestment.date && initialInvestment.value > 0) {
        const actualYears = calculateYearsBetween(initialInvestment.date, today);
        if (actualYears >= 0.9) { // Require at least ~11 months of data
          compoundGrowth[periodKey] = calculateAnnualizedReturn(
            currentValue,
            initialInvestment.value,
            actualYears
          );
        }
      }
    });

    // Calculate average, lowest, and highest buy prices from orders
    const buyOrders = orders.filter(order => order.type === 'buy' && order.received_btc_amount && order.price);
    
    // Calculate average buy price as total cost basis / total BTC
    const averageBuyPrice = totalInvestment > 0 && currentBtc > 0 
      ? totalInvestment / currentBtc 
      : 0;
    
    // Find lowest and highest buy prices
    let lowestBuyPrice = Infinity;
    let highestBuyPrice = 0;
    
    if (buyOrders.length > 0) {
      buyOrders.forEach(order => {
        if (order.price) {
          lowestBuyPrice = Math.min(lowestBuyPrice, order.price);
          highestBuyPrice = Math.max(highestBuyPrice, order.price);
        }
      });
    } else {
      lowestBuyPrice = 0;
    }

    // Calculate max drawdown using a more reliable historical approach
    let maxDrawdownPercent = 0
    let maxDrawdownFromDate = ''
    let maxDrawdownToDate = ''
    let maxDrawdownPortfolioATH = 0
    let maxDrawdownPortfolioLow = Infinity

    try {
      // Only calculate if we have at least one transaction
      if (portfolioHistory.length > 0) {
        console.log(`Calculating max drawdown with ${portfolioHistory.length} data points...`);
        
        // First, build a timeline of actual transactions with accurate values 
        let timeline = [...portfolioHistory]
          .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ensure chronological order
        
        // DEBUG: Print out portfolio history to see what we're working with
        console.log("Portfolio history timeline:");
        timeline.forEach((point, index) => {
          console.log(`[${index}] ${point.date.toISOString().split('T')[0]} - BTC: ${point.btc.toFixed(8)}, USD: ${point.usdValue.toFixed(2)}, Investment: ${point.investment.toFixed(2)}`);
        });
        
        // In case we have few data points, log them individually
        if (timeline.length <= 10) {
          console.log("Details of all portfolio history points:");
          console.log(JSON.stringify(timeline, null, 2));
        }
        
        // Find global maximum portfolio value
        let peakIndex = -1;
        let peakValue = -Infinity;
        
        for (let i = 0; i < timeline.length; i++) {
          const value = timeline[i].usdValue;
          if (value > peakValue) {
            peakValue = value;
            peakIndex = i;
          }
        }
        
        console.log(`Found peak value at index ${peakIndex}: ${peakValue.toFixed(2)} USD on ${timeline[peakIndex]?.date.toISOString().split('T')[0]}`);
        
        if (peakIndex >= 0) {
          // Find the lowest subsequent value after this peak
          let troughIndex = -1;
          let troughValue = Infinity;
          
          for (let i = peakIndex + 1; i < timeline.length; i++) {
            const value = timeline[i].usdValue;
            if (value < troughValue) {
              troughValue = value;
              troughIndex = i;
            }
          }
          
          console.log(`Found trough after peak at index ${troughIndex}: ${troughValue?.toFixed(2)} USD on ${timeline[troughIndex]?.date.toISOString().split('T')[0]}`);
          
          if (troughIndex > 0 && peakValue > 0) {
            // Calculate drawdown percentage
            const drawdown = ((peakValue - troughValue) / peakValue) * 100;
            
            console.log(`Main drawdown calculation: ${drawdown.toFixed(2)}% (${peakValue.toFixed(2)} → ${troughValue.toFixed(2)})`);
            
            maxDrawdownPercent = drawdown;
            maxDrawdownFromDate = timeline[peakIndex].date.toISOString().split('T')[0];
            maxDrawdownToDate = timeline[troughIndex].date.toISOString().split('T')[0];
            maxDrawdownPortfolioATH = peakValue;
            maxDrawdownPortfolioLow = troughValue;
            
            console.log(`Max drawdown set to: ${drawdown.toFixed(2)}% from ${maxDrawdownFromDate} to ${maxDrawdownToDate}`);
          } else {
            console.log(`No valid trough found after peak at index ${peakIndex}`);
          }
        } else {
          console.log("No valid peak found in portfolio history");
        }
        
        // Also check for potential drawdowns from intermediate peaks
        console.log("Checking for drawdowns from intermediate peaks:");
        
        timeline.forEach((peak, peakIdx) => {
          for (let i = peakIdx + 1; i < timeline.length; i++) {
            const trough = timeline[i];
            
            if (peak.usdValue > 0 && trough.usdValue < peak.usdValue) {
              const drawdown = ((peak.usdValue - trough.usdValue) / peak.usdValue) * 100;
              
              if (drawdown > 10) { // Log all significant drawdowns over 10%
                console.log(`Potential drawdown: ${drawdown.toFixed(2)}% from ${peak.date.toISOString().split('T')[0]} (${peak.usdValue.toFixed(2)}) to ${trough.date.toISOString().split('T')[0]} (${trough.usdValue.toFixed(2)})`);
              }
              
              if (drawdown > maxDrawdownPercent) {
                maxDrawdownPercent = drawdown;
                maxDrawdownFromDate = peak.date.toISOString().split('T')[0];
                maxDrawdownToDate = trough.date.toISOString().split('T')[0]; 
                maxDrawdownPortfolioATH = peak.usdValue;
                maxDrawdownPortfolioLow = trough.usdValue;
                
                console.log(`NEW MAX DRAWDOWN: ${drawdown.toFixed(2)}% from ${maxDrawdownFromDate} to ${maxDrawdownToDate}`);
                console.log(`Portfolio value dropped from ${peak.usdValue.toFixed(2)} to ${trough.usdValue.toFixed(2)}`);
              }
            }
          }
        });
        
        console.log(`FINAL MAX DRAWDOWN: ${maxDrawdownPercent.toFixed(2)}% from ${maxDrawdownFromDate} to ${maxDrawdownToDate}`);
        console.log(`Portfolio ATH: ${maxDrawdownPortfolioATH.toFixed(2)}, Portfolio Low: ${maxDrawdownPortfolioLow.toFixed(2)}`);
      } else {
        console.log("No portfolio history points available for drawdown calculation");
      }
    } catch (error) {
      console.error('Error calculating max drawdown:', error);
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
      hodlTime: calculateWeightedHodlTime(orders, today),
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
        year: { percent: null, dollar: null }, threeYear: { percent: null, dollar: null }, fiveYear: { percent: null, dollar: null }
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