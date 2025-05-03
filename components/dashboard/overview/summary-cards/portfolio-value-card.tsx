import { formatCurrency, formatPercent } from "@/lib/utils/utils"
import { SummaryCardBase } from "./summary-card-base"

interface PortfolioValueCardProps {
  currentValue: number
  monthPercentChange: number | null
  className?: string
}

export function PortfolioValueCard({ 
  currentValue, 
  monthPercentChange, 
  className 
}: PortfolioValueCardProps) {
  const subtitle = monthPercentChange != null ? 
    `${monthPercentChange > 0 ? '+' : ''}${formatPercent(monthPercentChange)} from last month` : 
    'No monthly data'
  
  return (
    <SummaryCardBase
      title="Portfolio Value"
      value={formatCurrency(currentValue)}
      subtitle={subtitle}
      className={className}
    />
  )
} 