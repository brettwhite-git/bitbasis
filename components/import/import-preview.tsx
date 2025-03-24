"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui"
import { CheckCircle2, AlertCircle, ArrowDownRight, ArrowUpRight, SendHorizontal, Download } from "lucide-react"
import type { Database } from '@/types/supabase'

type DbTransaction = Database['public']['Tables']['transactions']['Insert']

interface ParsedTransaction {
  date: string
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  asset: string
  sent_amount: number | null
  sent_currency: string | null
  buy_amount: number | null
  buy_currency: string | null
  sell_amount: number | null
  sell_currency: string | null
  price: number
  received_amount: number | null
  received_currency: string | null
  exchange: string | null
  network_fee: number | null
  network_currency: string | null
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
}

export function ImportPreview({ transactions, validationIssues, originalRows }: ImportPreviewProps) {
  // Calculate summary statistics
  const dateRange = transactions.length > 0 ? {
    start: new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
    end: new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
  } : null

  const stats = {
    total: transactions.length,
    validRows: transactions.length,
    totalBtc: transactions.reduce((sum, t) => {
      if (t.type === 'Buy' || t.type === 'Receive') {
        return sum + (t.received_amount ?? 0)
      } else if (t.type === 'Sell' || t.type === 'Send') {
        return sum - (t.sent_amount ?? 0)
      }
      return sum
    }, 0),
    types: {
      buy: transactions.filter(t => t.type === 'Buy').length,
      sell: transactions.filter(t => t.type === 'Sell').length,
      send: transactions.filter(t => t.type === 'Send').length,
      receive: transactions.filter(t => t.type === 'Receive').length
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number, decimals: number = 8) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  const getAmount = (t: ParsedTransaction) => {
    if (t.type === 'Buy' || t.type === 'Receive') {
      return t.received_amount ?? 0
    }
    return t.sent_amount ?? 0
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
    if (transaction.type === 'Buy') {
      return transaction.buy_amount ?? 0
    } else if (transaction.type === 'Sell') {
      return transaction.sell_amount ?? 0
    }
    return 0
  }

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            {dateRange ? (
              <div className="text-sm">
                {formatDate(dateRange.start.toISOString())} to {formatDate(dateRange.end.toISOString())}
              </div>
            ) : (
              <div className="text-sm">No transactions</div>
            )}
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
              <div>Send: {stats.types.send}</div>
              <div>Receive: {stats.types.receive}</div>
            </div>
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
                <TableHead>Asset</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Fees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === 'Buy' ? 'default' : 'secondary'}
                      className={transaction.type === 'Buy' ? 'bg-bitcoin-orange' : ''}
                    >
                      {getTransactionIcon(transaction.type)}
                      {transaction.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.asset}</TableCell>
                  <TableCell>
                    {transaction.type === 'Buy' || transaction.type === 'Receive' ? (
                      formatAmount(transaction.received_amount ?? 0)
                    ) : (
                      formatAmount(transaction.sent_amount ?? 0)
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'Buy' ? (
                      formatCurrency(transaction.buy_amount ?? 0)
                    ) : transaction.type === 'Sell' ? (
                      formatCurrency(transaction.sell_amount ?? 0)
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>${formatNumber(transaction.price, 2)}</TableCell>
                  <TableCell>{transaction.exchange || '-'}</TableCell>
                  <TableCell>
                    {formatCurrency(transaction.network_fee ?? 0)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(transaction.service_fee ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 