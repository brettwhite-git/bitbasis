import { Metadata } from "next"
import { InvestmentCalculator } from "@/components/calculator/projection-calculator/InvestmentCalculator"

export const metadata: Metadata = {
  title: "Bitcoin Calculator | BitBasis",
  description: "Calculate your Bitcoin accumulation strategy and estimate your savings journey.",
}

export default function CalculatorPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Investment Calculator</h1>
      </div>
      <InvestmentCalculator />
    </div>
  )
} 