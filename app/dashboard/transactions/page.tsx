// Removed Card imports - using glass morphism styling
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Transaction History</h1>
      </div>
      <div className="w-full">
        <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
          <TransactionsContainer 
            currentDateISO={currentDateISO} 
          />
        </div>
      </div>
    </div>
  )
}

