"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  ArrowUpDown, 
  Percent,
  ChevronRight,
  ChevronDown,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddTransactionWizard } from '../add-transaction-wizard-context'
import { NewTransaction } from '@/types/add-transaction'

interface TransactionGroup {
  id: 'trade' | 'transfer' | 'interest'
  title: string
  description: string
  icon: React.ComponentType<any>
  options?: { value: NewTransaction['type']; label: string }[]
  singleType?: NewTransaction['type']
}

const transactionGroups: TransactionGroup[] = [
  {
    id: 'trade',
    title: 'Trade',
    description: 'Buy or sell Bitcoin with fiat currency',
    icon: TrendingUp,
    options: [
      { value: 'buy', label: 'Buy Bitcoin' },
      { value: 'sell', label: 'Sell Bitcoin' }
    ]
  },
  {
    id: 'transfer',
    title: 'Transfer',
    description: 'Move Bitcoin between wallets or exchanges',
    icon: ArrowUpDown,
    options: [
      { value: 'deposit', label: 'Deposit (Receive)' },
      { value: 'withdrawal', label: 'Withdrawal (Send)' }
    ]
  },
  {
    id: 'interest',
    title: 'Interest',
    description: 'Record interest earned on Bitcoin holdings',
    icon: Percent,
    singleType: 'interest'
  }
]

interface TransactionGroupCardProps {
  group: TransactionGroup
  isSelected: boolean
  selectedSubType?: NewTransaction['type']
  onSelect: (groupId: string) => void
  onSubTypeSelect?: (type: NewTransaction['type']) => void
}

function TransactionGroupCard({ 
  group, 
  isSelected, 
  selectedSubType, 
  onSelect, 
  onSubTypeSelect 
}: TransactionGroupCardProps) {
  const IconComponent = group.icon

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-lg border-gray-700/30",
        "bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm",
        isSelected 
          ? "ring-2 ring-bitcoin-orange border-bitcoin-orange/50 bg-gradient-to-br from-bitcoin-orange/5 via-orange-900/10 to-bitcoin-orange/5" 
          : "hover:border-gray-600/50"
      )}
    >
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => onSelect(group.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-3 rounded-lg",
              isSelected 
                ? "bg-bitcoin-orange text-white" 
                : "bg-gray-700/50 text-gray-300"
            )}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">{group.title}</CardTitle>
              <Badge 
                variant="secondary" 
                className="text-xs mt-1 bg-gray-700/50 text-gray-300 border-gray-600"
              >
                {group.options ? `${group.options.length} TYPES` : '1 TYPE'}
              </Badge>
            </div>
          </div>
          {isSelected && (
            <div className="text-bitcoin-orange">
              <ChevronRight className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <CardDescription className="text-gray-400">
          {group.description}
        </CardDescription>
        
        {/* Show dropdown for groups with multiple options */}
        {isSelected && group.options && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Select specific type:
            </label>
            <Select 
              value={selectedSubType || ''} 
              onValueChange={(value) => onSubTypeSelect?.(value as NewTransaction['type'])}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white hover:border-bitcoin-orange focus:border-bitcoin-orange">
                <SelectValue placeholder="Choose transaction type..." />
              </SelectTrigger>
              <SelectContent>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Show confirmation for single-type groups */}
        {isSelected && group.singleType && (
          <div className="flex items-center space-x-2 text-sm text-bitcoin-orange">
            <ChevronRight className="h-4 w-4" />
            <span>Ready to configure interest transaction</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TransactionTypeStep() {
  const { transactionData, updateTransactionData, nextStep, stagedTransactions, goToStep } = useAddTransactionWizard()
  
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [selectedSubType, setSelectedSubType] = useState<NewTransaction['type'] | null>(
    transactionData.type || null
  )

  // Initialize based on existing transaction data
  React.useEffect(() => {
    if (transactionData.type) {
      if (transactionData.type === 'buy' || transactionData.type === 'sell') {
        setSelectedGroup('trade')
      } else if (transactionData.type === 'deposit' || transactionData.type === 'withdrawal') {
        setSelectedGroup('transfer')
      } else if (transactionData.type === 'interest') {
        setSelectedGroup('interest')
      }
      setSelectedSubType(transactionData.type)
    }
  }, [transactionData.type])

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId)
    
    // Auto-select single types
    const group = transactionGroups.find(g => g.id === groupId)
    if (group?.singleType) {
      setSelectedSubType(group.singleType)
      updateTransactionData({ type: group.singleType })
    } else {
      // Clear subtype for groups with multiple options
      setSelectedSubType(null)
    }
  }

  const handleSubTypeSelect = (type: NewTransaction['type']) => {
    setSelectedSubType(type)
    updateTransactionData({ type })
  }

  const handleContinue = () => {
    if (selectedSubType) {
      nextStep()
    }
  }

  const canContinue = selectedSubType !== null

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Select Transaction Type</h2>
        <p className="text-gray-400">
          Choose the category of Bitcoin transaction you want to record
        </p>
      </div>

      {/* Single column layout with 3 rows */}
      <div className="max-w-2xl mx-auto space-y-4">
        {transactionGroups.map((group) => (
          <TransactionGroupCard
            key={group.id}
            group={group}
            isSelected={selectedGroup === group.id}
            selectedSubType={selectedSubType}
            onSelect={handleGroupSelect}
            onSubTypeSelect={handleSubTypeSelect}
          />
        ))}
      </div>

      <div className="flex justify-center items-center space-x-4 pt-6">
        {/* Show staging indicator if transactions are staged */}
        {stagedTransactions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToStep('review')}
            className="bg-blue-600/20 border-blue-600/30 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200"
          >
            <Package className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {stagedTransactions.length} staged
            </span>
          </Button>
        )}
        
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0 px-8"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 