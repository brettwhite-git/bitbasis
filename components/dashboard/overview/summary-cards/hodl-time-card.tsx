import { EnhancedCardBase } from "./enhanced-card-base"

interface HodlTimeCardProps {
  hodlTime: number
  className?: string
}

export function HodlTimeCard({ 
  hodlTime, 
  className 
}: HodlTimeCardProps) {
  return (
    <EnhancedCardBase
      title="HODL Time"
      value={`${hodlTime} days`}
      subtitle="Since Last Sell"
      className={className}
    />
  )
} 