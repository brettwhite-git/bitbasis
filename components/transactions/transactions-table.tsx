"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Search } from "lucide-react"

const transactions = [
  {
    id: "1",
    date: "2023-07-15T00:00:00Z",
    type: "Buy",
    asset: "BTC",
    sent_amount: null,
    sent_currency: null,
    buy_amount: 1492.50,
    buy_currency: "USD",
    sell_amount: null,
    sell_currency: null,
    price: 29850.00,
    received_amount: 0.05,
    received_currency: "BTC",
    exchange: "Coinbase",
    network_fee: 4.93,
    network_currency: "USD",
    service_fee: 10.00,
    service_fee_currency: "USD"
  },
  {
    id: "2",
    date: "2023-06-22T00:00:00Z",
    type: "Buy",
    asset: "BTC",
    sent_amount: null,
    sent_currency: null,
    buy_amount: 2409.60,
    buy_currency: "USD",
    sell_amount: null,
    sell_currency: null,
    price: 30120.00,
    received_amount: 0.08,
    received_currency: "BTC",
    exchange: "Coinbase",
    network_fee: 14.10,
    network_currency: "USD",
    service_fee: 10.00,
    service_fee_currency: "USD"
  },
  {
    id: "3",
    date: "2023-05-10",
    type: "sell",
    amount: "0.02",
    price: "27,890.00",
    total: "557.80",
    fee: "5.58",
  },
  {
    id: "4",
    date: "2023-04-05",
    type: "buy",
    amount: "0.1",
    price: "28,450.00",
    total: "2,845.00",
    fee: "28.45",
  },
  {
    id: "5",
    date: "2023-03-18",
    type: "buy",
    amount: "0.03",
    price: "26,780.00",
    total: "803.40",
    fee: "8.03",
  },
  {
    id: "6",
    date: "2023-02-25",
    type: "buy",
    amount: "0.04",
    price: "24,950.00",
    total: "998.00",
    fee: "9.98",
  },
  {
    id: "7",
    date: "2023-01-12",
    type: "buy",
    amount: "0.06",
    price: "18,320.00",
    total: "1,099.20",
    fee: "10.99",
  },
  {
    id: "8",
    date: "2022-12-05",
    type: "buy",
    amount: "0.07",
    price: "17,150.00",
    total: "1,200.50",
    fee: "12.01",
  },
  {
    id: "9",
    date: "2022-11-18",
    type: "sell",
    amount: "0.01",
    price: "16,780.00",
    total: "167.80",
    fee: "1.68",
  },
  {
    id: "10",
    date: "2022-10-22",
    type: "buy",
    amount: "0.05",
    price: "19,450.00",
    total: "972.50",
    fee: "9.73",
  },
]

export function TransactionsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatBTC = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount)
  }

  const getTotalFees = (transaction: typeof transactions[0]) => {
    return (transaction.network_fee || 0) + (transaction.service_fee || 0)
  }

  const getAmount = (transaction: typeof transactions[0]) => {
    if (transaction.type === 'Buy' || transaction.type === 'Receive') {
      return transaction.received_amount
    } else {
      return transaction.sent_amount
    }
  }

  const getTotal = (transaction: typeof transactions[0]) => {
    if (transaction.type === 'Buy') {
      return transaction.buy_amount
    } else if (transaction.type === 'Sell') {
      return transaction.sell_amount
    }
    return 0
  }

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((transaction) =>
    Object.values(transaction).some((value) =>
      value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount (BTC)</TableHead>
              <TableHead className="hidden md:table-cell">Price (USD)</TableHead>
              <TableHead>Total (USD)</TableHead>
              <TableHead className="hidden md:table-cell">Fees (USD)</TableHead>
              <TableHead className="hidden lg:table-cell">Exchange</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.type === "Buy" ? "default" : "destructive"}
                    className={transaction.type === "Buy" ? "bg-bitcoin-orange" : ""}
                  >
                    {transaction.type === "Buy" ? (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {transaction.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{formatBTC(getAmount(transaction) || 0)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  ${formatCurrency(transaction.price)}
                </TableCell>
                <TableCell>${formatCurrency(getTotal(transaction) || 0)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  ${formatCurrency(getTotalFees(transaction))}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{transaction.exchange}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

