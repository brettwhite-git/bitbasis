"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy } from "lucide-react"
import { formatBTC, formatCurrency } from "@/lib/utils/format"

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
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getBlockExplorerUrl = (hash: string) => {
    return `https://blockstream.info/tx/${hash}`
  }

  const renderBuyAccordion = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cost Basis Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Cost Basis Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Original Cost Basis:</span>
            <span className="text-white">{formatCurrency(transaction.sent_cost_basis || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Current Value:</span>
            <span className="text-white">
              {transaction.received_amount && transaction.price 
                ? formatCurrency((transaction.received_amount * transaction.price))
                : "-"
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Asset Price at Transaction:</span>
            <span className="text-white">{formatCurrency(transaction.price || 0)}</span>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Transaction Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">From:</span>
            <span className="text-white">{transaction.from_address_name || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">To:</span>
            <span className="text-white">{transaction.to_address_name || "-"}</span>
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
        </div>
      </div>

      {/* Tax Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Tax Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Taxable Event:</span>
            <span className="text-white">Yes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Holding Period:</span>
            <span className="text-white">
              {Math.floor((Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax Category:</span>
            <span className="text-white">
              {(Date.now() - new Date(transaction.date).getTime()) / (1000 * 60 * 60 * 24) >= 365 
                ? "Long Term" 
                : "Short Term"
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTransferAccordion = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Transfer Details */}
      <div className="space-y-4">
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
      <div className="space-y-4">
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
      
      {/* Notes section if comment exists */}
      {transaction.comment && (
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <h4 className="font-semibold text-white mb-2">Notes</h4>
          <p className="text-sm text-gray-300">{transaction.comment}</p>
        </div>
      )}
    </div>
  )
} 