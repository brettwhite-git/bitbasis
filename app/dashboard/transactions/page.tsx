import { redirect } from 'next/navigation'

export default function TransactionsPage() {
  // Redirect to the new transaction history page
  redirect('/dashboard/transaction-history')
}

