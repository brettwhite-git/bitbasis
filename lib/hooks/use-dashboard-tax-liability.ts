"use client"

import { useMemo, useState, useEffect } from 'react'
import { useTaxMethod } from '@/providers/tax-method-provider'
import { calculateTaxLiability } from '@/lib/core/portfolio/tax-calculator'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { UnifiedTransaction } from '@/types/transactions'

// Using canonical UnifiedTransaction from types/transactions.ts

interface TaxLiabilityResult {
  shortTermLiability: number
  longTermLiability: number
  totalLiability: number
}

/**
 * Hook that calculates tax liability using the selected tax method
 * This responds to changes in the tax method selection
 * Uses the same pattern as useCostBasisCalculation for consistency
 */
export function useDashboardTaxLiability(currentPrice: number): TaxLiabilityResult {
  const { taxMethod } = useTaxMethod()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number>(0)
  
  const supabase = createClientComponentClient<Database>()

  // Get the user session (same pattern as useCostBasisCalculation)
  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log('useDashboardTaxLiability: Fetching user session')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('useDashboardTaxLiability: User authenticated:', user.id)
          setUserId(user.id)
        } else {
          console.log('useDashboardTaxLiability: No authenticated user found')
          setLoading(false)
        }
      } catch (err) {
        console.error('useDashboardTaxLiability: Error fetching session:', err)
        setLoading(false)
      }
    }

    fetchSession()
  }, [supabase])

  // Fetch transactions and price data (same pattern as useCostBasisCalculation)
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        return
      }

      try {
        setLoading(true)
        console.log('useDashboardTaxLiability: Fetching transactions and price for user:', userId)
        
        // Fetch transactions and price in parallel (exact same query as working hook)
        const [transactionsResult, priceResult] = await Promise.all([
          supabase
            .from('transactions')
            .select('id, date, type, sent_amount, sent_currency, received_amount, received_currency, fee_amount, fee_currency, price')
            .eq('user_id', userId)
            .order('date', { ascending: true }),
          supabase
            .from('spot_price')
            .select('price_usd, updated_at')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()
        ])

        if (transactionsResult.error) throw transactionsResult.error
        if (priceResult.error) throw priceResult.error

        const fetchedTransactions = transactionsResult.data || []
        if (!priceResult.data) throw new Error('No Bitcoin price available')
        
        console.log('useDashboardTaxLiability: Fetched transactions:', fetchedTransactions.length)
        console.log('useDashboardTaxLiability: Current BTC price:', priceResult.data.price_usd)
        
        // Convert partial data to UnifiedTransaction with required fields
        const unifiedTransactions: UnifiedTransaction[] = fetchedTransactions.map(tx => ({
          ...tx,
          created_at: '', // Not needed for tax calculation
          updated_at: null,
          user_id: userId,
          asset: 'BTC',
          sent_cost_basis: null,
          from_address: null,
          from_address_name: null,
          to_address: null,
          to_address_name: null,
          received_cost_basis: null,
          fee_cost_basis: null,
          realized_return: null,
          fee_realized_return: null,
          transaction_hash: null,
          comment: null,
          csv_upload_id: null
        } as UnifiedTransaction))
        
        setTransactions(unifiedTransactions)
        setCurrentBtcPrice(priceResult.data.price_usd)
      } catch (err) {
        console.error('useDashboardTaxLiability: Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, supabase])

  // Calculate tax liability when method or data changes
  return useMemo(() => {
    console.log('useDashboardTaxLiability: Calculating with:', {
      loading,
      transactionCount: transactions.length,
      currentBtcPrice,
      taxMethod,
      sampleTransaction: transactions[0]
    })

    if (loading || transactions.length === 0 || currentPrice <= 0) {
      console.log('useDashboardTaxLiability: Returning zero liability due to:', { 
        loading, 
        transactionCount: transactions.length, 
        currentPrice 
      })
      return {
        shortTermLiability: 0,
        longTermLiability: 0,
        totalLiability: 0
      }
    }

    // Filter to only buy/sell transactions for tax calculations
    const buysellTransactions = transactions.filter(tx => tx.type === 'buy' || tx.type === 'sell')
    console.log('useDashboardTaxLiability: Buy/sell transactions:', buysellTransactions.length)

    if (buysellTransactions.length === 0) {
      console.log('useDashboardTaxLiability: No buy/sell transactions found')
      return {
        shortTermLiability: 0,
        longTermLiability: 0,
        totalLiability: 0
      }
    }

    // Convert to format expected by calculateTaxLiability
    const convertedTransactions = buysellTransactions.map(tx => ({
      id: tx.id,
      user_id: userId!,
      date: tx.date,
      type: tx.type,
      asset: 'BTC',
      sent_amount: tx.sent_amount,
      sent_currency: tx.sent_currency,
      received_amount: tx.received_amount,
      received_currency: tx.received_currency,
      fee_amount: tx.fee_amount,
      fee_currency: tx.fee_currency,
      price: tx.price,
      created_at: new Date().toISOString(),
      updated_at: null,
      csv_upload_id: null,
      sent_cost_basis: null,
      from_address: null,
      from_address_name: null,
      to_address: null,
      to_address_name: null,
      received_cost_basis: null,
      fee_cost_basis: null,
      realized_return: null,
      fee_realized_return: null,
      transaction_hash: null,
      comment: null
    }))

    // Use the proper tax calculation with the selected method
    const result = calculateTaxLiability(convertedTransactions, currentPrice, taxMethod)
    console.log('useDashboardTaxLiability: Tax liability calculation result:', result)
    return result
  }, [transactions, currentPrice, currentBtcPrice, taxMethod, loading, userId])
} 