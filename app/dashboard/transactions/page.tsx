import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { TransactionsTable } from "@/components/transactions/TransactionsTable"

/**
 * The main transactions page component that displays transaction history
 */
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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and manage all your Bitcoin transactions</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div id="pagination-container" />
                <div id="transaction-count-container" className="text-sm text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionsTable 
              currentDateISO={currentDateISO} 
              paginationContainerId="pagination-container"
              transactionCountContainerId="transaction-count-container"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

