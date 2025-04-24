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
  Bitcoin 
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
  // We're not using athDiff anymore

  return (
    <Card className="h-full flex flex-col bg-[#0f172a] border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Buy Price References</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Buy Opportunity Status */}
        <div className="mb-4 pt-4">
          <div className="flex justify-center items-center">
            {currentPrice > 0 && averageBuyPrice > 0 && (
              currentPrice < averageBuyPrice ? (
                <span className="text-sm font-medium px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
                  Current price is below your average cost basis
                </span>
              ) : currentPrice < highestBuyPrice ? (
                <span className="text-sm font-medium px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full">
                  Current price is within your historical buy range
                </span>
              ) : (
                <span className="text-sm font-medium px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full">
                  Current price is above your typical buying range
                </span>
              )
            )}
          </div>
        </div>
        
     
        
        {/* Divider after performance summary */}
        <div className="border-t border-gray-800 mt-32 mb-4"></div>
        
        <div className="space-y-14 mb-auto">
          {/* Current Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-blue-500" />
                <span className="text-base font-medium">Current Price</span>
              </div>
              <span className="text-2xl font-bold">{formatCurrency(currentPrice)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          {/* BTC All-Time High */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500" />
                <span className="text-base font-medium">BTC All-Time High</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(athPrice)}</span>
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          {/* Lowest Buy Price */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownIcon className="h-4 w-4 text-green-500" />
                <span className="text-base font-medium">Your Lowest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(lowestBuyPrice)}</span>
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
                <ScaleIcon className="h-4 w-4 text-amber-500" />
                <span className="text-base font-medium">Your Average Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(averageBuyPrice)}</span>
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
                <ArrowUpIcon className="h-4 w-4 text-red-500" />
                <span className="text-base font-medium">Your Highest Buy</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{formatCurrency(highestBuyPrice)}</span>
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