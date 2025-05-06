import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { TransactionsContainer } from "@/components/transactions/TransactionsContainer"

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
        <h1 className="text-2xl font-bold tracking-tight text-white">Transaction History</h1>
      </div>
      <div className="w-full">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
             
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionsContainer 
              currentDateISO={currentDateISO} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

