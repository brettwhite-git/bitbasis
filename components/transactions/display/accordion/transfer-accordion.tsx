"use client"

import { formatBTC, formatCurrency } from "@/lib/utils/format"
import { UnifiedTransaction } from '@/types/transactions'
import { AddressDisplay, TransactionHashDisplay } from './accordion-utils'

interface TransferAccordionProps {
  transaction: UnifiedTransaction
}

export function TransferAccordion({ transaction }: TransferAccordionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr] gap-8">
      {/* Transfer Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Transfer Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Asset Price at Transaction:</span>
            <span className="text-white">{formatCurrency(transaction.price || 0)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white">
              {(() => {
                const amount = transaction.type === 'deposit' ? transaction.received_amount : transaction.sent_amount
                return amount ? `${formatBTC(amount, 8, false)} ${transaction.asset}` : "-"
              })()}
            </span>
          </div>
          
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
        </div>
      </div>

      {/* Network Information */}
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

      {/* Tax Information - Third column */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Tax Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Taxable Event:</span>
            <span className="text-green-400">No</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax Category:</span>
            <span className="text-white">N/A (not taxable)</span>
          </div>
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
          <div className="flex justify-between">
            <span className="text-gray-400">Record Keeping:</span>
            <span className="text-white">
              {transaction.transaction_hash ? "Hash available" : "Manual record"}
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