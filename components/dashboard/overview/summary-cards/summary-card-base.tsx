import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui"
import { ReactNode } from "react"

interface SummaryCardBaseProps {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  className?: string
}

export function SummaryCardBase({ title, value, subtitle, className }: SummaryCardBaseProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-bitcoin-orange">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground pt-2">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
} 