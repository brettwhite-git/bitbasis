import { redirect } from 'next/navigation'
import { requireAuth } from "@/lib/auth/server-auth"

export default async function TransactionsPage() {
  // Protect route - redirects to sign-in if not authenticated
  await requireAuth()
  // Redirect to the new transaction history page
  redirect('/dashboard/transaction-history')
}

