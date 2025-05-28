"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy } from "lucide-react"
import { formatBTC, formatCurrency } from "@/lib/utils/format"
import { useBitcoinPrice } from "@/lib/hooks/useBitcoinPrice"

interface UnifiedTransaction {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  date: string
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
  asset: string
  sent_amount: number | null
  sent_currency: string | null
  sent_cost_basis: number | null
  from_address: string | null
  from_address_name: string | null
  to_address: string | null
  to_address_name: string | null
  received_amount: number | null
  received_currency: string | null
  received_cost_basis: number | null
  fee_amount: number | null
  fee_currency: string | null
  fee_cost_basis: number | null
  realized_return: number | null
  fee_realized_return: number | null
  transaction_hash: string | null
  comment: string | null
  price: number | null
  csv_upload_id: string | null
}

interface TransactionHistoryAccordionProps {
  transaction: UnifiedTransaction
}

export function TransactionHistoryAccordion({ transaction }: TransactionHistoryAccordionProps) {
  // Get current Bitcoin price
  const { price: currentBitcoinPrice, loading: priceLoading } = useBitcoinPrice()
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getBlockExplorerUrl = (hash: string) => {
    return `https://blockstream.info/tx/${hash}`
  }

  const renderBuyAccordion = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr] gap-8">
      {/* Cost Basis Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Cost Basis Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Adjusted Cost Basis:</span>
            <span className="text-white">
              {formatCurrency(transaction.sent_amount || 0)}
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
            <span className="text-gray-400">PNL:</span>
            <span className={(() => {
              // Calculate PNL: current value - adjusted cost basis (sent_amount)
              if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount
                const pnl = currentValue - adjustedCostBasis
                return pnl >= 0 ? "text-green-400" : "text-red-400"
              }
              return "text-white"
            })()}>
              {(() => {
                if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount
                  const pnl = currentValue - adjustedCostBasis
                  return `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`
                }
                return priceLoading ? "Loading..." : "-"
              })()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gain %:</span>
            <span className={(() => {
              // Calculate Gain %: ((current value - adjusted cost basis) / adjusted cost basis) * 100
              if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                const currentValue = transaction.received_amount * currentBitcoinPrice
                const adjustedCostBasis = transaction.sent_amount
                const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                return gainPercent >= 0 ? "text-green-400" : "text-red-400"
              }
              return "text-white"
            })()}>
              {(() => {
                if (transaction.received_amount && currentBitcoinPrice && !priceLoading && transaction.sent_amount) {
                  const currentValue = transaction.received_amount * currentBitcoinPrice
                  const adjustedCostBasis = transaction.sent_amount
                  const gainPercent = ((currentValue - adjustedCostBasis) / adjustedCostBasis) * 100
                  return `${gainPercent >= 0 ? '+' : ''}${gainPercent.toFixed(2)}%`
                }
                return priceLoading ? "Loading..." : "-"
              })()}
            </span>
          </div>
        </div>
      </div>

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
                // Fiat value = sent_amount - fee_amount (net amount exchanged for BTC)
                const sentAmount = transaction.sent_amount || 0
                const feeAmount = transaction.fee_amount || 0
                const fiatValue = sentAmount - feeAmount
                return formatCurrency(fiatValue)
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
            <span className="text-white">{formatCurrency(transaction.sent_amount || 0)}</span>
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
                if (transaction.type === 'buy') {
                  // Buy: determine short/long term based on holding period
                  const days = (Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24)
                  return days >= 365 ? "Long Term Capital Gains" : "Short Term Capital Gains"
                } else if (transaction.type === 'sell') {
                  // Sell: N/A (no way of determining this yet)
                  return "N/A (lot tracking needed)"
                } else if (transaction.type === 'interest') {
                  // Interest: ordinary income
                  return "Ordinary Income"
                } else {
                  // Deposit/Withdrawal: not taxable
                  return "N/A (not taxable)"
                }
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Column - 4th column */}
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

  const renderTransferAccordion = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[2fr_2fr_2fr_1fr] gap-8">
      {/* Transfer Details */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Transfer Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Cost Basis:</span>
            <span className="text-white">
              {formatCurrency(transaction.received_cost_basis || transaction.sent_cost_basis || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Asset Price at Transaction:</span>
            <span className="text-white">{formatCurrency(transaction.price || 0)}</span>
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
        </div>
      </div>

      {/* Network Information */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Network Information</h4>
        <div className="space-y-2 text-sm">
          {transaction.transaction_hash && (
            <div className="space-y-1">
              <span className="text-gray-400">Transaction Hash:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono">
                  {transaction.transaction_hash.substring(0, 16)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.transaction_hash!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(getBlockExplorerUrl(transaction.transaction_hash!), '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          {transaction.from_address && (
            <div className="space-y-1">
              <span className="text-gray-400">From Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono">
                  {transaction.from_address.substring(0, 16)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.from_address!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          
          {transaction.to_address && (
            <div className="space-y-1">
              <span className="text-gray-400">To Address:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono">
                  {transaction.to_address.substring(0, 16)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.to_address!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Metadata - 3rd column */}
      <div className="space-y-4 p-4 rounded-lg bg-gray-800/20 border border-gray-700/20">
        <h4 className="font-semibold text-white">Transaction Metadata</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction Type:</span>
            <span className="text-white capitalize">{transaction.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Asset:</span>
            <span className="text-white">{transaction.asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date:</span>
            <span className="text-white">{new Date(transaction.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Notes Column - 4th column */}
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

  const renderAccordionContent = () => {
    switch (transaction.type) {
      case 'buy':
      case 'sell':
        return renderBuyAccordion()
      case 'deposit':
      case 'withdrawal':
      case 'interest':
        return renderTransferAccordion()
      default:
        return <div className="text-gray-400">No additional details available</div>
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/5 via-gray-900/10 to-gray-800/5 p-6 border-t border-gray-700/30">
      {renderAccordionContent()}
    </div>
  )
} 