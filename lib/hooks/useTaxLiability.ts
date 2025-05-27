"use client"

import { useMemo } from 'react'
import { useTaxMethod } from '@/providers/tax-method-provider'

interface TaxLiabilityResult {
  shortTermLiability: number
  longTermLiability: number
  totalLiability: number
}

interface UseTaxLiabilityProps {
  unrealizedGain: number
  shortTermHoldings: number
  longTermHoldings: number
}

export function useTaxLiability({
  unrealizedGain,
  shortTermHoldings,
  longTermHoldings
}: UseTaxLiabilityProps): TaxLiabilityResult {
  const { taxMethod } = useTaxMethod()

  return useMemo(() => {
    if (unrealizedGain <= 0) {
      return {
        shortTermLiability: 0,
        longTermLiability: 0,
        totalLiability: 0
      }
    }

    const totalHoldings = shortTermHoldings + longTermHoldings
    if (totalHoldings <= 0) {
      return {
        shortTermLiability: 0,
        longTermLiability: 0,
        totalLiability: 0
      }
    }

    // Tax rates
    const SHORT_TERM_TAX_RATE = 0.37 // 37%
    const LONG_TERM_TAX_RATE = 0.20  // 20%

    // For different methods, we adjust the ratio slightly
    // This is a simplified approach - the real calculation would need order data
    let shortTermRatio = shortTermHoldings / totalHoldings
    let longTermRatio = longTermHoldings / totalHoldings

    // Adjust ratios based on tax method (simplified)
    switch (taxMethod) {
      case 'lifo':
        // LIFO tends to sell newer (short-term) holdings first
        shortTermRatio = Math.min(1, shortTermRatio * 1.2)
        longTermRatio = 1 - shortTermRatio
        break
      case 'hifo':
        // HIFO tends to minimize gains, so lower overall liability
        shortTermRatio = shortTermRatio * 0.8
        longTermRatio = longTermRatio * 0.8
        break
      case 'fifo':
      default:
        // FIFO uses the natural ratios
        break
    }

    const shortTermUnrealizedGain = unrealizedGain * shortTermRatio
    const longTermUnrealizedGain = unrealizedGain * longTermRatio

    const shortTermLiability = shortTermUnrealizedGain * SHORT_TERM_TAX_RATE
    const longTermLiability = longTermUnrealizedGain * LONG_TERM_TAX_RATE

    return {
      shortTermLiability,
      longTermLiability,
      totalLiability: shortTermLiability + longTermLiability
    }
  }, [unrealizedGain, shortTermHoldings, longTermHoldings, taxMethod])
} 