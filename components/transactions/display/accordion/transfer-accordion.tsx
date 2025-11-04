"use client"

import { formatBTC, formatCurrency } from "@/lib/utils/format"
import { useBitcoinPrice } from "@/lib/hooks"
import { UnifiedTransaction } from '@/types/transactions'
import { AddressDisplay, TransactionHashDisplay } from './accordion-utils'

interface TransferAccordionProps {
  transaction: UnifiedTransaction
  // PHASE 1 OPTIMIZATION: Accept price from parent instead of fetching in component
  currentPrice?: number
  priceLoading?: boolean
}

export function TransferAccordion({ 
  transaction,
  currentPrice: propPrice,
  priceLoading: propLoading
}: TransferAccordionProps) {
  // Fallback to hook if props not provided (backward compatibility)
  const { price: hookPrice, loading: hookLoading } = useBitcoinPrice()
  const currentBitcoinPrice = propPrice ?? hookPrice
  const priceLoading = propLoading ?? hookLoading

  const isInterest = transaction.type === 'interest'
  
  // Calculate values for interest transactions
  const incomeAtReceipt = isInterest && transaction.received_amount && transaction.price
    ? transaction.received_amount * transaction.price
    : 0
  
  const currentValue = isInterest && transaction.received_amount && currentBitcoinPrice && !priceLoading
    ? transaction.received_amount * currentBitcoinPrice
    : 0
  
  const gainIncome = currentValue > 0 && incomeAtReceipt > 0
    ? currentValue - incomeAtReceipt
    : 0
  
  const gainPercent = incomeAtReceipt > 0 && currentValue > 0
    ? ((currentValue - incomeAtReceipt) / incomeAtReceipt) * 100
    : 0

  // Grid layout: 4 columns for interest (with Cost Basis Details), 4 columns for deposit/withdrawal
  const gridCols = isInterest 
    ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr]"
    : "grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr]"

  return (
    <div className={`grid ${gridCols} gap-8`}>
      {/* Interest Income Details / Transfer Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">
          {isInterest ? 'Interest Income Details' : 'Transfer Details'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">
              {isInterest ? 'BTC Price at Payout:' : 'Asset Price at Transaction:'}
            </span>
            <span className="text-white">{formatCurrency(transaction.price || 0)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white">
              {(() => {
                const amount = transaction.type === 'deposit' || transaction.type === 'interest' 
                  ? transaction.received_amount 
                  : transaction.sent_amount
                return amount ? `${formatBTC(amount, 8, false)} ${transaction.asset}` : "-"
              })()}
            </span>
          </div>
          
          {isInterest && transaction.received_amount && transaction.price && (
            <div className="flex justify-between pt-2 border-t border-gray-700/30">
              <span className="text-gray-400 font-medium">Income at Receipt:</span>
              <span className="text-white font-semibold">
                {formatCurrency(incomeAtReceipt)}
              </span>
            </div>
          )}
          
          {/* Network Fee fields - only show for deposit/withdrawal */}
          {!isInterest && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee:</span>
                <span className="text-white">
                  {transaction.fee_amount ? 
                    `${formatBTC(transaction.fee_amount, 8, false)} ${transaction.fee_currency}` : 
                    "-"
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee (Fiat):</span>
                <span className="text-white">
                  {(() => {
                    // Calculate network fee in fiat: fee_amount * asset_price
                    if (transaction.fee_amount && transaction.price) {
                      const feeInFiat = transaction.fee_amount * transaction.price
                      return formatCurrency(feeInFiat)
                    }
                    return "-"
                  })()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cost Basis Details - for interest transactions */}
      {isInterest && (
        <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
          <h4 className="font-semibold text-white">Cost Basis Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Value:</span>
              <span className={(() => {
                if (priceLoading || currentValue === 0 || incomeAtReceipt === 0) return "text-white"
                return currentValue >= incomeAtReceipt ? "text-green-400" : "text-red-400"
              })()}>
                {priceLoading ? "Loading..." : currentValue > 0 ? formatCurrency(currentValue) : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gain/Income:</span>
              <span className={gainIncome >= 0 ? "text-green-400" : "text-red-400"}>
                {priceLoading ? "..." : gainIncome !== 0 ? `${gainIncome >= 0 ? '+' : ''}${formatCurrency(gainIncome)}` : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gain %:</span>
              <span className={gainPercent >= 0 ? "text-green-400" : "text-red-400"}>
                {priceLoading ? "Loading..." : gainPercent !== 0 ? `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%` : "-"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Network Information - only show for deposit/withdrawal */}
      {!isInterest && (
        <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
          <h4 className="font-semibold text-white">Network Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* From Column */}
            <div className="space-y-2">
              <AddressDisplay 
                address={transaction.from_address}
                addressName={transaction.from_address_name}
                label="From"
              />
              
              {/* Transaction Hash under From */}
              <TransactionHashDisplay hash={transaction.transaction_hash} />
            </div>
            
            {/* To Column */}
            <div className="space-y-2">
              <AddressDisplay 
                address={transaction.to_address}
                addressName={transaction.to_address_name}
                label="To"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tax Information */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Tax Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Taxable Event:</span>
            <span className={isInterest ? "text-red-400" : "text-green-400"}>
              {isInterest ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax Category:</span>
            <span className="text-white">
              {isInterest ? "Ordinary Income" : "N/A"}
            </span>
          </div>
          {/* Cost Basis Impact - only show for deposit/withdrawal */}
          {!isInterest && (
            <div className="flex justify-between">
              <span className="text-gray-400">Cost Basis Impact:</span>
              <span className="text-white">
                {(() => {
                  if (transaction.type === 'deposit') {
                    return "None (no cost basis)"
                  } else if (transaction.type === 'withdrawal') {
                    return "Potential disposal"
                  } else {
                    return "N/A"
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes Column */}
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