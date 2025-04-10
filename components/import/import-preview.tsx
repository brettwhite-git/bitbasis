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

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type TransferInsert = Database['public']['Tables']['transfers']['Insert']

type ParsedTransaction = OrderInsert | TransferInsert

interface ImportPreviewProps {
  transactions: ParsedTransaction[]
  validationIssues: string[]
  originalRows: string[][]
  closeAction: () => void
}

const isOrder = (transaction: ParsedTransaction): transaction is OrderInsert => {
  return 'buy_fiat_amount' in transaction || 'sell_btc_amount' in transaction
}

const isTransfer = (transaction: ParsedTransaction): transaction is TransferInsert => {
  return 'amount_btc' in transaction
}

export function ImportPreview({ transactions, validationIssues, originalRows, closeAction }: ImportPreviewProps) {
  // Split transactions into orders and transfers
  const orders = transactions.filter(isOrder)
  const transfers = transactions.filter(isTransfer)

  // Calculate summary statistics
  const dateRange = transactions.length > 0 ? {
    start: new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
    end: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
  } : null

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
        return sum + t.received_btc_amount
      } else if (t.type === 'sell' && t.sell_btc_amount) {
        return sum - t.sell_btc_amount
      }
      return sum
    }, 0) + transfers.reduce((sum, t) => {
      if (t.type === 'deposit') {
        return sum + t.amount_btc
      } else if (t.type === 'withdrawal') {
        return sum - t.amount_btc
      }
      return sum
    }, 0)
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

  return (
    <div className="space-y-4">
      {/* Orders Preview */}
      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders Preview</CardTitle>
            <CardDescription>
              Showing first {Math.min(5, orders.length)} of {orders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>BTC Amount</TableHead>
                  <TableHead>USD Value</TableHead>
                  <TableHead>Price (USD/BTC)</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Exchange</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {formatNumber(order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount)}
                    </TableCell>
                    <TableCell>
                      {formatNumber(order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount, 2)}
                    </TableCell>
                    <TableCell>{formatNumber(order.price, 2)}</TableCell>
                    <TableCell>{formatNumber(order.service_fee, 2)}</TableCell>
                    <TableCell>{order.exchange || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transfers Preview */}
      {transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transfers Preview</CardTitle>
            <CardDescription>
              Showing first {Math.min(5, transfers.length)} of {transfers.length} transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>BTC Amount</TableHead>
                  <TableHead>Network Fee (BTC)</TableHead>
                  <TableHead>USD Value</TableHead>
                  <TableHead>Price (USD/BTC)</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.slice(0, 5).map((transfer, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatDate(transfer.date)}</TableCell>
                    <TableCell>
                      <Badge
                        className={`w-[100px] flex items-center justify-center text-white ${
                          transfer.type === "deposit" 
                            ? "bg-gray-500" 
                            : "bg-blue-500"
                        }`}
                      >
                        {getTransactionIcon(transfer.type)}
                        {transfer.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(transfer.amount_btc)}</TableCell>
                    <TableCell>{formatNumber(transfer.fee_amount_btc)}</TableCell>
                    <TableCell>{formatNumber(transfer.amount_fiat, 2)}</TableCell>
                    <TableCell>{formatNumber(transfer.price, 2)}</TableCell>
                    <TableCell>
                      {transfer.hash ? (
                        <span className="font-mono text-xs truncate max-w-[100px] inline-block">
                          {transfer.hash}
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>
            {dateRange ? (
              <>
                Transactions from {formatDate(dateRange.start.toISOString())} to {formatDate(dateRange.end.toISOString())}
              </>
            ) : 'No transactions to import'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm mt-2">
                <div>Orders: {stats.orders.total}</div>
                <div>Transfers: {stats.transfers.total}</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground">Total BTC</div>
              <div className="text-2xl font-bold">{formatNumber(stats.totalBtc)}</div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground">Orders</div>
              <div className="text-sm mt-2">
                <div>Buy: {stats.orders.buy}</div>
                <div>Sell: {stats.orders.sell}</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground">Transfers</div>
              <div className="text-sm mt-2">
                <div>Deposits: {stats.transfers.deposit}</div>
                <div>Withdrawals: {stats.transfers.withdrawal}</div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={closeAction}>
            Cancel
          </Button>
          <Button className="bg-bitcoin-orange hover:bg-bitcoin-orange/90">
            Confirm Import
          </Button>
        </CardFooter>
      </Card>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

const loadingDotsKeyframes = `
  @keyframes dotAnimation1 {
    0%, 100% { opacity: 0.2; }
    20% { opacity: 1; }
  }
  @keyframes dotAnimation2 {
    0%, 100% { opacity: 0.2; }
    40% { opacity: 1; }
  }
  @keyframes dotAnimation3 {
    0%, 100% { opacity: 0.2; }
    60% { opacity: 1; }
  }
`

const styleSheet = document.createElement('style')
styleSheet.textContent = loadingDotsKeyframes
document.head.appendChild(styleSheet) 