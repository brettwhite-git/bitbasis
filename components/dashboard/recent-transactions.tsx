"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"

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
]

export function RecentTransactions() {
  return (
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
          {transactions.map((transaction) => (
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
  )
}

