"use client"

import { useState, useEffect } from "react"
import { Info, Loader2, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSupabase } from "@/components/providers/supabase-provider"
import { calculateCostBasis } from "@/lib/portfolio"
import { cn } from "@/lib/utils"

type TaxMethod = "Average Cost" | "FIFO" | "LIFO"

interface TaxLiabilityCardProps {
  stLiability: number
  ltLiability: number
}

export function TaxLiabilityCard({ stLiability, ltLiability }: TaxLiabilityCardProps) {
  const { supabase } = useSupabase()
  const [method, setMethod] = useState<TaxMethod>("FIFO")
  const [loading, setLoading] = useState(false)
  const [taxLiabilities, setTaxLiabilities] = useState({
    "Average Cost": { st: stLiability, lt: ltLiability },
    "FIFO": { st: stLiability, lt: ltLiability },
    "LIFO": { st: stLiability, lt: ltLiability }
  })
  
  useEffect(() => {
    async function loadTaxData() {
      try {
        setLoading(true)
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Auth error:', userError)
          return
        }

        // Fetch necessary data for calculations
        const [priceResult, ordersResult] = await Promise.all([
          // Latest price
          supabase
            .from('spot_price')
            .select('price_usd')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single(),
          // User orders
          supabase
            .from('orders')
            .select('id, date, type, received_btc_amount, buy_fiat_amount, service_fee, service_fee_currency, sell_btc_amount, received_fiat_amount, price')
            .eq('user_id', user.id)
            .order('date', { ascending: true })
        ])
        
        if (priceResult.error || !priceResult.data) {
          console.error('Price data error:', priceResult.error)
          return
        }
        
        if (ordersResult.error) {
          console.error('Orders data error:', ordersResult.error)
          return
        }

        const currentPrice = priceResult.data.price_usd
        const orders = ordersResult.data || []

        // Calculate results for each method
        const fifo = await calculateCostBasis(user.id, 'FIFO', orders, currentPrice)
        const lifo = await calculateCostBasis(user.id, 'LIFO', orders, currentPrice)
        const average = await calculateCostBasis(user.id, 'Average Cost', orders, currentPrice)

        // Update state with the calculated values
        setTaxLiabilities({
          "Average Cost": { 
            st: average.potentialTaxLiabilityST, 
            lt: average.potentialTaxLiabilityLT 
          },
          "FIFO": { 
            st: fifo.potentialTaxLiabilityST, 
            lt: fifo.potentialTaxLiabilityLT 
          },
          "LIFO": { 
            st: lifo.potentialTaxLiabilityST, 
            lt: lifo.potentialTaxLiabilityLT 
          }
        })
      } catch (err) {
        console.error('Error loading tax data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTaxData()
  }, [supabase])

  const getCurrentTaxLiability = () => {
    return taxLiabilities[method].st + taxLiabilities[method].lt
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Tax Liability
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <Info className="h-4 w-4 text-bitcoin-orange" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Consult tax advisor for actual liability</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <div>
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as TaxMethod)}
            disabled={loading}
          >
            <SelectTrigger 
              className="w-7 h-7 px-0 py-0 justify-center rounded-full border-none bg-transparent [&>span]:hidden [&_svg]:hidden hover:bg-muted/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-bitcoin-orange" />
              ) : (
                <ChevronDown className="h-4 w-4 text-bitcoin-orange !block" />
              )}
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Average Cost">Average Cost</SelectItem>
              <SelectItem value="FIFO">FIFO</SelectItem>
              <SelectItem value="LIFO">LIFO</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-bitcoin-orange">
          {loading ? "Loading..." : formatCurrency(getCurrentTaxLiability())}
        </div>
        <p className="text-xs text-muted-foreground">
          {method} Method
        </p>
      </CardContent>
    </Card>
  )
} 