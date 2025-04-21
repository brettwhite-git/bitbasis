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
  annualized: {
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
  hodlTime: number
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
        .from('bitcoin_prices')
        .select('price_usd')
        .order('last_updated', { ascending: false })
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
    const shortTermTaxRate = 0.15
    const longTermTaxRate = 0.30

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
        .from('bitcoin_prices')
        .select('price_usd, last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single(),
      supabase // Fetch ATH price
        .from('bitcoin_prices')
        .select('ath_price, ath_date')
        .not('ath_price', 'is', null)
        .order('ath_price', { ascending: false })
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
    const lastUpdated = priceResult.data.last_updated
    const marketAthPrice = athResult.data?.ath_price ?? 0
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
        annualized: {
          total: null, oneYear: null, twoYear: null, threeYear: null,
          fourYear: null, fiveYear: null, sixYear: null, sevenYear: null, eightYear: null
        },
        allTimeHigh: { price: marketAthPrice, date: marketAthDate },
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

    // Annualized Returns
    const calculateAnnualizedReturn = (endValue: number, startValue: number, years: number) => {
      if (startValue <= 0 || years <= 0) return null
      // Using simple CAGR formula: (End Value / Start Value)^(1/Years) - 1
      return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
    }

    const annualized = {
      total: null, // Requires start date/value if defined differently
      oneYear: cumulative.year.percent, // 1-year cumulative is the same as annualized
      twoYear: firstOrderDate && firstOrderDate <= new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()) ? calculateAnnualizedReturn(valueNow.usdValue, getValueAtDate(new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())).usdValue, 2) : null,
      threeYear: firstOrderDate && firstOrderDate <= threeYearsAgo ? calculateAnnualizedReturn(valueNow.usdValue, valueThreeYearsAgo.usdValue, 3) : null,
      fourYear: firstOrderDate && firstOrderDate <= new Date(today.getFullYear() - 4, today.getMonth(), today.getDate()) ? calculateAnnualizedReturn(valueNow.usdValue, getValueAtDate(new Date(today.getFullYear() - 4, today.getMonth(), today.getDate())).usdValue, 4) : null,
      fiveYear: firstOrderDate && firstOrderDate <= fiveYearsAgo ? calculateAnnualizedReturn(valueNow.usdValue, valueFiveYearsAgo.usdValue, 5) : null,
      sixYear: firstOrderDate && firstOrderDate <= new Date(today.getFullYear() - 6, today.getMonth(), today.getDate()) ? calculateAnnualizedReturn(valueNow.usdValue, getValueAtDate(new Date(today.getFullYear() - 6, today.getMonth(), today.getDate())).usdValue, 6) : null,
      sevenYear: firstOrderDate && firstOrderDate <= new Date(today.getFullYear() - 7, today.getMonth(), today.getDate()) ? calculateAnnualizedReturn(valueNow.usdValue, getValueAtDate(new Date(today.getFullYear() - 7, today.getMonth(), today.getDate())).usdValue, 7) : null,
      eightYear: firstOrderDate && firstOrderDate <= new Date(today.getFullYear() - 8, today.getMonth(), today.getDate()) ? calculateAnnualizedReturn(valueNow.usdValue, getValueAtDate(new Date(today.getFullYear() - 8, today.getMonth(), today.getDate())).usdValue, 8) : null
    }

    return {
      cumulative,
      annualized,
      allTimeHigh: { price: marketAthPrice, date: marketAthDate },
      hodlTime: calculateWeightedHodlTime(orders, today)
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
      annualized: {
        total: null, oneYear: null, twoYear: null, threeYear: null,
        fourYear: null, fiveYear: null, sixYear: null, sevenYear: null, eightYear: null
      },
      allTimeHigh: { price: 0, date: 'N/A' },
      hodlTime: 0
    }
  }
} 