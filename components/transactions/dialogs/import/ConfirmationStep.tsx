"use client"

import React from 'react'
import { useImport } from './ImportContext'
import { Button } from '@/components/ui/button'
import { Check, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { insertTransactions, updateCSVUploadStatus } from '@/lib/supabase/supabase'
import { useAuth } from '@/providers/supabase-auth-provider'
import { useToast } from '@/lib/hooks/use-toast'

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
  
  // Get toast functionality
  const { toast } = useToast()

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
      
      // Format orders for database insertion - we'll keep the same property names for now
      const formattedOrders = orders.map(order => {
        // Ensure user_id is set correctly
        const userId = user?.id
        
        if (!userId) {
          throw new Error('User ID is required for importing transactions')
        }
        
        // Use any type to avoid property name issues for now
        const orderAny = order as any;
        
        return {
          user_id: userId,
          type: order.type,
          asset: order.asset || 'BTC',
          date: order.date ? new Date(order.date).toISOString() : new Date().toISOString(),
          price: Number(order.price) || 0,
          
          // Buy-specific fields
          ...(order.type === 'buy' && {
            buy_fiat_amount: Number(orderAny.buy_fiat_amount || orderAny.buyFiatAmount) || 0,
            buy_currency: orderAny.buy_currency || orderAny.buyCurrency || 'USD',
            received_btc_amount: Number(orderAny.received_btc_amount || orderAny.receivedBtcAmount) || 0,
            received_currency: orderAny.received_currency || 'BTC',
          }),
          
          // Sell-specific fields
          ...(order.type === 'sell' && {
            sell_btc_amount: Number(orderAny.sell_btc_amount || orderAny.sellBtcAmount) || 0,
            sell_btc_currency: orderAny.sell_btc_currency || orderAny.sellBtcCurrency || 'BTC',
            received_fiat_amount: Number(orderAny.received_fiat_amount || orderAny.receivedFiatAmount) || 0,
            received_fiat_currency: orderAny.received_fiat_currency || orderAny.receivedFiatCurrency || 'USD',
          }),
          
          // Common fields
          service_fee: Number(orderAny.service_fee || orderAny.serviceFee) || null,
          service_fee_currency: orderAny.service_fee_currency || orderAny.serviceFeeCurrency || 'USD',
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
        
        // Use any type to avoid property name issues for now 
        const transferAny = transfer as any;
        
        return {
          user_id: userId,
          type: transfer.type,
          asset: transfer.asset || 'BTC',
          date: transfer.date ? new Date(transfer.date).toISOString() : new Date().toISOString(),
          amount_btc: Number(transferAny.amount_btc || transferAny.amountBtc) || 0,
          amount_fiat: Number(transferAny.amount_fiat || transferAny.amountFiat) || null,
          price: Number(transfer.price) || null,
          fee_amount_btc: Number(transferAny.fee_amount_btc || transferAny.feeAmountBtc) || null,
          hash: transferAny.hash || null,
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
          importedRowCount: transactions.length
        })
      }
      
      // Show toast notification directly with increased priority
      setTimeout(() => {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${transactions.length} transactions.`,
          variant: "success" as any,
        });
      }, 100);
      
      // Call the success handler with number of imported transactions
      handleImportComplete(transactions.length)
    } catch (err) {
      console.error("Import failed:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to import transactions"
      setError(errorMessage)
      
      // Show error toast
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
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
      <div className="bg-gradient-to-br from-gray-800/10 via-gray-900/20 to-gray-800/10 backdrop-blur-sm rounded-xl border border-gray-700/30 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-bitcoin-orange" />
          <h3 className="font-medium text-lg text-white">Import Summary</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <p className="text-gray-400">File</p>
            <p className="font-medium text-white">{currentFile?.name}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-400">Total Transactions</p>
            <p className="font-medium text-white">{totalCount}</p>
          </div>
          
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="space-y-2">
              <p className="text-gray-400 capitalize">{type} Transactions</p>
              <p className="font-medium text-white">{count}</p>
            </div>
          ))}
          
          {warningCount > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400">Warnings</p>
              <p className="font-medium text-yellow-400">{warningCount}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-3 gap-2">
        <CheckCircle2 className="h-8 w-8 text-bitcoin-orange" />
        <p className="text-center text-sm text-gray-300">
          Your transactions are ready to be imported.
          <br />
          Click the button below to proceed.
        </p>
      </div>
      
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0"
        >
          <Check className="mr-2 h-4 w-4" />
          Confirm Import
        </Button>
      </div>
      
      <p className="text-xs text-center text-gray-400">
        This action cannot be undone. You can delete transactions later if needed.
      </p>
    </div>
  )
} 