"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { PerformanceMetrics } from "@/lib/portfolio"
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  TrophyIcon, 
  DollarSignIcon, 
  ScaleIcon,
  Bitcoin,
  TrendingUpIcon,
  PercentIcon,
  PiggyBankIcon,
  CircleArrowRightIcon,
  CircleFadingArrowUp,
  CircleArrowUpIcon,
  CircleArrowDownIcon,
  CircleDashedIcon
} from "lucide-react"

interface BuyPriceReferencesProps {
  performance: PerformanceMetrics
}

export function BuyPriceReferences({ performance }: BuyPriceReferencesProps) {
  // Extract values from performance
  const currentPrice = performance.currentPrice ?? 0
  const averageBuyPrice = performance.averageBuyPrice ?? 0
  const lowestBuyPrice = performance.lowestBuyPrice ?? 0
  const highestBuyPrice = performance.highestBuyPrice ?? 0
  
  // Extract the all-time high price
  const athObject = performance.allTimeHigh ?? { price: 69000, date: '' }
  const athPrice = athObject.price

  // Calculate percentage differences from current price
  const lowestBuyDiff = lowestBuyPrice > 0 ? ((currentPrice - lowestBuyPrice) / lowestBuyPrice) * 100 : 0
  const avgBuyDiff = averageBuyPrice > 0 ? ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100 : 0
  const highestBuyDiff = highestBuyPrice > 0 ? ((currentPrice - highestBuyPrice) / highestBuyPrice) * 100 : 0
  
  // Mock data for investment insights (these should be calculated from real data)
  const threeMonthAvgPrice = 75000 // Mock 3-month average purchase price
  const priceComparisonPercent = ((currentPrice - threeMonthAvgPrice) / threeMonthAvgPrice) * 100
  const dcaVsLumpSum = 8.7 // Mock DCA vs lump sum performance over 6 months
  const longTermTaxPercent = 68 // Percentage of holdings held > 1 year
  
  // Determine buying recommendation based on current price vs 3-month average
  const getBuyingRecommendation = () => {
    if (priceComparisonPercent <= -10) {
      return "Spot price is significantly below your recent buys - consider increasing position"
    } else if (priceComparisonPercent < 0) {
      return "Spot price is below your recent average - potential buying opportunity"
    } else if (priceComparisonPercent <= 10) {
      return "Spot price is close to your recent buying average"
    } else {
      return "Spot price is higher than your recent buys - consider waiting for a dip"
    }
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground">Investment Insights</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        
        {/* Investment Insights */}
        <div className="space-y-4 mb-8">
          {/* Buying Recommendation */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange">Price Comparison</p>
            <p className="text-xs text-foreground">{getBuyingRecommendation()}</p>
          </div>
          
          {/* DCA Performance */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange">DCA Strategy Performance</p>
            <p className="text-xs text-foreground">Your 6-month DCA approach has outperformed lump-sum by {dcaVsLumpSum}%</p>
          </div>
          
          {/* Tax Optimization */}
          <div className="border-l-[3px] border-bitcoin-orange pl-3 py-1">
            <p className="text-sm font-medium text-bitcoin-orange">Tax Efficiency</p>
            <p className="text-xs text-foreground">{longTermTaxPercent}% of your holdings qualify for lower long-term capital gains rates</p>
          </div>
        </div>
        
        {/* Divider after investment insights */}
        <div className="border-t border-border mb-6"></div>
        
        <div className="space-y-14 mb-auto">
          {/* Current Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CircleArrowRightIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Current Price</span>
              </div>
              <span className="text-xl font-bold">{formatCurrency(currentPrice)}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          {/* BTC All-Time High */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CircleFadingArrowUp className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">BTC All-Time High</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{formatCurrency(athPrice)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          {/* Highest Buy Price - moved up before Lowest Buy */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CircleArrowUpIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Highest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{formatCurrency(highestBuyPrice)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          {/* Lowest Buy Price - moved down below Highest Buy */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CircleArrowDownIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Lowest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{formatCurrency(lowestBuyPrice)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
          
          {/* Average Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CircleDashedIcon className="h-4 w-4 text-bitcoin-orange" />
                <span className="text-base font-medium">Your Average Buy</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{formatCurrency(averageBuyPrice)}</span>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-gradient-to-r from-bitcoin-orange to-bitcoin-orange h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  )
} 