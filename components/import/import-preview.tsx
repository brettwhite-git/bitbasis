"use client"

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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  SendHorizontal, 
  Download,
  X,
  Loader2
} from "lucide-react"
import type { Database } from '@/types/supabase'
import { Button } from "@/components/ui/button"
import { insertTransactions } from '@/lib/supabase'
import { 
  uploadCSVFile, 
  updateCSVUploadStatus 
} from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type TransferInsert = Database['public']['Tables']['transfers']['Insert']

type ParsedTransaction = OrderInsert | TransferInsert

// Add type guards
function isOrder(transaction: ParsedTransaction): transaction is OrderInsert {
  return (transaction as OrderInsert).type === 'buy' || (transaction as OrderInsert).type === 'sell';
}

function isTransfer(transaction: ParsedTransaction): transaction is TransferInsert {
  return (transaction as TransferInsert).type === 'withdrawal' || (transaction as TransferInsert).type === 'deposit';
}

interface ValidationIssue {
  row: number;
  field: string;
  issue: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

type SerializableImportPreviewProps = {
  transactions: ParsedTransaction[]
  validationIssues: ValidationIssue[]
  originalRows: any[]
  file: File | null
}

// Add utility function for capitalizing exchange names
function capitalizeExchange(exchange: string | null): string {
  if (!exchange) return '-';
  return exchange.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function ImportPreview({ 
  transactions, 
  validationIssues, 
  originalRows,
  file
}: SerializableImportPreviewProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Update the orders and transfers filtering with type assertions
  const orders = transactions.filter((t): t is OrderInsert => isOrder(t));
  const transfers = transactions.filter((t): t is TransferInsert => isTransfer(t));

  // Calculate summary statistics
  const dateRange = transactions.length > 0 ? {
    start: new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
    end: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
  } : null

  // Update the stats calculation to handle types properly
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
    totalBtc: orders.reduce((sum, t) => {
      if (t.type === 'buy' && t.received_btc_amount) {
        return sum + t.received_btc_amount;
      } else if (t.type === 'sell' && t.sell_btc_amount) {
        return sum - t.sell_btc_amount;
      }
      return sum;
    }, 0) + transfers.reduce((sum, t) => {
      return sum + (t.type === 'deposit' ? t.amount_btc : -t.amount_btc);
    }, 0)
  };

  const handleImport = async () => {
    if (!file) {
      setImportError('No file available for upload.')
      return
    }

    setIsImporting(true)
    setImportError(null)
    setImportSuccess(false)
    setIsSuccessDialogOpen(false)
    
    let currentCsvUploadId: string | null = null

    try {
      const { data: csvUpload, error: uploadError } = await uploadCSVFile(file)
      if (uploadError || !csvUpload?.id) {
        throw uploadError || new Error('Failed to upload file and create record.')
      }
      currentCsvUploadId = csvUpload.id

      const { error: statusUpdateError } = await updateCSVUploadStatus(
        currentCsvUploadId,
        'processing',
        { rowCount: originalRows.length }
      )
      if (statusUpdateError) {
        console.error('Failed to update status to processing:', statusUpdateError)
        throw new Error('Failed to update upload status after uploading.')
      }

      const processedOrders = orders.map(order => {
        const baseOrder = {
          type: order.type,
          date: order.date,
          asset: 'BTC',
          price: order.price,
          exchange: order.exchange ? capitalizeExchange(order.exchange) : null,
          service_fee: order.service_fee,
          service_fee_currency: 'USD',
          user_id: order.user_id
        };

        if (order.type === 'buy') {
          return {
            ...baseOrder,
            buy_fiat_amount: order.buy_fiat_amount,
            buy_currency: 'USD',
            received_btc_amount: order.received_btc_amount,
            received_currency: 'BTC',
          };
        } else { // sell
          return {
            ...baseOrder,
            sell_btc_amount: order.sell_btc_amount,
            sell_btc_currency: 'BTC',
            received_fiat_amount: order.received_fiat_amount,
            received_fiat_currency: 'USD',
          };
        }
      });

      const processedTransfers = transfers.map(transfer => ({
        type: transfer.type,
        date: transfer.date,
        asset: 'BTC',
        amount_btc: Math.abs(transfer.amount_btc),
        fee_amount_btc: transfer.fee_amount_btc ? Math.abs(transfer.fee_amount_btc) : null,
        amount_fiat: transfer.amount_fiat,
        price: transfer.price,
        hash: transfer.hash,
        user_id: transfer.user_id
      }));

      console.log('Processed orders:', processedOrders);
      const result = await insertTransactions({
        orders: processedOrders,
        transfers: processedTransfers,
        csvUploadId: currentCsvUploadId
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to import transactions')
      }

      const importedOrdersCount = result.data?.orders?.length || 0
      const importedTransfersCount = result.data?.transfers?.length || 0
      
      await updateCSVUploadStatus(currentCsvUploadId, 'completed', { 
          importedRowCount: importedOrdersCount + importedTransfersCount 
      });

      setSuccessMessage(`Successfully imported ${importedOrdersCount} orders and ${importedTransfersCount} transfers from your CSV.`);
      setIsSuccessDialogOpen(true); 
      setImportSuccess(true);

    } catch (err) {
      console.error('Import process error:', err)
      setImportError(err instanceof Error ? err.message : 'Failed to import transactions')
      if (currentCsvUploadId) {
        try {
          await updateCSVUploadStatus(currentCsvUploadId, 'error', {
            errorMessage: err instanceof Error ? err.message : 'Import process failed'
          });
        } catch (statusError) {
          console.error('Failed to update status to error after import failure:', statusError)
        }
      }
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancel = () => {
    window.location.href = '/dashboard/import';
  }

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
        return <ArrowDownRight className="mr-1 h-3 w-3" />
      case 'sell':
        return <ArrowUpRight className="mr-1 h-3 w-3" />
      case 'deposit':
        return <SendHorizontal className="mr-1 h-3 w-3" />
      case 'withdrawal':
        return <SendHorizontal className="mr-1 h-3 w-3 rotate-180" />
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatNumber = (num: number | null | undefined, decimals: number = 8) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const formatCurrency = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  return (
    <div className="space-y-4">
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="bg-green-100/80 backdrop-blur-sm border border-green-200 shadow-xl max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-green-800 mb-2">Success!</DialogTitle>
            <DialogDescription className="text-green-700 mb-8 text-base">
              {successMessage}
            </DialogDescription>
            <Button 
              onClick={() => {
                  setIsSuccessDialogOpen(false); 
                  window.location.href = '/dashboard/import';
              }}
              className="bg-green-500/90 hover:bg-green-600 text-white w-32 shadow-sm transition-all duration-200"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
          
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-medium">Import Summary</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Transactions from {formatDate(dateRange?.start.toISOString() || '')} to {formatDate(dateRange?.end.toISOString() || '')}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-bitcoin-orange">
                Processing Import<span className="inline-flex">
                  <span className="animate-dot1 text-lg leading-none text-bitcoin-orange">.</span>
                  <span className="animate-dot2 text-lg leading-none text-bitcoin-orange">.</span>
                  <span className="animate-dot3 text-lg leading-none text-bitcoin-orange">.</span>
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {originalRows.length} rows
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Total Transactions */}
            <div className="bg-card/50 p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Total Transactions</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-2">
              </div>
            </div>

            {/* Total BTC */}
            <div className="bg-card/50 p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Total BTC</div>
              <div className="text-2xl font-bold">{formatNumber(stats.totalBtc, 8)}</div>
            </div>

            {/* Orders */}
            <div className="bg-card/50 p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Orders</div>
              <div className="text-sm">
                Buy: {stats.orders.buy}
                <br />
                Sell: {stats.orders.sell}
              </div>
            </div>

            {/* Transfers */}
            <div className="bg-card/50 p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">Transfers</div>
              <div className="text-sm">
                Deposits: {stats.transfers.deposit}
                <br />
                Withdrawals: {stats.transfers.withdrawal}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full flex flex-col items-center gap-4">
            <div className="flex justify-center gap-4">
              <Button 
                className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 w-32"
                onClick={handleImport}
                disabled={isImporting || importSuccess || validationIssues.length > 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : importSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Success! 
                  </>
                ) : (
                  'Confirm Import'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="w-32"
                disabled={isImporting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders Preview</CardTitle>
            <CardDescription>
              Showing first {Math.min(5, orders.length)} of {orders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">BTC Amount</TableHead>
                  <TableHead className="text-center">Amount (USD)</TableHead>
                  <TableHead className="text-center">Price (USD/BTC)</TableHead>
                  <TableHead className="text-center">Fees (USD)</TableHead>
                  <TableHead className="text-center">Exchange</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center">{formatDate(order.date)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge
                          className={`w-[100px] flex items-center justify-center text-white ${
                            order.type === "buy" 
                              ? "bg-bitcoin-orange" 
                              : "bg-red-500"
                          }`}
                        >
                          {getTransactionIcon(order.type)}
                          {order.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatNumber(order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount, 8)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount)}
                    </TableCell>
                    <TableCell className="text-center">{formatCurrency(order.price)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(order.service_fee)}</TableCell>
                    <TableCell className="text-center">{capitalizeExchange(order.exchange ?? null)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfers Preview</CardTitle>
            <CardDescription>
              Showing first {Math.min(5, transfers.length)} of {transfers.length} transfers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">BTC Amount</TableHead>
                  <TableHead className="text-center">Network Fee (BTC)</TableHead>
                  <TableHead className="text-center">Amount (USD)</TableHead>
                  <TableHead className="text-center">Price (USD/BTC)</TableHead>
                  <TableHead className="text-center">Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.slice(0, 5).map((transfer, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center">{formatDate(transfer.date)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge
                          className="w-[100px] flex items-center justify-center text-white bg-blue-500"
                        >
                          {getTransactionIcon(transfer.type)}
                          {transfer.type.toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{formatNumber(transfer.amount_btc, 8)}</TableCell>
                    <TableCell className="text-center">{formatNumber(transfer.fee_amount_btc, 8)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(transfer.amount_fiat)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(transfer.price)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-xs truncate max-w-[100px] inline-block">
                        {transfer.hash}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {validationIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationIssues.map((issue, i) => (
                <li key={i} className="mb-2">
                  <span className="font-semibold">Row {issue.row}:</span> {issue.issue}
                  {issue.suggestion && (
                    <div className="ml-4 text-sm text-muted-foreground">
                      Suggestion: {issue.suggestion}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {importError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

const loadingDotsKeyframes = `
  @keyframes dotAnimation1 {
    0%, 100% { opacity: 0.2; }
    20% { opacity: 1; color: rgb(var(--bitcoin-orange)); }
  }
  @keyframes dotAnimation2 {
    0%, 100% { opacity: 0.2; }
    40% { opacity: 1; color: rgb(var(--bitcoin-orange)); }
  }
  @keyframes dotAnimation3 {
    0%, 100% { opacity: 0.2; }
    60% { opacity: 1; color: rgb(var(--bitcoin-orange)); }
  }
`

const styleSheet = document.createElement('style')
styleSheet.textContent = loadingDotsKeyframes
if (!document.head.querySelector('#loading-dots-style')) {
  styleSheet.id = 'loading-dots-style'
  document.head.appendChild(styleSheet)
} 