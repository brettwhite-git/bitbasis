import { formatCurrency } from "@/lib/utils/utils"
import { EnhancedCardBase } from "./enhanced-card-base"

interface CostBasisCardProps {
  totalCostBasis: number
  totalBtc: number
  className?: string
}

export function CostBasisCard({ 
  totalCostBasis, 
  totalBtc, 
  className 
}: CostBasisCardProps) {
  return (
    <EnhancedCardBase
      title="Total Cost Basis"
      value={formatCurrency(totalCostBasis)}
      subtitle={`${totalBtc.toFixed(8)} BTC acquired`}
      className={className}
    />
  )
} 