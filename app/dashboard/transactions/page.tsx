import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionsTable } from "@/components/dashboard/transactions-table"

export default function TransactionsPage() {
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Transactions</h1>
      </div>
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View and manage all your Bitcoin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

