"use client"

import { useCostBasisCalculation } from '@/lib/hooks/useCostBasisCalculation'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/format'

export function TaxLiabilityContent() {
  const { data, loading, error } = useCostBasisCalculation('Average Cost')

  // Calculate total potential tax liability
  const totalTaxLiability = data 
    ? data.potentialTaxLiabilityST + data.potentialTaxLiabilityLT 
    : 0

  // Calculate effective tax rate
  const effectiveTaxRate = data && data.unrealizedGain > 0
    ? (totalTaxLiability / data.unrealizedGain) * 100
    : 0

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Potential Tax Liability</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Estimated based on current unrealized gains
      </p>
      
      {error ? (
        <div className="text-center text-red-500">
          <p>Error loading tax data.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : !data ? (
        <div className="text-center">
          <p className="text-muted-foreground">No tax data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Short-term Liability (37%)</p>
              <p className="text-2xl font-bold">{formatCurrency(data.potentialTaxLiabilityST)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Long-term Liability (20%)</p>
              <p className="text-2xl font-bold">{formatCurrency(data.potentialTaxLiabilityLT)}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Potential Tax</p>
              <p className="text-2xl font-bold">{formatCurrency(totalTaxLiability)}</p>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
              <p className="text-2xl font-bold">{effectiveTaxRate.toFixed(2)}%</p>
            </div>
          </div>
          
          <div className="pt-4 text-xs text-muted-foreground">
            <p>Note: This is an estimate based on U.S. tax rates of 37% for short-term gains 
            (assets held &lt; 1 year) and 20% for long-term gains (assets held ≥ 1 year).</p>
            <p className="mt-1">Actual tax liability may vary based on your individual tax situation.</p>
          </div>
        </div>
      )}
    </div>
  )
} 