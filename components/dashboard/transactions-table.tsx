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
    date: "2023-07-15",
    type: "buy",
    amount: "0.05",
    price: "29,850.00",
    total: "1,492.50",
    fee: "14.93",
  },
  {
    id: "2",
    date: "2023-06-22",
    type: "buy",
    amount: "0.08",
    price: "30,120.00",
    total: "2,409.60",
    fee: "24.10",
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
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.date.includes(searchTerm) ||
      transaction.type.includes(searchTerm.toLowerCase()) ||
      transaction.amount.includes(searchTerm),
  )

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount (BTC)</TableHead>
              <TableHead className="hidden md:table-cell">Price (USD)</TableHead>
              <TableHead>Total (USD)</TableHead>
              <TableHead className="hidden md:table-cell">Fee (USD)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.type === "buy" ? "default" : "destructive"}
                    className={transaction.type === "buy" ? "bg-bitcoin-orange" : ""}
                  >
                    {transaction.type === "buy" ? (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {transaction.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell className="hidden md:table-cell">${transaction.price}</TableCell>
                <TableCell>${transaction.total}</TableCell>
                <TableCell className="hidden md:table-cell">${transaction.fee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTransactions.length)} of{" "}
          {filteredTransactions.length} transactions
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

