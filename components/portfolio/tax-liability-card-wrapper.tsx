"use client"

import { TaxLiabilityCard } from "@/components/portfolio/tax-liability-card"
import SupabaseProvider from "@/components/providers/supabase-provider"

interface TaxLiabilityCardWrapperProps {
  stLiability: number
  ltLiability: number
}

export function TaxLiabilityCardWrapper({ stLiability, ltLiability }: TaxLiabilityCardWrapperProps) {
  return (
    <SupabaseProvider>
      <TaxLiabilityCard 
        stLiability={stLiability} 
        ltLiability={ltLiability} 
      />
    </SupabaseProvider>
  )
} 