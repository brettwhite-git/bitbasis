import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { TransactionsTable } from "@/components/transactions/transactions-table"

export default function TransactionsPage() {
  // Get the current date on the server
  const currentDate = new Date();
  // Convert to ISO string for serialization
  const currentDateISO = currentDate.toISOString();

  // Log the server-generated date
  // console.log("[Server: TransactionsPage] Current Date ISO:", currentDateISO);

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
            <TransactionsTable currentDateISO={currentDateISO} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

