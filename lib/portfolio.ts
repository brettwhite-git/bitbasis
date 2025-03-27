import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getCurrentBitcoinPrice } from './coinmarketcap'
import { Database } from '@/types/supabase'

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

interface PortfolioMetrics {
  totalBtc: number
  totalCostBasis: number
  totalFees: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPercent: number
  averageBuyPrice: number
  totalTransactions: number
  shortTermHoldings: number
  longTermHoldings: number
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
): Promise<PortfolioMetrics> {
  try {
    // 1. Get transactions ordered by date
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (error) throw error
    if (!transactions || transactions.length === 0) {
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
        longTermHoldings: 0
      }
    }

    // 2. Process transactions in chronological order
    let runningBalance = 0
    let totalReceived = 0
    let totalSold = 0

    // Log transactions for debugging
    transactions.forEach(t => {
      // Only count received amounts in BTC
      if (t.received_amount && t.received_currency === 'BTC') {
        const received = Number(t.received_amount)
        totalReceived += received
        runningBalance += received
        console.log('Received BTC:', { 
          date: t.date,
          type: t.type, 
          amount: received, 
          runningBalance 
        })
      }
      
      // Only count sell amounts in BTC
      if (t.sell_amount && t.sell_currency === 'BTC') {
        const sold = Number(t.sell_amount)
        if (sold > runningBalance) {
          console.warn('Invalid sell transaction detected:', {
            date: t.date,
            sellAmount: sold,
            availableBalance: runningBalance,
            currency: t.sell_currency
          })
          // Only count the sell up to the available balance
          totalSold += runningBalance
          runningBalance = 0
        } else {
          totalSold += sold
          runningBalance -= sold
        }
        console.log('Sold BTC:', { 
          date: t.date,
          type: t.type, 
          amount: sold, 
          runningBalance 
        })
      }
    })

    const totalBtc = runningBalance

    console.log('Final BTC totals:', {
      totalReceived,
      totalSold,
      runningBalance: totalBtc
    })

    // 3. Get current Bitcoin price from cache
    const { data: priceData } = await supabase
      .from('bitcoin_prices')
      .select('price_usd, last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (!priceData) throw new Error('No Bitcoin price available')

    console.log('Bitcoin price data:', priceData)

    // 4. Calculate current value
    const currentValue = totalBtc * priceData.price_usd

    // 5. Calculate other metrics
    const totalFees = transactions.reduce((sum, t) => {
      // Only count USD service fees
      if (t.service_fee && t.service_fee_currency === 'USD') {
        return sum + t.service_fee
      }
      return sum
    }, 0)

    console.log('Fee calculations:', {
      totalServiceFees: totalFees
    })

    // Calculate cost basis from all buy transactions
    const buyTransactions = transactions.filter(t => 
      t.type === 'Buy' && 
      t.received_currency === 'BTC' && 
      t.buy_currency === 'USD'
    )
    
    const totalCostBasis = buyTransactions.reduce((sum, t) => sum + (t.buy_amount || 0), 0)

    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
    const averageBuyPrice = totalBtc > 0 ? totalCostBasis / totalBtc : 0

    console.log('Final metrics:', {
      totalBtc,
      totalCostBasis,
      currentValue,
      unrealizedGain,
      averageBuyPrice
    })

    // Calculate short-term and long-term holdings
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    let shortTermHoldings = 0
    let longTermHoldings = 0

    // Process transactions to determine holdings age
    transactions.forEach(tx => {
      const txDate = new Date(tx.date)
      const isShortTerm = txDate > oneYearAgo

      if (tx.received_amount && tx.received_currency === 'BTC') {
        const amount = Number(tx.received_amount)
        if (isShortTerm) {
          shortTermHoldings += amount
        } else {
          longTermHoldings += amount
        }
      }

      if (tx.sell_amount && tx.sell_currency === 'BTC') {
        const amount = Number(tx.sell_amount)
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

    console.log('Holdings breakdown:', {
      shortTerm: shortTermHoldings,
      longTerm: longTermHoldings,
      total: shortTermHoldings + longTermHoldings,
      calculatedTotal: totalBtc
    })

    return {
      totalBtc,
      totalCostBasis,
      totalFees,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent,
      averageBuyPrice,
      totalTransactions: transactions.length,
      shortTermHoldings,
      longTermHoldings
    }
  } catch (error) {
    console.error('Error calculating portfolio metrics:', error)
    throw error
  }
}

export async function calculateCostBasis(
  transactions: Transaction[],
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

    // Calculate total BTC using the same logic as getPortfolioMetrics
    let runningBalance = 0
    let totalReceived = 0
    let totalSold = 0

    // Process all transactions chronologically
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // First pass: calculate total BTC
    for (const tx of sortedTransactions) {
      if (tx.received_amount && tx.received_currency === 'BTC') {
        const received = Number(tx.received_amount)
        totalReceived += received
        runningBalance += received
      }
      
      if (tx.sell_amount && tx.sell_currency === 'BTC') {
        const sold = Number(tx.sell_amount)
        totalSold += sold
        runningBalance -= sold
      }
    }

    const remainingBtc = runningBalance

    console.log('\nTotal BTC Calculation:', {
      totalReceived,
      totalSold,
      remainingBtc
    })

    // Filter transactions for cost basis calculation
    const buyTransactions = transactions.filter(t => 
      t.type === 'Buy' && 
      t.received_currency === 'BTC' && 
      t.buy_currency === 'USD'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const sellTransactions = transactions.filter(t => 
      t.type === 'Sell' && 
      t.sell_currency === 'BTC'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log('\nFiltered Transactions:', {
      buyTransactions: buyTransactions.length,
      sellTransactions: sellTransactions.length,
      currentPrice
    })

    // For Average Cost method
    if (method === 'Average Cost') {
      let totalUsdSpent = 0
      let totalUsdReceived = 0

      // Calculate totals from buy transactions
      for (const tx of buyTransactions) {
        if (tx.buy_amount) {
          totalUsdSpent += Number(tx.buy_amount)
        }
      }

      // Calculate totals from sell transactions
      for (const tx of sellTransactions) {
        if (tx.sell_amount) {
          totalUsdReceived += Number(tx.sell_amount) * tx.price
        }
      }

      const averageCost = totalReceived > 0 ? totalUsdSpent / totalReceived : 0
      const currentValue = remainingBtc * currentPrice
      const realizedGains = totalUsdReceived - (totalSold * averageCost)
      const unrealizedGain = currentValue - (remainingBtc * averageCost)
      const unrealizedGainPercent = averageCost > 0 ? (unrealizedGain / (remainingBtc * averageCost)) * 100 : 0
      const potentialTaxLiability = unrealizedGain > 0 ? unrealizedGain * 0.15 : 0

      console.log('\nAverage Cost Calculation:', {
        totalReceived,
        totalUsdSpent,
        totalSold,
        totalUsdReceived,
        remainingBtc,
        averageCost,
        realizedGains,
        unrealizedGain
      })

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

    // Process buy transactions
    for (const tx of buyTransactions) {
      if (tx.received_amount && tx.buy_amount) {
        const amount = Number(tx.received_amount)
        const costBasis = Number(tx.buy_amount)
        const fees = (tx.network_fee || 0) + (tx.service_fee || 0)
        const totalCost = costBasis + fees

        btcHoldings.push({
          date: tx.date,
          amount,
          costBasis: totalCost,
          pricePerCoin: totalCost / amount
        })
      }
    }

    // Process sell transactions
    for (const tx of sellTransactions) {
      if (!tx.sell_amount) continue

      const amountToSell = Number(tx.sell_amount)
      let remainingToSell = amountToSell

      // For LIFO, reverse the holdings array
      const holdingsToProcess = method === 'LIFO' 
        ? [...btcHoldings].reverse() 
        : btcHoldings

      // Process the sale
      for (let i = 0; i < holdingsToProcess.length && remainingToSell > 0; i++) {
        const holding = holdingsToProcess[i]
        if (!holding || holding.amount <= 0) continue

        const sellFromThisLot = Math.min(remainingToSell, holding.amount)
        const costBasisForSold = (sellFromThisLot / holding.amount) * holding.costBasis
        const saleProceeds = sellFromThisLot * tx.price

        // Calculate gain/loss
        realizedGains += saleProceeds - costBasisForSold

        // Update holding
        holding.amount -= sellFromThisLot
        holding.costBasis -= costBasisForSold
        remainingToSell -= sellFromThisLot

        console.log(`\n${method} Lot Sale:`, {
          purchaseDate: holding.date,
          saleDate: tx.date,
          amountSold: sellFromThisLot,
          costBasis: costBasisForSold,
          saleProceeds,
          gainLoss: saleProceeds - costBasisForSold
        })
      }
    }

    // Calculate remaining totals
    btcHoldings = btcHoldings.filter(h => h.amount > 0)
    const totalCostBasis = btcHoldings.reduce((sum, h) => sum + h.costBasis, 0)
    const averageCost = remainingBtc > 0 ? totalCostBasis / remainingBtc : 0
    const currentValue = remainingBtc * currentPrice
    const unrealizedGain = currentValue - totalCostBasis
    const unrealizedGainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
    const potentialTaxLiability = unrealizedGain > 0 ? unrealizedGain * 0.15 : 0

    console.log(`\n${method} Final Calculation:`, {
      remainingLots: btcHoldings.length,
      remainingBtc,
      totalCostBasis,
      averageCost,
      realizedGains,
      unrealizedGain
    })

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

    // Get user's transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (!transactions) {
      throw new Error('No transactions found')
    }

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
      const relevantTx = transactions.filter(tx => new Date(tx.date) <= date)
      
      relevantTx.forEach(tx => {
        if (tx.type === 'Buy' && tx.buy_amount && tx.buy_currency === 'USD') {
          investment += tx.buy_amount + (tx.service_fee || 0) + (tx.network_fee || 0)
        }
        if (tx.received_amount && tx.received_currency === 'BTC') {
          btc += Number(tx.received_amount)
        }
        if (tx.sell_amount && tx.sell_currency === 'BTC') {
          btc -= Number(tx.sell_amount)
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