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

interface PerformanceMetrics {
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
}

// Remove standalone client initialization
// Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

export async function getPortfolioMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<ExtendedPortfolioMetrics> {
  try {
    // Get all transactions from different tables
    const [ordersResult, sendsResult, receivesResult, priceResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('send')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('receive')
        .select('*')
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
    if (sendsResult.error) throw sendsResult.error
    if (receivesResult.error) throw receivesResult.error
    if (priceResult.error) throw priceResult.error

    const orders = ordersResult.data || []
    const sends = sendsResult.data || []
    const receives = receivesResult.data || []
    
    if (!priceResult.data) throw new Error('No Bitcoin price available')
    const currentPrice = priceResult.data.price_usd

    // Calculate core metrics using only buy/sell orders
    const coreMetrics = calculatePortfolioMetrics(orders, currentPrice)

    // Calculate send/receive metrics separately
    const totalSent = sends.reduce((total, send) => total + (send.sent_amount || 0), 0)
    const totalReceived = receives.reduce((total, receive) => total + (receive.received_transfer_amount || 0), 0)
    const netTransfers = totalReceived - totalSent

    // Calculate short-term and long-term holdings
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    let shortTermHoldings = 0
    let longTermHoldings = 0

    // Only consider buy orders for holdings age
    orders.forEach(order => {
      const txDate = new Date(order.date)
      const isShortTerm = txDate > oneYearAgo

      if (order.type === 'buy' && order.received_btc_amount) {
        if (isShortTerm) {
          shortTermHoldings += order.received_btc_amount
        } else {
          longTermHoldings += order.received_btc_amount
        }
      } else if (order.type === 'sell' && order.sell_btc_amount) {
        const amount = order.sell_btc_amount
        // Deduct sells proportionally from short and long term holdings
        const totalHoldings = shortTermHoldings + longTermHoldings
        if (totalHoldings > 0) {
          const shortTermRatio = shortTermHoldings / totalHoldings
          const longTermRatio = longTermHoldings / totalHoldings
          
          shortTermHoldings -= amount * shortTermRatio
          longTermHoldings -= amount * longTermRatio
        }
      }
    })

    // Ensure non-negative values
    shortTermHoldings = Math.max(0, shortTermHoldings)
    longTermHoldings = Math.max(0, longTermHoldings)

    return {
      ...coreMetrics,
      shortTermHoldings,
      longTermHoldings,
      sendReceiveMetrics: {
        totalSent,
        totalReceived,
        netTransfers
      }
    }
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error)
    throw error
  }
}

