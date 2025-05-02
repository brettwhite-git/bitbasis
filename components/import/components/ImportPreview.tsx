"use client"

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { 
  CheckCircle2, 
  AlertCircle,
  CircleArrowRight,
  CircleArrowLeft,
  CircleArrowDown,
  CircleArrowUp,
  ExternalLink,
  X,
  Loader2
} from "lucide-react"
import type { Database } from '@/types/supabase'
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// Import necessary types from the central types file
import { 
    ParsedTransaction, 
    ValidationIssue, 
    ParsedOrder, 
    ParsedTransfer 
} from '../lib/types'

// Import necessary utility functions
import { formatNumber, formatCurrency } from '../lib/utils'

// Type guards remain the same
function isOrder(transaction: ParsedTransaction): transaction is ParsedOrder {
    return transaction.type === 'buy' || transaction.type === 'sell';
}

function isTransfer(transaction: ParsedTransaction): transaction is ParsedTransfer {
    return transaction.type === 'deposit' || transaction.type === 'withdrawal';
}

// Define NEW props for the adapted component
interface ImportPreviewProps {
  transactions: ParsedTransaction[];
  validationIssues: ValidationIssue[];
  isLoading: boolean; // For disabling confirm button during container import
  source: 'csv' | 'manual'; // To potentially adjust display/logic
  onCancel: () => void; // Callback for cancelling
  onConfirmImport: () => void; // Callback to trigger import in container
}

// Utility functions (capitalizeExchange, isShortTerm) remain the same...
function capitalizeExchange(exchange: string | null | undefined): string {
  if (!exchange) return '-';
  return exchange.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isShortTerm(date: string | Date): boolean {
    const transactionDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    // Return true if the transaction date is AFTER one year ago (less than 1 year hold)
    return transactionDate > oneYearAgo;
}

// Unified display type remains useful
interface UnifiedDisplayTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'withdrawal' | 'deposit';
  asset: string;
  btc_amount: number | null;
  usd_value: number | null;
  fee_usd: number | null;
  price_at_tx: number | null;
  exchange: string | null;
  network_fee_btc: number | null;
  txid: string | null;
  originalId: string; // Add original ID for linking validation issues
}

