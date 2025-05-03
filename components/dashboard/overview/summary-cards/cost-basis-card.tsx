import { formatCurrency } from "@/lib/utils/utils"
import { SummaryCardBase } from "./summary-card-base"

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
    <SummaryCardBase
      title="Total Cost Basis"
      value={formatCurrency(totalCostBasis)}
      subtitle={`${totalBtc.toFixed(8)} BTC acquired`}
      className={className}
    />
  )
} 