export async function calculateCostBasis(
  userId: string,
  method: 'FIFO' | 'LIFO' | 'Average Cost',
  supabase: SupabaseClient<Database>
): Promise<CostBasisMethodResult> {
  try {
    // Get current Bitcoin price from cache
    const { data: priceData } = await supabase
      .from('bitcoin_prices')
      .select('price_usd')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (!priceData) throw new Error('No Bitcoin price available')
    const currentPrice = priceData.price_usd

    // Get only the orders transactions
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (ordersError) throw ordersError
    if (!orders) throw new Error('Failed to fetch orders')

    // Calculate metrics based only on buy/sell orders
    let runningBalance = 0
    let totalBtcBought = 0 // Only from buys
    let totalSold = 0 // Only from sells
    let totalShortTermBtcBought = 0
    let totalLongTermBtcBought = 0
    const oneYearAgoForProportion = new Date()
    oneYearAgoForProportion.setFullYear(oneYearAgoForProportion.getFullYear() - 1)

    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount) {
        const amount = order.received_btc_amount
        totalBtcBought += amount
        runningBalance += amount
        // Track for average cost tax proportion
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

    const remainingBtc = Math.max(0, runningBalance) // Ensure non-negative balance

    // Shared Tax Rates
    const shortTermTaxRate = 0.15 // User specified ST rate
    const longTermTaxRate = 0.30  // User specified LT rate

    // --- Average Cost Method --- 
    if (method === 'Average Cost') {
      let totalUsdSpent = 0
      let totalUsdReceived = 0

      // Calculate totals only from orders
      orders.forEach(order => {
        if (order.type === 'buy') {
          if (order.buy_fiat_amount) {
            totalUsdSpent += order.buy_fiat_amount
          }
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
      const realizedGains = totalUsdReceived - (totalSold * averageCost)
      const unrealizedGain = currentValue - (remainingBtc * averageCost)
      const unrealizedGainPercent = averageCost > 0 && (remainingBtc * averageCost) > 0 
        ? (unrealizedGain / (remainingBtc * averageCost)) * 100 
        : 0

      // Calculate potential tax liability using proportions (Option 1)
      let potentialTaxLiabilityST = 0
      let potentialTaxLiabilityLT = 0
      if (unrealizedGain > 0 && totalBtcBought > 0) {
        const shortTermProportion = totalShortTermBtcBought / totalBtcBought
        const longTermProportion = totalLongTermBtcBought / totalBtcBought
        potentialTaxLiabilityST = unrealizedGain * shortTermProportion * shortTermTaxRate
        potentialTaxLiabilityLT = unrealizedGain * longTermProportion * longTermTaxRate
      }

      return {
        totalCostBasis: remainingBtc * averageCost,
        averageCost,
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

    // Add ONLY buy transactions to holdings
    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount && order.buy_fiat_amount) {
        btcHoldings.push({
          date: order.date,
          amount: order.received_btc_amount,
          costBasis: order.buy_fiat_amount + (order.service_fee || 0),
          pricePerCoin: order.price
        })
      }
    })

    // Sort holdings based on method
    btcHoldings.sort((a, b) => 
      method === 'FIFO' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Process ONLY sell transactions
    orders.forEach(order => {
      if (order.type === 'sell' && order.sell_btc_amount && order.received_fiat_amount) {
        let remainingSellAmount = order.sell_btc_amount
        // Calculate sell price safely
        const sellPrice = order.sell_btc_amount > 0 
            ? order.received_fiat_amount / order.sell_btc_amount
            : 0

        while (remainingSellAmount > 0 && btcHoldings.length > 0) {
          const holding = btcHoldings[0]
          if (!holding) break;
          const sellAmount = Math.min(remainingSellAmount, holding.amount)
          
          // Calculate gain/loss safely
          const costBasisForPortion = holding.amount > 0 
            ? (sellAmount / holding.amount) * holding.costBasis
            : 0
          const proceedsForPortion = sellAmount * sellPrice
          realizedGains += proceedsForPortion - costBasisForPortion

          // Update or remove the holding
          if (sellAmount === holding.amount) {
            btcHoldings.shift()
          } else {
            // Avoid division by zero if holding amount somehow becomes 0 before update
            const remainingProportion = (holding.amount - sellAmount) > 0 ? (holding.amount - sellAmount) / holding.amount : 0;
            holding.amount -= sellAmount
            holding.costBasis *= remainingProportion
          }

          remainingSellAmount -= sellAmount
        }
      }
    })

    // Calculate remaining cost basis and metrics for FIFO/LIFO
    const totalCostBasis = btcHoldings.reduce((sum, h) => sum + h.costBasis, 0)
    // Calculate average cost of *remaining* holdings safely
    const averageCost = remainingBtc > 0 ? totalCostBasis / remainingBtc : 0 
    const currentValue = remainingBtc * currentPrice
    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 
        ? (unrealizedGain / totalCostBasis) * 100 
        : 0
    
    // Calculate detailed potential tax liability for FIFO/LIFO using updated rates
    let potentialTaxLiabilityST = 0
    let potentialTaxLiabilityLT = 0
    const oneYearAgoForTax = new Date()
    oneYearAgoForTax.setFullYear(oneYearAgoForTax.getFullYear() - 1)

    btcHoldings.forEach(holding => {
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
      totalCostBasis,
      averageCost, // Avg cost of remaining holdings
      unrealizedGain,
      unrealizedGainPercent,
      potentialTaxLiabilityST,
      potentialTaxLiabilityLT,
      realizedGains,
      remainingBtc
    }
  } catch (error) {
    console.error('Error calculating cost basis:', error)
    throw error
  }
}

export async function getPerformanceMetrics(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<PerformanceMetrics> {
  try {
    // Get historical Bitcoin prices, including ATH data
    const { data: priceData } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, last_updated, ath_price, ath_date')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (!priceData) {
      throw new Error('No Bitcoin price data available')
    }

    const prices = [priceData]; // Adapt to calculation logic expecting an array
    const currentPrice = priceData.price_usd;
    const marketAthPrice = priceData.ath_price ?? 0; // Use fetched ATH price
    const marketAthDate = priceData.ath_date ?? 'N/A'; // Use fetched ATH date

    // Get all transactions from different tables
    const [ordersResult, sendsResult, receivesResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('send')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('receive')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
    ])

    if (ordersResult.error) throw ordersResult.error
    if (sendsResult.error) throw sendsResult.error
    if (receivesResult.error) throw receivesResult.error

    const orders = ordersResult.data || []
    const sends = sendsResult.data || []
    const receives = receivesResult.data || []

    // Calculate portfolio value at different points in time
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    // Define additional past dates
    const threeMonthAgo = new Date(now)
    threeMonthAgo.setMonth(now.getMonth() - 3)
    const yearAgo = new Date(now)
    yearAgo.setFullYear(now.getFullYear() - 1)
    const threeYearAgo = new Date(now)
    threeYearAgo.setFullYear(now.getFullYear() - 3)
    const fiveYearAgo = new Date(now)
    fiveYearAgo.setFullYear(now.getFullYear() - 5)

    let totalInvestment = 0 // Keep track of investment for ROI

    // Calculate portfolio value at each point in history
    const calculateValueAtDate = (date: Date): { btc: number; usd: number; investment: number } => {
      let btc = 0
      let investment = 0

      // Process orders up to the date
      orders.forEach(order => {
        if (new Date(order.date) <= date) {
          if (order.type === 'buy') {
            if (order.received_btc_amount) {
              btc += order.received_btc_amount
            }
            if (order.buy_fiat_amount) {
              investment += order.buy_fiat_amount
            }
            if (order.service_fee && order.service_fee_currency === 'USD') {
              investment += order.service_fee
            }
          } else if (order.type === 'sell' && order.sell_btc_amount) {
            btc -= order.sell_btc_amount
          }
        }
      })

      // Find the most recent price point at or before the target date
      const priceRecordAtOrBefore = prices.find(p => new Date(p.last_updated) <= date);

      let price = 0; // Default price

      if (priceRecordAtOrBefore) {
        // Ideal case: Found a price at or before the date
        price = priceRecordAtOrBefore.price_usd;
      } else {
        // Fallback: No price at or before. Find the *closest* price *after* the date.
        // Since prices are sorted descending (newest first), we look for the last element
        // whose date is still greater than the target date.
        const priceRecordJustAfter = prices.slice().reverse().find(p => new Date(p.last_updated) > date);
        if (priceRecordJustAfter) {
          // Use the price from the day immediately following the target date
          price = priceRecordJustAfter.price_usd;
        } 
        // Else: No price found before OR after (date is likely before any data). Price remains 0.
      }
      
      const value = btc * price

      return { btc, usd: value, investment }
    }

    // Calculate current portfolio state
    const current = calculateValueAtDate(now)
    const dayAgoValue = calculateValueAtDate(dayAgo)
    const weekAgoValue = calculateValueAtDate(weekAgo)
    const monthAgoValue = calculateValueAtDate(monthAgo)
    const yearStartValue = calculateValueAtDate(yearStart)
    // Calculate values for additional past dates
    const threeMonthAgoValue = calculateValueAtDate(threeMonthAgo)
    const yearAgoValue = calculateValueAtDate(yearAgo)
    const threeYearAgoValue = calculateValueAtDate(threeYearAgo)
    const fiveYearAgoValue = calculateValueAtDate(fiveYearAgo)

    // Calculate ROI
    const totalROIPercent = current.investment > 0 
      ? ((current.usd - current.investment) / current.investment) * 100 
      : 0

    // Calculate returns for different periods
    const calculatePeriodReturn = (current: number, previous: number) => 
      previous > 0 ? ((current - previous) / previous) * 100 : 0

    const performance: PerformanceMetrics = {
      cumulative: {
        total: {
          percent: totalROIPercent,
          dollar: current.usd - current.investment
        },
        day: {
          percent: calculatePeriodReturn(current.usd, dayAgoValue.usd),
          dollar: current.usd - dayAgoValue.usd
        },
        week: {
          percent: calculatePeriodReturn(current.usd, weekAgoValue.usd),
          dollar: current.usd - weekAgoValue.usd
        },
        month: {
          percent: calculatePeriodReturn(current.usd, monthAgoValue.usd),
          dollar: current.usd - monthAgoValue.usd
        },
        ytd: {
          percent: calculatePeriodReturn(current.usd, yearStartValue.usd),
          dollar: current.usd - yearStartValue.usd
        },
        threeMonth: {
          percent: calculatePeriodReturn(current.usd, threeMonthAgoValue.usd),
          dollar: current.usd - threeMonthAgoValue.usd
        },
        year: {
          percent: calculatePeriodReturn(current.usd, yearAgoValue.usd),
          dollar: current.usd - yearAgoValue.usd
        },
        threeYear: {
          percent: calculatePeriodReturn(current.usd, threeYearAgoValue.usd),
          dollar: current.usd - threeYearAgoValue.usd
        },
        fiveYear: {
          percent: calculatePeriodReturn(current.usd, fiveYearAgoValue.usd),
          dollar: current.usd - fiveYearAgoValue.usd
        }
      },
      annualized: {
        total: null,
        oneYear: null,
        twoYear: null,
        threeYear: null,
        fourYear: null,
        fiveYear: null,
        sixYear: null,
        sevenYear: null,
        eightYear: null
      },
      allTimeHigh: {
        price: marketAthPrice,
        date: new Date(marketAthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }

    return performance
  } catch (error) {
    console.error('Error calculating performance metrics:', error)
    throw error
  }
} 