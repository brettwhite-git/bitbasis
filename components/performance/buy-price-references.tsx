"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { formatCurrency, formatPercent } from "@/lib/utils"
import type { PerformanceMetrics } from "@/lib/portfolio"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface BuyPriceReferencesProps {
  performance: PerformanceMetrics
}

export function BuyPriceReferences({ performance }: BuyPriceReferencesProps) {
  // Extract values from performance
  const currentPrice = performance.currentPrice ?? 0
  const averageBuyPrice = performance.averageBuyPrice ?? 0
  const lowestBuyPrice = performance.lowestBuyPrice ?? 0
  const highestBuyPrice = performance.highestBuyPrice ?? 0

  // Calculate percentage differences from current price
  const lowestBuyDiff = lowestBuyPrice > 0 ? ((currentPrice - lowestBuyPrice) / lowestBuyPrice) * 100 : 0
  const avgBuyDiff = averageBuyPrice > 0 ? ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100 : 0
  const highestBuyDiff = highestBuyPrice > 0 ? ((currentPrice - highestBuyPrice) / highestBuyPrice) * 100 : 0

  return (
    <Card className="h-full flex flex-col bg-[#0f172a] border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Buy Price References</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Buy Opportunity Status */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              {currentPrice > 0 && averageBuyPrice > 0 && (
                currentPrice < averageBuyPrice ? (
                  <span className="text-sm font-medium text-green-500">
                    Good buying opportunity: Currently below your average cost basis
                  </span>
                ) : currentPrice < highestBuyPrice ? (
                  <span className="text-sm font-medium text-amber-500">
                    Consider buying: Price is within your historical buy range
                  </span>
                ) : (
                  <span className="text-sm font-medium text-blue-500">
                    Wait for dip: Price is above your typical buying range
                  </span>
                )
              )}
            </div>
            <div>
              {currentPrice > 0 && averageBuyPrice > 0 && (
                currentPrice < averageBuyPrice ? (
                  <span className="text-sm font-medium px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full">
                    Below your average cost
                  </span>
                ) : currentPrice < highestBuyPrice ? (
                  <span className="text-sm font-medium px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full">
                    Within your buy range
                  </span>
                ) : (
                  <span className="text-sm font-medium px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full">
                    Above your buy range
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        
        {/* Divider between status and performance summary */}
        <div className="border-t border-gray-800 my-4"></div>
        
        {/* Performance Summary - moved below status */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold mb-4">Performance Summary</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Overall Profit</div>
              <div className={`text-lg font-bold ${avgBuyDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgBuyDiff >= 0 ? '+' : ''}{formatPercent(avgBuyDiff)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground">From ATH</div>
              <div className={`text-lg font-bold ${highestBuyDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(highestBuyDiff)}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground">From Lowest</div>
              <div className={`text-lg font-bold ${lowestBuyDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(lowestBuyDiff)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider after performance summary */}
        <div className="border-t border-gray-800 my-4"></div>
        
        <div className="space-y-12 mb-auto">
          {/* Current Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-medium">Current Price</span>
              <span className="text-2xl font-bold">{formatCurrency(currentPrice)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          {/* Lowest Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                <span className="text-base font-medium">Your Lowest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(lowestBuyPrice)}</span>
                <div className="text-sm font-medium text-green-500">
                  {formatPercent(lowestBuyDiff)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
          
          {/* Average Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-4">⚖️</span>
                <span className="text-base font-medium">Your Average Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(averageBuyPrice)}</span>
                <div className="text-sm font-medium text-green-500">
                  {formatPercent(avgBuyDiff)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          
          {/* Highest Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="h-4 w-4 text-gray-400" />
                <span className="text-base font-medium">Your Highest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(highestBuyPrice)}</span>
                <div className="text-sm font-medium text-red-500">
                  {formatPercent(highestBuyDiff)}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 