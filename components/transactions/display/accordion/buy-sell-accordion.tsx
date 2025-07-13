"use client"

import { formatCurrency } from "@/lib/utils/format"
import { useBitcoinPrice } from "@/lib/hooks"
import { UnifiedTransaction } from '@/types/transactions'

interface BuySellAccordionProps {
  transaction: UnifiedTransaction
}

export function BuySellAccordion({ transaction }: BuySellAccordionProps) {
  // Get current Bitcoin price
  const { price: currentBitcoinPrice, loading: priceLoading } = useBitcoinPrice()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr] gap-8">
      {/* Transaction Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Transaction Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Asset Price at Transaction:</span>
            <span className="text-white">{formatCurrency(transaction.price || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fiat Value:</span>
            <span className="text-white">
              {(() => {
                // Fiat value = sent_amount (full fiat amount paid)
                const sentAmount = transaction.sent_amount || 0
                return formatCurrency(sentAmount)
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Fee Amount:</span>
            <span className="text-white">
              {transaction.fee_amount ? 
                `${formatCurrency(transaction.fee_amount)} ${transaction.fee_currency}` : 
                "-"
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Adjusted Cost Basis:</span>
            <span className="text-white">
              {(() => {
                // Adjusted cost basis = sent_amount + fee_amount (total cost to acquire BTC)
                const sentAmount = transaction.sent_amount || 0
                const feeAmount = transaction.fee_amount || 0
                const adjustedCostBasis = sentAmount + feeAmount
                return formatCurrency(adjustedCostBasis)
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Cost Basis Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Cost Basis Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Adjusted Cost Basis:</span>
            <span className="text-white">
              {(() => {
                // Adjusted cost basis = sent_amount + fee_amount (total cost to acquire BTC)
                const sentAmount = transaction.sent_amount || 0
                const feeAmount = transaction.fee_amount || 0
                const adjustedCostBasis = sentAmount + feeAmount
                return formatCurrency(adjustedCostBasis)
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Current Value:</span>
            <span className="text-white">
              {(() => {
                // Calculate current value: received BTC amount * current spot price
                if (transaction.received_amount && currentBitcoinPrice && !priceLoading) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  return formatCurrency(currentValue)
                }
                return priceLoading ? "Loading..." : "-"
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gain/Income:</span>
            <span className={(() => {
                // Calculate Gain/Income: current value - adjusted cost basis (sent_amount + fee_amount)
                if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                  const gainIncome = currentValue - adjustedCostBasis
                  return gainIncome >= 0 ? "text-green-400" : "text-red-400"
                }
                return "text-gray-500"
              })()}>
              {(() => {
                // Calculate Gain/Income: current value - adjusted cost basis (sent_amount + fee_amount)
                if (transaction.type === 'buy' && transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                  const gainIncome = currentValue - adjustedCostBasis
                  return `${gainIncome >= 0 ? '+' : ''}${formatCurrency(gainIncome)}`
                }
                return priceLoading ? "..." : "-"
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gain %:</span>
            <span className={(() => {
                // Calculate Gain %: ((current value - adjusted cost basis) / adjusted cost basis) * 100
                if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                  const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                  return gainPercent >= 0 ? "text-green-400" : "text-red-400"
                }
                return "text-white"
              })()}>
              {(() => {
                if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount + (transaction.fee_amount || 0)
                  const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                  return `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%`
                }
                return priceLoading ? "Loading..." : "-"
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Tax Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Taxable Event:</span>
            <span className={(() => {
              // Updated taxable event logic
              const isTaxable = transaction.type === 'sell' || transaction.type === 'interest'
              return isTaxable ? "text-red-400" : "text-green-400"
            })()}>
              {(() => {
                // Taxable Event Logic:
                // - Buy: No
                // - Sell: Yes 
                // - Deposit: No
                // - Withdrawal: No
                // - Interest: Yes
                const isTaxable = transaction.type === 'sell' || transaction.type === 'interest'
                return isTaxable ? "Yes" : "No"
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Holding Period:</span>
            <span className="text-white">
              {(() => {
                if (transaction.type === 'buy') {
                  // Buy: holding period = date.now - transaction.date
                  const days = Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24))
                  return `${days} days`
                } else if (transaction.type === 'sell') {
                  // Sell: N/A (no way of linking lots currently)
                  return "N/A (lot tracking needed)"
                } else if (transaction.type === 'interest') {
                  // Interest: immediate income
                  return "N/A (immediate income)"
                } else {
                  // Deposit/Withdrawal: not taxable
                  return "N/A (not taxable)"
                }
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax Category:</span>
            <span className="text-white">
              {(() => {
                const days = Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24))
                return days >= 365 ? "Long-term" : "Short-term"
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Column - Fourth column */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Notes</h4>
        <div className="text-sm">
          {transaction.comment ? (
            <p className="text-gray-300 leading-relaxed">{transaction.comment}</p>
          ) : (
            <p className="text-gray-500 italic">No notes added</p>
          )}
        </div>
      </div>
    </div>
  )
} 