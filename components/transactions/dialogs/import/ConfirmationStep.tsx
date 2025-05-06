"use client"

import React from 'react'
import { useImport } from './ImportContext'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { insertTransactions, updateCSVUploadStatus } from '@/lib/supabase/supabase'
import { useAuth } from '@/providers/supabase-auth-provider'

export function ConfirmationStep() {
  const {
    parsedTransactions,
    validationIssues,
    currentFile,
    csvUploadId,
    setIsLoading,
    setLoadingState,
    setError,
    handleImportComplete
  } = useImport()
  
  // Get the current user
  const { user } = useAuth()

  const transactions = parsedTransactions || []
  const totalCount = transactions.length
  const warningCount = validationIssues.filter(issue => issue.severity === 'warning').length

  // Calculate transaction type counts
  const typeCounts = transactions.reduce((acc, tx) => {
    const type = tx.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Handle final import submission
  const handleSubmit = async () => {
    if (!transactions.length) {
      setError("No valid transactions to import")
      return
    }
    
    setIsLoading(true)
    setLoadingState('importing')
    
    try {
      // Separate the transactions into orders and transfers
      const orders = transactions.filter(tx => tx.type === 'buy' || tx.type === 'sell');
      const transfers = transactions.filter(tx => tx.type === 'withdrawal' || tx.type === 'deposit');
      
      // Debug log
      console.log('Original orders to be imported:', orders);
      console.log('Original transfers to be imported:', transfers);
      
      // Format orders for database insertion
      const formattedOrders = orders.map(order => {
        // Ensure user_id is set correctly
        const userId = user?.id
        
        if (!userId) {
          throw new Error('User ID is required for importing transactions')
        }
        
        return {
          user_id: userId,
          type: order.type,
          asset: order.asset || 'BTC',
          date: new Date(order.date).toISOString(),
          price: Number(order.price) || 0,
          
          // Buy-specific fields
          ...(order.type === 'buy' && {
            buy_fiat_amount: Number(order.buy_fiat_amount) || 0,
            buy_currency: order.buy_currency || 'USD',
            received_btc_amount: Number(order.received_btc_amount) || 0,
            received_currency: order.received_currency || 'BTC',
          }),
          
          // Sell-specific fields
          ...(order.type === 'sell' && {
            sell_btc_amount: Number(order.sell_btc_amount) || 0,
            sell_btc_currency: order.sell_btc_currency || 'BTC',
            received_fiat_amount: Number(order.received_fiat_amount) || 0,
            received_fiat_currency: order.received_fiat_currency || 'USD',
          }),
          
          // Common fields
          service_fee: Number(order.service_fee) || null,
          service_fee_currency: order.service_fee_currency || 'USD',
          exchange: order.exchange || null,
        };
      });
      
      // Format transfers for database insertion
      const formattedTransfers = transfers.map(transfer => {
        // Ensure user_id is set correctly
        const userId = user?.id
        
        if (!userId) {
          throw new Error('User ID is required for importing transactions')
        }
        
        return {
          user_id: userId,
          type: transfer.type,
          asset: transfer.asset || 'BTC',
          date: new Date(transfer.date).toISOString(),
          amount_btc: Number(transfer.amount_btc) || 0,
          amount_fiat: Number(transfer.amount_fiat) || null,
          price: Number(transfer.price) || null,
          fee_amount_btc: Number(transfer.fee_amount_btc) || null,
          hash: transfer.hash || null,
        };
      });
      
      // Debug log for formatted data
      console.log('Formatted orders for DB:', formattedOrders);
      console.log('Formatted transfers for DB:', formattedTransfers);
      
      const { data, error } = await insertTransactions({
        orders: formattedOrders,
        transfers: formattedTransfers,
        csvUploadId: csvUploadId || undefined
      })
      
      if (error) {
        console.error('Detailed error from insertTransactions:', error);
        throw error;
      }
      
      // Update the CSV upload status to 'completed'
      if (csvUploadId) {
        await updateCSVUploadStatus(csvUploadId, 'completed', {
          importedCount: transactions.length
        })
      }
      
      // Call the success handler with number of imported transactions
      handleImportComplete(transactions.length)
    } catch (err) {
      console.error("Import failed:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to import transactions"
      setError(errorMessage)
      
      // Update CSV status to error if we have an ID
      if (csvUploadId) {
        try {
          await updateCSVUploadStatus(csvUploadId, 'error', {
            errorMessage
          })
        } catch (statusError) {
          console.error("Failed to update CSV status:", statusError)
        }
      }
    } finally {
      setIsLoading(false)
      setLoadingState('idle')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-5 space-y-4 bg-background-50">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h3 className="font-medium text-lg">Import Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <p className="text-muted-foreground">File</p>
            <p className="font-medium">{currentFile?.name}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground">Total Transactions</p>
            <p className="font-medium">{totalCount}</p>
          </div>
          
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="space-y-2">
              <p className="text-muted-foreground capitalize">{type} Transactions</p>
              <p className="font-medium">{count}</p>
            </div>
          ))}
          
          {warningCount > 0 && (
            <div className="space-y-2">
              <p className="text-muted-foreground">Warnings</p>
              <p className="font-medium">{warningCount}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-3 gap-2 text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 text-primary" />
        <p className="text-center text-sm">
          Your transactions are ready to be imported.
          <br />
          Click the button below to proceed.
        </p>
      </div>
      
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={handleSubmit}
          className="w-full"
        >
          <Check className="mr-2 h-4 w-4" />
          Confirm Import
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        This action cannot be undone. You can delete transactions later if needed.
      </p>
    </div>
  )
} 