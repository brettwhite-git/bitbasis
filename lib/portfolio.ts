import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getCurrentBitcoinPrice } from './coinmarketcap'
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
  potentialTaxLiability: number
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
    value: number
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

    // Calculate total BTC
    let runningBalance = 0
    let totalReceived = 0
    let totalSold = 0

    // Process orders
    orders.forEach(order => {
      if (order.type === 'buy' && order.received_btc_amount) {
        totalReceived += order.received_btc_amount
        runningBalance += order.received_btc_amount
      } else if (order.type === 'sell' && order.sell_btc_amount) {
        totalSold += order.sell_btc_amount
        runningBalance -= order.sell_btc_amount
      }
    })

    // Process sends
    sends.forEach(send => {
      if (send.sent_amount) {
        totalSold += send.sent_amount
        runningBalance -= send.sent_amount
      }
    })

    // Process receives
    receives.forEach(receive => {
      if (receive.received_transfer_amount) {
        totalReceived += receive.received_transfer_amount
        runningBalance += receive.received_transfer_amount
      }
    })

    const remainingBtc = runningBalance

    // For Average Cost method
    if (method === 'Average Cost') {
      let totalUsdSpent = 0
      let totalUsdReceived = 0

      // Calculate totals from buy orders
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

      const averageCost = totalReceived > 0 ? totalUsdSpent / totalReceived : 0
      const currentValue = remainingBtc * currentPrice
      const realizedGains = totalUsdReceived - (totalSold * averageCost)
      const unrealizedGain = currentValue - (remainingBtc * averageCost)
      const unrealizedGainPercent = averageCost > 0 ? (unrealizedGain / (remainingBtc * averageCost)) * 100 : 0
      const potentialTaxLiability = unrealizedGain > 0 ? unrealizedGain * 0.15 : 0

      return {
        totalCostBasis: remainingBtc * averageCost,
        averageCost,
        unrealizedGain,
        unrealizedGainPercent,
        potentialTaxLiability,
        realizedGains,
        remainingBtc
      }
    }

    // For FIFO and LIFO methods
    let btcHoldings: BTCHolding[] = []
    let realizedGains = 0

    // Add buy transactions to holdings
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

    // Add receive transactions to holdings (using market price at time of receipt)
    receives.forEach(receive => {
      if (receive.received_transfer_amount) {
        btcHoldings.push({
          date: receive.date,
          amount: receive.received_transfer_amount,
          costBasis: receive.received_transfer_amount * receive.price,
          pricePerCoin: receive.price
        })
      }
    })

    // Sort holdings based on method
    btcHoldings.sort((a, b) => 
      method === 'FIFO' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Process sell transactions
    orders.forEach(order => {
      if (order.type === 'sell' && order.sell_btc_amount && order.received_fiat_amount) {
        let remainingSellAmount = order.sell_btc_amount
        const sellPrice = order.received_fiat_amount / order.sell_btc_amount

        while (remainingSellAmount > 0 && btcHoldings.length > 0) {
          const holding = btcHoldings[0]
          const sellAmount = Math.min(remainingSellAmount, holding.amount)
          
          // Calculate gain/loss for this portion
          const costBasisForPortion = (sellAmount / holding.amount) * holding.costBasis
          const proceedsForPortion = sellAmount * sellPrice
          realizedGains += proceedsForPortion - costBasisForPortion

          // Update or remove the holding
          if (sellAmount === holding.amount) {
            btcHoldings.shift()
          } else {
            holding.amount -= sellAmount
            holding.costBasis *= (holding.amount / (holding.amount + sellAmount))
          }

          remainingSellAmount -= sellAmount
        }
      }
    })

    // Process send transactions (treated as disposals at market price)
    sends.forEach(send => {
      if (send.sent_amount) {
        let remainingSendAmount = send.sent_amount
        const sendPrice = send.price // Market price at time of send

        while (remainingSendAmount > 0 && btcHoldings.length > 0) {
          const holding = btcHoldings[0]
          const sendAmount = Math.min(remainingSendAmount, holding.amount)
          
          // Calculate gain/loss for this portion
          const costBasisForPortion = (sendAmount / holding.amount) * holding.costBasis
          const proceedsForPortion = sendAmount * sendPrice
          realizedGains += proceedsForPortion - costBasisForPortion

          // Update or remove the holding
          if (sendAmount === holding.amount) {
            btcHoldings.shift()
          } else {
            holding.amount -= sendAmount
            holding.costBasis *= (holding.amount / (holding.amount + sendAmount))
          }

          remainingSendAmount -= sendAmount
        }
      }
    })

    // Calculate remaining cost basis and metrics
    const totalCostBasis = btcHoldings.reduce((sum, h) => sum + h.costBasis, 0)
    const averageCost = remainingBtc > 0 ? totalCostBasis / remainingBtc : 0
    const currentValue = remainingBtc * currentPrice
    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
    const potentialTaxLiability = unrealizedGain > 0 ? unrealizedGain * 0.15 : 0

    return {
      totalCostBasis,
      averageCost,
      unrealizedGain,
      unrealizedGainPercent,
      potentialTaxLiability,
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
    // Get historical Bitcoin prices
    const { data: prices } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, last_updated')
      .order('last_updated', { ascending: false })
      .limit(1825) // 5 years of daily prices

    if (!prices || prices.length === 0) {
      throw new Error('No Bitcoin price data available')
    }

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

    // Calculate total investment and current portfolio value
    let totalInvestment = 0
    let totalBtc = 0
    let realizedGains = 0
    let allTimeHigh = 0
    let allTimeHighDate = ''

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

      // Process sends up to the date
      sends.forEach(send => {
        if (new Date(send.date) <= date && send.sent_amount) {
          btc -= send.sent_amount
        }
      })

      // Process receives up to the date
      receives.forEach(receive => {
        if (new Date(receive.date) <= date && receive.received_transfer_amount) {
          btc += receive.received_transfer_amount
        }
      })

      const price = prices.find(p => new Date(p.last_updated) <= date)?.price_usd || prices[0]?.price_usd || 0
      const value = btc * price

      // Update all-time high if this value is higher
      if (value > allTimeHigh) {
        allTimeHigh = value
        allTimeHighDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }

      return { btc, usd: value, investment }
    }

    // Calculate current portfolio state
    const current = calculateValueAtDate(now)
    const dayAgoValue = calculateValueAtDate(dayAgo)
    const weekAgoValue = calculateValueAtDate(weekAgo)
    const monthAgoValue = calculateValueAtDate(monthAgo)
    const yearStartValue = calculateValueAtDate(yearStart)

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
          percent: null,
          dollar: null
        },
        year: {
          percent: null,
          dollar: null
        },
        threeYear: {
          percent: null,
          dollar: null
        },
        fiveYear: {
          percent: null,
          dollar: null
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
        value: allTimeHigh,
        date: allTimeHighDate
      }
    }

    return performance
  } catch (error) {
    console.error('Error calculating performance metrics:', error)
    throw error
  }
} 