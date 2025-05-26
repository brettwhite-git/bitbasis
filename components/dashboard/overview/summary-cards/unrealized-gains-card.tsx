import { formatCurrency, formatPercent } from "@/lib/utils/utils"
import { EnhancedCardBase } from "./enhanced-card-base"

interface UnrealizedGainsCardProps {
  unrealizedGain: number
  unrealizedGainPercent: number
  className?: string
}

export function UnrealizedGainsCard({ 
  unrealizedGain, 
  unrealizedGainPercent, 
  className 
}: UnrealizedGainsCardProps) {
  const displayValue = (
    <span className={unrealizedGain >= 0 ? 'text-bitcoin-orange' : 'text-red-500'}>
      {unrealizedGain >= 0 ? '+' : ''}{formatCurrency(unrealizedGain)}
    </span>
  )
  
  const subtitle = `${unrealizedGainPercent >= 0 ? '+' : ''}${formatPercent(unrealizedGainPercent)} ROI`
  
  return (
    <EnhancedCardBase
      title="Unrealized Gains"
      value={displayValue}
      subtitle={subtitle}
      className={className}
    />
  )
} 