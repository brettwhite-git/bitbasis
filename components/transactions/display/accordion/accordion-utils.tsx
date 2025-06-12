"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Copy } from "lucide-react"

// Shared utility functions for accordion components
export const accordionUtils = {
  copyToClipboard: (text: string) => {
    navigator.clipboard.writeText(text)
  },

  getBlockExplorerUrl: (hash: string) => {
    return `https://mempool.space/tx/${hash}`
  },

  getAddressExplorerUrl: (address: string) => {
    return `https://mempool.space/address/${address}`
  },

  // Utility function to truncate hash/address with first few chars...last few chars format
  truncateHashOrAddress: (value: string, startChars: number = 8, endChars: number = 8) => {
    if (value.length <= startChars + endChars) return value
    return `${value.substring(0, startChars)}...${value.substring(value.length - endChars)}`
  }
}

// Shared address display component
interface AddressDisplayProps {
  address: string | null
  addressName?: string | null
  label: string
}

export function AddressDisplay({ address, addressName, label }: AddressDisplayProps) {
  if (!address) {
    return (
      <div className="space-y-1">
        <span className="text-gray-400">{label}:</span>
        <span className="text-gray-500 text-xs">No address available</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <span className="text-gray-400">{label}:</span>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono">
          {accordionUtils.truncateHashOrAddress(address)}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => accordionUtils.copyToClipboard(address)}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => window.open(accordionUtils.getAddressExplorerUrl(address), '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      {addressName && (
        <div className="text-xs text-gray-500 ml-1">
          {addressName}
        </div>
      )}
    </div>
  )
}

// Shared transaction hash display component
interface TransactionHashDisplayProps {
  hash: string | null
}

export function TransactionHashDisplay({ hash }: TransactionHashDisplayProps) {
  if (!hash) return null

  return (
    <div className="space-y-1 pt-2 border-t border-gray-700/30">
      <span className="text-gray-400">Transaction Hash:</span>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-gray-800 px-2 py-1 rounded font-mono">
          {accordionUtils.truncateHashOrAddress(hash)}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => accordionUtils.copyToClipboard(hash)}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => window.open(accordionUtils.getBlockExplorerUrl(hash), '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
} 