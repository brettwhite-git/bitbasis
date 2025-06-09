import { TransactionHistoryTable } from "@/components/transaction-history/transaction-history-table"
import { EditDrawerProvider } from "@/components/transaction-history/edit-drawer-provider"
import { EditTransactionDrawer } from "@/components/transaction-history/edit-transaction-drawer"

export default function TransactionHistoryPage() {
  return (
    <EditDrawerProvider>
      <div className="w-full space-y-6">
        <div className="w-full">
          <h1 className="text-3xl font-bold tracking-tight text-white">Transaction History</h1>
          <p className="text-gray-400 mt-2">Comprehensive view of all your Bitcoin transactions</p>
        </div>
        
        <div className="w-full">
          <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
            <TransactionHistoryTable />
          </div>
        </div>
      </div>
      
      <EditTransactionDrawer />
    </EditDrawerProvider>
  )
} 