"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CirclePlus } from "lucide-react"

import { AddTransactionWizardProvider, useAddTransactionWizard } from './add-transaction-wizard-context'
import { TransactionTypeStep } from './steps/transaction-type-step'
import { TransactionDetailsStep } from './steps/transaction-details-step'
import { ReviewStagingStep } from './steps/review-staging-step'

interface AddTransactionWizardProps {
  onTransactionsAdded?: () => void
  triggerButton?: React.ReactNode
}

function WizardContent() {
  const { currentStep } = useAddTransactionWizard()

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return <TransactionTypeStep />
      case 'details':
        return <TransactionDetailsStep />
      case 'review':
        return <ReviewStagingStep />
      default:
        return <TransactionTypeStep />
    }
  }

  return (
    <div className="space-y-6">
      {renderStep()}
    </div>
  )
}

export function AddTransactionWizard({ onTransactionsAdded, triggerButton }: AddTransactionWizardProps) {
  const [isOpen, setIsOpen] = useState(false)

  // handleClose function not used - modal closes via other mechanisms

  const handleTransactionsAdded = () => {
    onTransactionsAdded?.()
    setIsOpen(false)
  }

  const defaultTrigger = (
    <Button 
      size="sm" 
      className="h-8 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0"
    >
      <CirclePlus className="mr-2 h-4 w-4" />
      Add Transaction
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-gray-700/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] bg-clip-text text-transparent">
            Add Bitcoin Transaction
          </DialogTitle>
        </DialogHeader>
        <AddTransactionWizardProvider onSuccess={handleTransactionsAdded}>
          <WizardContent />
        </AddTransactionWizardProvider>
      </DialogContent>
    </Dialog>
  )
} 