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
  CardTitle
} from "@/components/ui/card"
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  SendHorizontal, 
  Download,
  X
} from "lucide-react"
import type { Database } from '@/types/supabase'

type DbTransaction = Database['public']['Tables']['transactions']['Insert']

interface ParsedTransaction {
  date: string
  type: 'buy' | 'sell'
  asset: string
  price: number
  exchange: string | null
  buy_fiat_amount: number | null
  buy_currency: string | null
  buy_btc_amount: number | null
  received_btc_amount: number | null
  received_currency: string | null
  sell_btc_amount: number | null
  sell_btc_currency: string | null
  received_fiat_amount: number | null
  received_fiat_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
}

interface ValidationIssue {
  row: number
  field: string
  issue: string
  suggestion?: string
  severity: 'error' | 'warning'
}

interface ImportPreviewProps {
  transactions: ParsedTransaction[]
  validationIssues: ValidationIssue[]
  originalRows: any[]
  closeAction: () => void
}

export function ImportPreview({ transactions, validationIssues, originalRows, closeAction }: ImportPreviewProps) {
  // Calculate summary statistics
  const dateRange = transactions.length > 0 ? {
    start: new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
    end: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
  } : null

  const stats = {
    total: transactions.length,
    validRows: transactions.length,
    totalBtc: transactions.reduce((sum, t) => {
      const type = t.type.toLowerCase();
      if (type === 'buy') {
        // Only add received BTC from buy transactions
        return sum + (t.received_btc_amount || 0);
      }
      // Ignore sell transactions for this specific sum
      return sum;
    }, 0),
    types: {
      buy: transactions.filter(t => t.type.toLowerCase() === 'buy').length,
      sell: transactions.filter(t => t.type.toLowerCase() === 'sell').length
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Buy':
        return <ArrowDownRight className="mr-1 h-3 w-3" />
      case 'Sell':
        return <ArrowUpRight className="mr-1 h-3 w-3" />
      case 'Send':
      case 'Receive':
        return <SendHorizontal className="mr-1 h-3 w-3" />
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

  const formatNumber = (num: number, decimals: number = 8) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const getAmount = (t: ParsedTransaction) => {
    if (t.type === 'buy') {
      return t.received_btc_amount ?? 0
    }
    return t.sell_btc_amount ?? 0
  }

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount)
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTotalFees = (transaction: ParsedTransaction) => {
    const networkFee = transaction.network_fee ?? 0
    const serviceFee = transaction.service_fee ?? 0
    return networkFee + serviceFee
  }

  const getTotal = (transaction: ParsedTransaction) => {
    if (transaction.type === 'buy') {
      return transaction.buy_fiat_amount ?? 0
    } else if (transaction.type === 'sell') {
      return transaction.received_fiat_amount ?? 0
    }
    return 0
  }

  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {validationIssues.filter(i => i.severity === 'error').length > 0 
                ? `${transactions.length} valid, ${validationIssues.filter(i => i.severity === 'error').length} with issues`
                : 'All transactions valid'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total BTC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalBtc)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div>Buy: {stats.types.buy}</div>
              <div>Sell: {stats.types.sell}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            {dateRange ? (
              <div className="text-sm">
                From {formatDate(dateRange.start.toISOString())} to {formatDate(dateRange.end.toISOString())}
              </div>
            ) : (
              <div className="text-sm">No transactions</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Preview</CardTitle>
          <CardDescription>
            Showing first {Math.min(5, transactions.length)} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>BTC Amount</TableHead>
                <TableHead>Fiat Amount</TableHead>
                <TableHead>Price (USD/BTC)</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Exchange</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction, index) => {
                // Correctly calculate short/long term based on one year holding period
                const now = new Date();
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                const transactionDate = new Date(transaction.date);
                const isShortTerm = transactionDate > oneYearAgo;

                const btcAmount = transaction.type === 'buy'
                  ? transaction.received_btc_amount ?? 0
                  : transaction.sell_btc_amount ?? 0;
                const fiatAmount = transaction.type === 'buy'
                  ? transaction.buy_fiat_amount ?? 0
                  : transaction.received_fiat_amount ?? 0;
                const fees = transaction.service_fee ?? 0;

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "buy" ? "default" : "destructive"}
                        className={`w-[100px] flex items-center justify-center ${
                          transaction.type === "buy" 
                            ? "bg-bitcoin-orange" 
                            : "bg-red-500"
                        }`}
                      >
                        {transaction.type === "buy" ? (
                          <ArrowDownRight className="mr-2 h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                        )}
                        {transaction.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`w-[80px] flex items-center justify-center ${
                          isShortTerm
                            ? "border-green-500 text-green-500"
                            : "border-purple-500 text-purple-500"
                        }`}
                      >
                        {isShortTerm ? "SHORT" : "LONG"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(btcAmount, 8)} BTC</TableCell>
                    <TableCell>${formatNumber(fiatAmount, 2)}</TableCell>
                    <TableCell>${formatNumber(transaction.price, 2)}</TableCell>
                    <TableCell>${formatNumber(fees, 2)}</TableCell>
                    <TableCell>
                      {transaction.exchange 
                        ? transaction.exchange.charAt(0).toUpperCase() + transaction.exchange.slice(1).toLowerCase()
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 