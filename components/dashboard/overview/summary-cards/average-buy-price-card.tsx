import { formatCurrency } from "@/lib/utils/utils"
import { EnhancedCardBase } from "./enhanced-card-base"

interface AverageBuyPriceCardProps {
  averageBuyPrice: number
  className?: string
}

export function AverageBuyPriceCard({ 
  averageBuyPrice, 
  className 
}: AverageBuyPriceCardProps) {
  return (
    <EnhancedCardBase
      title="Average Buy Price"
      value={formatCurrency(averageBuyPrice)}
      subtitle="Per Bitcoin"
      className={className}
    />
  )
} 