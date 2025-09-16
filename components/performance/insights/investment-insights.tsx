// Removed Card imports - using glass morphism styling
import { formatCurrency, formatPercent } from "@/lib/utils/utils"
import type { PerformanceMetrics } from "@/lib/core/portfolio/types"
import { calculateDCAPerformance } from "@/lib/core/portfolio/performance"
import { UnifiedTransaction } from "@/types/transactions"
import { 
  CircleArrowRightIcon,
  CircleFadingArrowUp,
  CircleArrowUpIcon,
  CircleArrowDownIcon,
  CircleDashedIcon
} from "lucide-react"

interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  shortTermHoldings?: number
  longTermHoldings?: number
}

interface InvestmentInsightsProps {
  performance: ExtendedPerformanceMetrics
  transactions: UnifiedTransaction[]
}

export function InvestmentInsights({ performance, transactions }: InvestmentInsightsProps) {
  // Extract values from performance
  const currentPrice = performance.currentPrice ?? 0
  const averageBuyPrice = performance.averageBuyPrice ?? 0
  const lowestBuyPrice = performance.lowestBuyPrice ?? 0
  const highestBuyPrice = performance.highestBuyPrice ?? 0
  
  // Extract the all-time high price
  const athObject = performance.allTimeHigh ?? { price: 69000, date: '' }
  const athPrice = athObject.price

  // Calculate 3-month average buy price
  const calculateThreeMonthAverage = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    let totalBtc = 0
    let totalFiat = 0
    
    // Filter and calculate average for last 3 months of buys using new schema
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date)
      if (
        transaction.type === 'buy' && 
        transactionDate >= threeMonthsAgo &&
        transaction.received_amount &&
        transaction.sent_amount
      ) {
        totalBtc += transaction.received_amount
        totalFiat += transaction.sent_amount
      }
    })
    
    return totalBtc > 0 ? totalFiat / totalBtc : 0
  }
  
  const threeMonthAvgPrice = calculateThreeMonthAverage()
  
  // Calculate percentage differences from current price
  // const lowestBuyDiff = lowestBuyPrice > 0 ? ((currentPrice - lowestBuyPrice) / lowestBuyPrice) * 100 : 0
  // const avgBuyDiff = threeMonthAvgPrice > 0 ? ((currentPrice - threeMonthAvgPrice) / threeMonthAvgPrice) * 100 : 0
  // const highestBuyDiff = highestBuyPrice > 0 ? ((currentPrice - highestBuyPrice) / highestBuyPrice) * 100 : 0
  
  // Calculate insights
  const calculatePriceComparison = () => {
    if (currentPrice === 0 || threeMonthAvgPrice === 0) {
      return {
        message: "Insufficient data to compare recent prices",
        percent: 0
      }
    }

    const priceDiffPercent = ((currentPrice - threeMonthAvgPrice) / threeMonthAvgPrice) * 100

    if (priceDiffPercent <= -10) {
      return {
        message: "Spot price is significantly below your 3-month average buy price",
        percent: priceDiffPercent
      }
    } else if (priceDiffPercent < 0) {
      return {
        message: "Spot price is below your 3-month averagey",
        percent: priceDiffPercent
      }
    } else if (priceDiffPercent <= 10) {
      return {
        message: "Spot price is close to your 3-month buying average",
        percent: priceDiffPercent
      }
    } else {
      return {
        message: "Spot price is higher than your 3-month average",
        percent: priceDiffPercent
      }
    }
  }

  // Calculate DCA vs Lump Sum Performance
  const calculateDCAInsight = () => {
    const { outperformance } = calculateDCAPerformance(transactions, currentPrice)
    
    if (Math.abs(outperformance) < 1) {
      return {
        outperformance,
        message: "Your DCA strategy has performed similarly to a lump-sum approach"
      }
    }
    
    return {
      outperformance,
      message: outperformance > 0
        ? `Your 6-month DCA approach has outperformed lump-sum by ${formatPercent(outperformance)}`
        : `Your 6-month DCA approach has underperformed lump-sum by ${formatPercent(Math.abs(outperformance))}`
    }
  }

  // Calculate Tax Efficiency
  const calculateTaxEfficiency = () => {
    const shortTermHoldings = performance.shortTermHoldings ?? 0
    const longTermHoldings = performance.longTermHoldings ?? 0
    const totalHoldings = shortTermHoldings + longTermHoldings
    
    // Calculate percentage of holdings that are long-term
    const longTermPercent = totalHoldings > 0 
      ? (longTermHoldings / totalHoldings) * 100 
      : 0
    
    let message = ""
    
    // Debug log to help diagnose the issue
    console.log('Tax Efficiency Calculation:', {
      shortTermHoldings,
      longTermHoldings,
      totalHoldings,
      longTermPercent
    })
    
    if (totalHoldings === 0) {
      message = "No current holdings to analyze for tax efficiency"
    } else {
      message = `${formatPercent(longTermPercent)} of your holdings qualify for lower long-term capital gains rates`
      
      if (longTermPercent < 25) {
        message += " - Most positions are subject to higher short-term rates"
      } else if (longTermPercent < 50) {
        message += " - Consider holding more positions past the 1-year mark"
      } else if (longTermPercent < 75) {
        message += " - Portfolio is becoming more tax-efficient"
      } else {
        message += " - Portfolio is highly tax-efficient"
      }
    }
    
    return {
      longTermPercent,
      message
    }
  }

  const priceComparison = calculatePriceComparison()
  const dcaPerformance = calculateDCAInsight()
  const taxEfficiency = calculateTaxEfficiency()

  // Calculate progress bar widths based on price ranges
  const getProgressWidth = (price: number) => {
    // For ATH, always show full width
    if (price === athPrice) return 100;

    // For highest buy, show relative to ATH
    if (price === highestBuyPrice) {
      return (highestBuyPrice / athPrice) * 100;
    }

    // For current price, show relative to ATH
    if (price === currentPrice) {
      return (currentPrice / athPrice) * 100;
    }

    // For lowest buy, calculate percentage of highest value
    if (price === lowestBuyPrice) {
      return (lowestBuyPrice / athPrice) * 100;
    }

    // For average buy
    if (price === averageBuyPrice) {
      return (averageBuyPrice / athPrice) * 100;
    }

    // Default case
    const maxPrice = Math.max(athPrice, highestBuyPrice)
    const range = maxPrice > 0 ? maxPrice : 1;
    return (price / range) * 100;
  }

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div className="pb-2">
        <h3 className="text-xl font-bold text-white">Investment Insights</h3>
      </div>
      <div className="flex-1 flex flex-col pt-2">
        {/* Investment Insights */}
        <div className="space-y-6 mb-6">
          {/* Price Comparison */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange mb-1">Price Comparison</p>
            <p className="text-sm font-medium text-white mb-1">{priceComparison.message}</p>
            {threeMonthAvgPrice > 0 && (
              <p className="text-sm text-gray-400">
                3-month average buy price: {formatCurrency(threeMonthAvgPrice)}
              </p>
            )}
          </div>
          
          {/* DCA Performance */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange mb-1">DCA Strategy Performance</p>
            <p className="text-sm font-medium text-white mb-1">
              {Math.abs(dcaPerformance.outperformance) < 1 
                ? "Your DCA strategy is performing similarly to a lump-sum approach"
                : dcaPerformance.outperformance > 0
                  ? `Your DCA strategy is outperforming lump-sum`
                  : `Your DCA strategy is underperforming lump-sum`
              }
            </p>
            <p className="text-sm text-gray-400">
              {Math.abs(dcaPerformance.outperformance) >= 1 &&
                `Performance difference: ${formatPercent(Math.abs(dcaPerformance.outperformance))}`
              }
            </p>
          </div>
          
          {/* Tax Efficiency */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange mb-1">Tax Efficiency</p>
            <p className="text-sm font-medium text-white mb-1">
              {formatPercent(taxEfficiency.longTermPercent)} of holdings qualify for long-term rates
            </p>
            <p className="text-sm text-gray-400">
              {taxEfficiency.longTermPercent < 25
                ? "Most positions are subject to higher short-term rates"
                : taxEfficiency.longTermPercent < 50
                ? "Consider holding more positions past the 1-year mark"
                : taxEfficiency.longTermPercent < 75
                ? "Portfolio is becoming more tax-efficient"
                : "Portfolio is highly tax-efficient"
              }
            </p>
          </div>
        </div>
        
        {/* Divider after investment insights */}
        <div className="border-t border-gray-700 mb-5"></div>
        
        <div className="space-y-12 mb-auto">
          {/* Current Price */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CircleArrowRightIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Current Price</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(currentPrice)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" 
                style={{ width: `${getProgressWidth(currentPrice)}%` }}
              ></div>
            </div>
          </div>
          
          {/* BTC All-Time High */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CircleFadingArrowUp className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">BTC All-Time High</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(athPrice)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" 
                style={{ width: `${getProgressWidth(athPrice)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Highest Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CircleArrowUpIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Highest Buy</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(highestBuyPrice)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" 
                style={{ width: `${getProgressWidth(highestBuyPrice)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Lowest Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CircleArrowDownIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Lowest Buy</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(lowestBuyPrice)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" 
                style={{ width: `${getProgressWidth(lowestBuyPrice)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Average Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CircleDashedIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Average Buy</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(averageBuyPrice)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" 
                style={{ width: `${getProgressWidth(averageBuyPrice)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 