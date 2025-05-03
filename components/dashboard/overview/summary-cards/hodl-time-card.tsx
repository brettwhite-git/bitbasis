import { SummaryCardBase } from "./summary-card-base"

interface HodlTimeCardProps {
  hodlTime: number
  className?: string
}

export function HodlTimeCard({ 
  hodlTime, 
  className 
}: HodlTimeCardProps) {
  return (
    <SummaryCardBase
      title="HODL Time"
      value={`${hodlTime} days`}
      subtitle="Weighted Average"
      className={className}
    />
  )
} 