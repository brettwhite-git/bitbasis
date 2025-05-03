import { formatCurrency } from "@/lib/utils/utils"
import { SummaryCardBase } from "./summary-card-base"

interface AverageBuyPriceCardProps {
  averageBuyPrice: number
  className?: string
}

export function AverageBuyPriceCard({ 
  averageBuyPrice, 
  className 
}: AverageBuyPriceCardProps) {
  return (
    <SummaryCardBase
      title="Average Buy Price"
      value={formatCurrency(averageBuyPrice)}
      subtitle="Per Bitcoin"
      className={className}
    />
  )
} 