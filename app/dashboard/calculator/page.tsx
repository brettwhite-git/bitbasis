import { Metadata } from "next"
import { InvestmentCalculator } from "@/components/calculator/projection-calculator/investment-calculator"
import { requireAuth } from "@/lib/auth/server-auth"

export const metadata: Metadata = {
  title: "Bitcoin Calculator | BitBasis",
  description: "Calculate your Bitcoin accumulation strategy and estimate your savings journey.",
}

export default async function CalculatorPage() {
  // Protect route - redirects to sign-in if not authenticated
  await requireAuth()
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Investment Calculator</h1>
      </div>
      <InvestmentCalculator />
    </div>
  )
} 