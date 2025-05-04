"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBTC, formatCurrency } from "@/lib/utils/utils"

interface HoldingsTermProps {
  btcAmount: number
  btcPrice: number
  term: 'Long-Term' | 'Short-Term'
  isLoading?: boolean
}

export function HoldingsTerm({ btcAmount, btcPrice, term, isLoading = false }: HoldingsTermProps) {
  const value = btcAmount * btcPrice
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{term} Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-bitcoin-orange">
              {formatBTC(btcAmount)}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Value: {formatCurrency(value)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
} 