"use client"

import React from 'react'
import { useImport } from './ImportContext'
import { useSubscription } from '@/hooks/use-subscription'
import { TransactionLimitService } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, AlertTriangle, Info, Check, CheckCircle2, XCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ValidationIssue, ParsedTransaction } from '@/components/transactions/utils/types'
import { cn } from '@/lib/utils/utils'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/providers/supabase-auth-provider'

export function PreviewStep() {
  const { 
    parsedTransactions, 
    validationIssues, 
    setStep,
    currentFile
  } = useImport()
  
  const { user } = useAuth()
  const { subscriptionInfo, loading: subscriptionLoading } = useSubscription()
  const [limitValidation, setLimitValidation] = React.useState<{
    allowed: boolean
    message: string
    loading: boolean
  }>({
    allowed: true,
    message: '',
    loading: true
  })

  // Format transactions for display
  const transactions = parsedTransactions || []
  const totalCount = transactions.length

  // Check transaction limits when component mounts or data changes
  React.useEffect(() => {
    const validateLimits = async () => {
      if (!user?.id || subscriptionLoading || !subscriptionInfo) {
        setLimitValidation({ allowed: true, message: '', loading: true })
        return
      }

      // Skip validation for Pro users
      if (subscriptionInfo.subscription_status === 'active' || subscriptionInfo.subscription_status === 'trialing') {
        setLimitValidation({ allowed: true, message: '', loading: false })
        return
      }

      try {
        const result = await TransactionLimitService.validateBulkTransactionAdd(user.id, totalCount)
        setLimitValidation({
          allowed: result.allowed,
          message: result.message,
          loading: false
        })
      } catch (error) {
        console.error('Error validating transaction limits:', error)
        setLimitValidation({
          allowed: false,
          message: 'Unable to verify transaction limits. Please try again.',
          loading: false
        })
      }
    }

    validateLimits()
  }, [user?.id, subscriptionLoading, subscriptionInfo, totalCount])

  // Calculate transaction type counts
  const typeCounts = {
    buy: transactions.filter(tx => tx.type === 'buy').length,
    sell: transactions.filter(tx => tx.type === 'sell').length,
    deposit: transactions.filter(tx => tx.type === 'deposit').length,
    withdrawal: transactions.filter(tx => tx.type === 'withdrawal').length
  }

  // Group validation issues by transaction ID
  const issuesMap = React.useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    validationIssues.forEach(issue => {
        const existing = map.get(issue.transactionId) || [];
        map.set(issue.transactionId, [...existing, issue]);
    });
    return map;
  }, [validationIssues]);

  // Get counts for summary
  const errorCount = validationIssues.filter(issue => issue.severity === 'error').length
  const warningCount = validationIssues.filter(issue => issue.severity === 'warning').length
  const hasIssues = errorCount > 0 || warningCount > 0

  // Check if continue should be disabled
  const shouldDisableContinue = transactions.length === 0 || errorCount > 0 || !limitValidation.allowed || limitValidation.loading

  // Handle continue button
  const handleContinue = () => {
    if (!shouldDisableContinue) {
    setStep('confirmation')
    }
  }

  // Render issue badge for a transaction
  const renderIssueBadge = (transactionId: string) => {
    const issues = issuesMap.get(transactionId) || []
    const hasError = issues.some(issue => issue.severity === 'error')
    const hasWarning = issues.some(issue => issue.severity === 'warning')
    
    if (hasError) {
      return (
        <Badge variant="destructive" className="flex gap-1 items-center">
          <AlertTriangle className="h-3 w-3" />
          Error
        </Badge>
      )
    }
    
    if (hasWarning) {
      return (
        <Badge variant="warning" className="flex gap-1 items-center">
          <Info className="h-3 w-3" />
          Warning
        </Badge>
      )
    }
    
    return (
      <div className="flex items-center justify-center">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      </div>
    )
  }

  // Add helper for transaction ID
  const getTransactionId = (transaction: ParsedTransaction, index: number): string => {
    return transaction.id || `tx-${index}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Preview Transactions</h3>
        <div className="text-sm text-muted-foreground">
          {totalCount} transactions from {currentFile?.name}
        </div>
      </div>
      
      {/* Transaction Limit Warning/Error */}
      {!limitValidation.loading && !limitValidation.allowed && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <h4 className="font-medium text-destructive">Import Blocked - Transaction Limit Exceeded</h4>
              <p className="text-sm text-destructive/80 mt-1">{limitValidation.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upgrade to Pro ($4.99/month) or Lifetime ($210) for unlimited transactions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Summary */}
      <div className="bg-black/40 p-3 rounded-lg">
        <div className="flex items-center">
          {/* Valid/Icon Status */}
          {!hasIssues ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-green-500 font-medium">All Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {errorCount > 0 ? (
                <Badge variant="destructive" className="flex gap-1 items-center">
                  <AlertTriangle className="h-3 w-3" />
                  {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                </Badge>
              ) : (
                <Badge variant="warning" className="flex gap-1 items-center">
                  <Info className="h-3 w-3" />
                  {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                </Badge>
              )}
            </div>
          )}
          
          <Separator orientation="vertical" className="mx-3 h-6 bg-white/20" />
          
          {/* Total count */}
          <span className="font-medium text-white text-base">
            {totalCount} Total
          </span>
          
          <Separator orientation="vertical" className="mx-3 h-6 bg-white/20" />
          
          {/* Transaction type counters */}
          <div className="flex flex-wrap items-center">
            {typeCounts.buy > 0 && (
              <>
                <span className="text-green-500 font-medium">{typeCounts.buy} BUY</span>
                {(typeCounts.sell > 0 || typeCounts.deposit > 0 || typeCounts.withdrawal > 0) && (
                  <Separator orientation="vertical" className="mx-3 h-6 bg-white/20" />
                )}
              </>
            )}
            
            {typeCounts.sell > 0 && (
              <>
                <span className="text-red-500 font-medium">{typeCounts.sell} SELL</span>
                {(typeCounts.deposit > 0 || typeCounts.withdrawal > 0) && (
                  <Separator orientation="vertical" className="mx-3 h-6 bg-white/20" />
                )}
              </>
            )}
            
            {typeCounts.deposit > 0 && (
              <>
                <span className="text-blue-500 font-medium">{typeCounts.deposit} DEPOSIT</span>
                {typeCounts.withdrawal > 0 && (
                  <Separator orientation="vertical" className="mx-3 h-6 bg-white/20" />
                )}
              </>
            )}
            
            {typeCounts.withdrawal > 0 && (
              <span className="text-orange-500 font-medium">{typeCounts.withdrawal} WITHDRAWAL</span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <ScrollArea className="h-[450px] rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/80 border-b border-primary/20">
              <TableHead className="w-24 sticky top-0 bg-muted/80 z-10 text-center font-semibold">Status</TableHead>
              <TableHead className="w-40 sticky top-0 bg-muted/80 z-10 text-center font-semibold whitespace-nowrap">Date</TableHead>
              <TableHead className="w-28 sticky top-0 bg-muted/80 z-10 text-center font-semibold">Type</TableHead>
              <TableHead className="w-32 sticky top-0 bg-muted/80 z-10 text-center font-semibold whitespace-nowrap">Amount</TableHead>
              <TableHead className="w-32 sticky top-0 bg-muted/80 z-10 text-center font-semibold whitespace-nowrap">Price</TableHead>
              <TableHead className="w-32 sticky top-0 bg-muted/80 z-10 text-center font-semibold whitespace-nowrap">Value</TableHead>
              <TableHead className="w-28 sticky top-0 bg-muted/80 z-10 text-center font-semibold whitespace-nowrap">Fee</TableHead>
              <TableHead className="w-28 sticky top-0 bg-muted/80 z-10 text-center font-semibold hidden md:table-cell whitespace-nowrap">Exchange</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => {
              const isBuy = transaction.type === 'buy'
              const isSell = transaction.type === 'sell'
              const isWithdrawal = transaction.type === 'withdrawal'
              const isDeposit = transaction.type === 'deposit'
              
              // Make sure all values are properly calculated
              let amount = ''
              let price = ''
              let value = ''
              let fee = ''
              let exchange = transaction.exchange || 'river'
              
              if (isBuy) {
                // Use only camelCase property names
                const btcAmount = transaction.receivedBtcAmount || 0;
                amount = `${btcAmount} BTC`
                price = formatCurrency(transaction.price || 0)
                value = formatCurrency(transaction.buyFiatAmount || 0)
                fee = formatCurrency(transaction.serviceFee || 0)
              } else if (isSell) {
                const btcAmount = transaction.sellBtcAmount || 0;
                amount = `${btcAmount} BTC`
                price = formatCurrency(transaction.price || 0)
                value = formatCurrency(transaction.receivedFiatAmount || 0)
                fee = formatCurrency(transaction.serviceFee || 0)
              } else if (isWithdrawal || isDeposit) {
                const btcAmount = transaction.amountBtc || 0;
                amount = `${btcAmount} BTC`
                price = formatCurrency(transaction.price || 0)
                value = formatCurrency(transaction.amountFiat || 0)
                fee = isWithdrawal ? `${transaction.feeAmountBtc || 0} BTC` : formatCurrency(0)
              }
              
              // Default to $0.00 if value is empty or undefined
              if (!value || value === '$NaN' || value === '$undefined') {
                value = formatCurrency(0)
              }
              
              if (!fee || fee === '$NaN' || fee === '$undefined') {
                fee = formatCurrency(0)
              }
              
              // Get transaction ID and issues
              const txId = getTransactionId(transaction, index);
              const rowIssues = issuesMap.get(txId) || [];
              const hasError = rowIssues.some(i => i.severity === 'error');
              const hasWarning = rowIssues.some(i => i.severity === 'warning');
              
              return (
                <TableRow 
                  key={`tx-${txId || index}`}
                  className={cn(
                    "border-b border-muted/20",
                    hasError ? 'bg-destructive/10 hover:bg-destructive/20' : '',
                    !hasError && hasWarning ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : ''
                  )}
                >
                  <TableCell className="text-center py-2">
                    {renderIssueBadge(txId)}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-2">{formatDate(transaction.date)}</TableCell>
                  <TableCell className={cn(
                    "font-medium text-center uppercase whitespace-nowrap py-2",
                    isBuy ? "text-green-500" : "",
                    isSell ? "text-red-500" : "",
                    isDeposit ? "text-blue-500" : "",
                    isWithdrawal ? "text-orange-500" : ""
                  )}>
                    {transaction.type.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap py-2">{amount}</TableCell>
                  <TableCell className="text-center whitespace-nowrap py-2">{price}</TableCell>
                  <TableCell className="text-center whitespace-nowrap py-2">{value}</TableCell>
                  <TableCell className="text-center whitespace-nowrap py-2">{fee}</TableCell>
                  <TableCell className="text-center hidden md:table-cell whitespace-nowrap py-2">{exchange}</TableCell>
                </TableRow>
              )
            })}
            
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No transactions to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {/* Continue Button */}
      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleContinue} 
          className="flex items-center gap-2 px-6"
          disabled={shouldDisableContinue}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Error notices */}
      {errorCount > 0 && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive mt-2">
          Please fix all errors before continuing. You may need to edit your CSV file and upload again.
        </div>
      )}
      
      {!limitValidation.loading && !limitValidation.allowed && (
        <div className="bg-destructive/10 p-3 rounded-md text-sm text-destructive mt-2">
          Cannot import: This would exceed your transaction limit. Please upgrade your plan to continue.
        </div>
      )}
    </div>
  )
} 