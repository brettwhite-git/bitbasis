import { EnhancedCardBase } from "./enhanced-card-base"
import { useTaxMethod } from "@/providers/tax-method-provider"

interface TaxLiabilityCardProps {
  totalTaxLiability: number
  shortTermLiability: number
  longTermLiability: number
  className?: string
}

export function TaxLiabilityCard({ 
  totalTaxLiability,
  shortTermLiability,
  longTermLiability,
  className 
}: TaxLiabilityCardProps) {
  const { taxMethod } = useTaxMethod()
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const methodLabel = taxMethod.toUpperCase()
  const subtitle = totalTaxLiability > 0 
    ? `${methodLabel} | ST: ${formatCurrency(shortTermLiability)} | LT: ${formatCurrency(longTermLiability)}`
    : `${methodLabel} | No unrealized gains`

  return (
    <EnhancedCardBase
      title="Tax Liability"
      value={formatCurrency(totalTaxLiability)}
      subtitle={subtitle}
      className={className}
    />
  )
} 