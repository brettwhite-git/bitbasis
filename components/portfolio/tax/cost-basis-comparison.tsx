"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCostBasisCalculation, CostBasisMethod } from '@/lib/hooks/useCostBasisCalculation'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'

export function CostBasisComparison() {
  const [activeTab, setActiveTab] = useState<CostBasisMethod>('Average Cost')
  const { data, loading, error, method, setMethod } = useCostBasisCalculation(activeTab)

  const handleTabChange = (value: string) => {
    const newMethod = value as CostBasisMethod
    setActiveTab(newMethod)
    setMethod(newMethod)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2 my-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="py-4 text-center text-red-500">
          <p>Error loading cost basis data.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )
    }

    if (!data) {
      return (
        <div className="py-4 text-center">
          <p className="text-muted-foreground">No cost basis data available</p>
        </div>
      )
    }

    return (
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Cost Basis</p>
            <p className="text-2xl font-bold">{formatCurrency(data.totalCostBasis)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Average Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(data.averageCost)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Unrealized Gain</p>
            <p className="text-2xl font-bold">{formatCurrency(data.unrealizedGain)}</p>
            <p className="text-sm text-muted-foreground">
              {formatPercentage(data.unrealizedGainPercent)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Realized Gains</p>
            <p className="text-2xl font-bold">{formatCurrency(data.realizedGains)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Short-term Tax Liability</p>
            <p className="text-2xl font-bold">{formatCurrency(data.potentialTaxLiabilityST)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Long-term Tax Liability</p>
            <p className="text-2xl font-bold">{formatCurrency(data.potentialTaxLiabilityLT)}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">Remaining BTC</p>
          <p className="text-2xl font-bold">{data.remainingBtc.toFixed(8)} BTC</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Cost Basis Comparison</CardTitle>
        <CardDescription>
          Compare different cost basis calculation methods for tax purposes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="FIFO" className="flex-1">FIFO</TabsTrigger>
            <TabsTrigger value="LIFO" className="flex-1">LIFO</TabsTrigger>
            <TabsTrigger value="Average Cost" className="flex-1">Average Cost</TabsTrigger>
          </TabsList>

          <TabsContent value="FIFO">
            <div className="p-1 text-sm text-muted-foreground">
              <p>First In, First Out - sells are matched to oldest buys first</p>
            </div>
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="LIFO">
            <div className="p-1 text-sm text-muted-foreground">
              <p>Last In, First Out - sells are matched to newest buys first</p>
            </div>
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="Average Cost">
            <div className="p-1 text-sm text-muted-foreground">
              <p>Average Cost - sells use the average cost of all buys</p>
            </div>
            {renderContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
