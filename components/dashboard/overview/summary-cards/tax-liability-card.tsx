import { EnhancedCardBase } from "./enhanced-card-base"
import { useTaxMethod } from "@/providers/tax-method-provider"
import { formatCurrency } from "@/lib/utils/utils"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  
  const methodLabel = taxMethod.toUpperCase()
  const subtitle = totalTaxLiability > 0 
    ? `${methodLabel} | ST: ${formatCurrency(shortTermLiability)} | LT: ${formatCurrency(longTermLiability)}`
    : `${methodLabel} | No unrealized gains`

  const disclaimerIcon = (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <Info className="h-4 w-4 text-bitcoin-orange" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Estimated tax liability based on current unrealized gains<br/>Consult a tax advisor for actual liability</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <EnhancedCardBase
      title="Tax Liability"
      value={formatCurrency(totalTaxLiability)}
      subtitle={subtitle}
      titleIcon={disclaimerIcon}
      className={className}
    />
  )
} 