export function ImportPreview({ 
  transactions, 
  validationIssues, 
  isLoading, // Use new prop
  source, // Use new prop
  onCancel, // Use new prop
  onConfirmImport // Use new prop
}: ImportPreviewProps) { // Use new props interface
  
  // Convert validation issues into a map for quick lookup by transaction ID
  const issuesMap = React.useMemo(() => {
      const map = new Map<string, ValidationIssue[]>();
      validationIssues.forEach(issue => {
          const existing = map.get(issue.transactionId) || [];
          map.set(issue.transactionId, [...existing, issue]);
      });
      return map;
  }, [validationIssues]);

  // Filter and map transactions (logic largely remains)
  const orders = transactions.filter(isOrder);
  const transfers = transactions.filter(isTransfer);

  const unifiedTransactions: UnifiedDisplayTransaction[] = [
    ...orders.map((order) => ({
      id: `order-preview-${order.id}`, // Use original ID here or in mapping
      originalId: order.id, // Keep track of original ID
      date: order.date ? format(new Date(order.date), 'yyyy-MM-dd HH:mm:ss') : 'Invalid Date',
      type: order.type,
      asset: order.asset ?? 'BTC',
      btc_amount: (order.type === 'buy' ? order.receivedBtcAmount : order.sellBtcAmount) ?? null,
      usd_value: (order.type === 'buy' ? order.buyFiatAmount : order.receivedFiatAmount) ?? null,
      fee_usd: order.serviceFee ?? null,
      price_at_tx: order.price ?? null,
      exchange: capitalizeExchange(order.exchange),
      network_fee_btc: null,
      txid: null,
    })),
    ...transfers.map((transfer) => ({
      id: `transfer-preview-${transfer.id}`,
      originalId: transfer.id,
      date: transfer.date ? format(new Date(transfer.date), 'yyyy-MM-dd HH:mm:ss') : 'Invalid Date',
      type: transfer.type,
      asset: 'BTC', // Assuming always BTC for transfers
      btc_amount: transfer.amountBtc ?? null,
      usd_value: transfer.amountFiat ?? null,
      fee_usd: (transfer.feeAmountBtc && transfer.price ? transfer.feeAmountBtc * transfer.price : null),
      price_at_tx: transfer.price ?? null,
      exchange: null,
      network_fee_btc: transfer.feeAmountBtc ?? null,
      txid: transfer.hash ?? null,
    }))
  ];

  // Sort by date descending (logic remains)
  unifiedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate summary statistics (logic remains, ensure types match)
  const dateRange = transactions.length > 0 && transactions.every(t => t.date) ? {
      start: new Date(Math.min(...transactions.map(t => new Date(t.date!).getTime()))),
      end: new Date(Math.max(...transactions.map(t => new Date(t.date!).getTime())))
  } : null;

  const stats = {
      total: transactions.length,
      orders: {
          total: orders.length,
          buy: orders.filter(t => t.type === 'buy').length,
          sell: orders.filter(t => t.type === 'sell').length,
      },
      transfers: {
          total: transfers.length,
          deposit: transfers.filter(t => t.type === 'deposit').length,
          withdrawal: transfers.filter(t => t.type === 'withdrawal').length,
      },
      // Ensure amounts are numbers before summing
      totalBtc: orders.reduce((sum, t) => {
          if (t.type === 'buy') return sum + (Number(t.receivedBtcAmount) || 0);
          if (t.type === 'sell') return sum - (Number(t.sellBtcAmount) || 0);
          return sum;
      }, 0) // Initial value should be 0
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'buy': return <CircleArrowRight className="h-4 w-4 text-green-500" />;
        case 'sell': return <CircleArrowLeft className="h-4 w-4 text-red-500" />;
        case 'deposit': return <CircleArrowDown className="h-4 w-4 text-blue-500" />;
        case 'withdrawal': return <CircleArrowUp className="h-4 w-4 text-orange-500" />;
        default: return null;
    }
  };

  const getTransactionTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
        case 'buy': return "text-green-600 dark:text-green-400";
        case 'sell': return "text-red-600 dark:text-red-400";
        case 'deposit': return "text-blue-600 dark:text-blue-400";
        case 'withdrawal': return "text-orange-600 dark:text-orange-400";
        default: return "";
    }
  };

  return (
    <Card className="mt-6 border-primary/30">
      <CardHeader>
        <CardTitle>Import Preview ({source === 'csv' ? 'CSV' : 'Manual'} Data)</CardTitle>
        <CardDescription>
          Review your transactions below before importing. Found {stats.total} potential transactions.
          ({stats.orders.buy} Buys, {stats.orders.sell} Sells, {stats.transfers.deposit} Deposits, {stats.transfers.withdrawal} Withdrawals)
          {dateRange && ` spanning from ${format(dateRange.start, 'PP')} to ${format(dateRange.end, 'PP')}.`}
        </CardDescription>
        {/* Display high-level warnings/errors if any exist */}
         {validationIssues.some(issue => issue.severity === 'error') && (
             <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Errors Found</AlertTitle>
                 <AlertDescription>
                     Please review the errors highlighted below. Transactions with errors cannot be imported.
                 </AlertDescription>
             </Alert>
         )}
          {validationIssues.some(issue => issue.severity === 'warning') && !validationIssues.some(issue => issue.severity === 'error') && (
             <Alert variant="default" className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/60 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-500">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Warnings Found</AlertTitle>
                 <AlertDescription>
                      Review warnings below. Transactions can still be imported, but data might be incomplete.
                 </AlertDescription>
             </Alert>
         )}
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto relative">
             <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                         <TableHead className="w-[150px]">Date</TableHead>
                         <TableHead>Type</TableHead>
                         <TableHead>Asset</TableHead>
                         <TableHead className="text-right">BTC Amount</TableHead>
                         <TableHead className="text-right">USD Value</TableHead>
                         <TableHead className="text-right hidden md:table-cell">Price</TableHead>
                         <TableHead className="text-right hidden md:table-cell">Fee (USD)</TableHead>
                         <TableHead className="hidden lg:table-cell">Exchange</TableHead>
                         <TableHead className="text-right hidden lg:table-cell">Fee (BTC)</TableHead>
                         <TableHead className="hidden lg:table-cell">TX Hash</TableHead>
                         <TableHead className="text-center">Issues</TableHead> 
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {unifiedTransactions.map((tx) => {
                         const rowIssues = issuesMap.get(tx.originalId) || [];
                         const hasError = rowIssues.some(i => i.severity === 'error');
                         const hasWarning = rowIssues.some(i => i.severity === 'warning');
                        return (
                            <TableRow 
                                key={tx.id} 
                                className={cn(
                                    hasError ? 'bg-destructive/10 hover:bg-destructive/20' : '',
                                    !hasError && hasWarning ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : ''
                                )}
                            >
                                <TableCell className="whitespace-nowrap">
                                     {rowIssues.length > 0 && (
                                        <div className="text-xs space-y-0.5">
                                             {rowIssues.map((issue, idx) => (
                                                <p key={idx} className={cn(issue.severity === 'error' ? 'text-destructive' : 'text-yellow-600')}>
                                                     <span className="font-semibold">{issue.field}:</span> {issue.message}
                                                 </p>
                                             ))}
                                         </div>
                                     )}
                                     {tx.date}
                                 </TableCell>
                                <TableCell>
                                     <span className={cn("font-medium", getTransactionTypeStyles(tx.type))}>{tx.type.toUpperCase()}</span>
                                 </TableCell>
                                 <TableCell>{tx.asset}</TableCell>
                                 <TableCell className="text-right font-mono">{formatNumber(tx.btc_amount)}</TableCell>
                                 <TableCell className="text-right font-mono">{formatCurrency(tx.usd_value)}</TableCell>
                                 <TableCell className="text-right font-mono hidden md:table-cell">{formatCurrency(tx.price_at_tx)}</TableCell>
                                 <TableCell className="text-right font-mono hidden md:table-cell">{formatCurrency(tx.fee_usd)}</TableCell>
                                 <TableCell className="hidden lg:table-cell">{tx.exchange}</TableCell>
                                 <TableCell className="text-right font-mono hidden lg:table-cell">{formatNumber(tx.network_fee_btc)}</TableCell>
                                 <TableCell className="hidden lg:table-cell truncate max-w-[100px]">{tx.txid ?? '-'}</TableCell>
                                 <TableCell className="text-center">
                                      {rowIssues.length > 0 ? (
                                          <Badge variant={hasError ? "destructive" : "default"} className={cn(!hasError && hasWarning ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "")}>
                                              {rowIssues.length} {hasError ? 'Error(s)' : 'Warning(s)'}
                                          </Badge>
                                      ) : (
                                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                      )}
                                  </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
             </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
        </Button>
        <Button 
            onClick={onConfirmImport} 
            disabled={isLoading || validationIssues.some(issue => issue.severity === 'error')}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLoading ? 'Importing...' : 'Confirm and Import'}
        </Button>
      </CardFooter>
    </Card>
  );
} 