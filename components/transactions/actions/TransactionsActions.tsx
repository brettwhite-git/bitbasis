"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTransactionDialog } from "../dialogs/AddTransactionDialog"
import { TransactionFormValues } from "../dialogs/AddTransactionDialog"
import { useSubscription } from "@/hooks/use-subscription"
import { useToast } from "@/lib/hooks/use-toast"

interface TransactionsActionsProps {
  onAddTransactions?: (transactions: TransactionFormValues[]) => Promise<void>
  disabled?: boolean
}

/**
 * Component that provides actions for transactions
 */
export function TransactionsActions({
  onAddTransactions,
  disabled = false
}: TransactionsActionsProps) {
  const { subscriptionInfo, loading } = useSubscription()
  const { toast } = useToast()

  // Check if user can add transactions
  const canAddTransactions = React.useMemo(() => {
    if (loading || !subscriptionInfo) return false
    
    // Pro users can always add transactions
    if (subscriptionInfo.subscription_status === 'active' || subscriptionInfo.subscription_status === 'trialing') {
      return true
    }
    
    // Free users can add transactions if under limit
    return subscriptionInfo.can_add_transaction
  }, [subscriptionInfo, loading])

  const handleBlockedClick = () => {
    if (!subscriptionInfo) return
    
    const message = subscriptionInfo.transaction_count >= 50 
      ? `You've reached your limit of 50 transactions. Upgrade to Pro for unlimited access.`
      : 'Unable to add transactions. Please check your subscription status.'
      
    toast({
      title: "Transaction Limit Reached",
      description: message,
      variant: "destructive",
      duration: 5000,
    })
  }

  return (
    <div className="flex items-center gap-2">
      {onAddTransactions && (
        <>
          {canAddTransactions ? (
        <AddTransactionDialog 
          onSubmitTransactions={onAddTransactions}
          triggerButton={
                <Button 
                  size="sm" 
                  className="h-8 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0" 
                  disabled={disabled}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </Button>
              }
            />
          ) : (
            <Button 
              size="sm" 
              className="h-8 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0 disabled:opacity-50 disabled:bg-gray-600" 
              disabled={loading || disabled}
              onClick={handleBlockedClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          )}
        </>
      )}
    </div>
  )
} 