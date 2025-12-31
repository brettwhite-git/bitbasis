import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch transactions from the new unified table
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0
    })

  } catch (error) {
    console.error('Transaction history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionIds } = body

    // Validate input
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Transaction IDs are required and must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate that all IDs are strings/numbers and convert to numbers
    const validIds: number[] = []
    for (const id of transactionIds) {
      if (typeof id === 'number') {
        validIds.push(id)
      } else if (typeof id === 'string') {
        const numId = parseInt(id, 10)
        if (!isNaN(numId)) {
          validIds.push(numId)
        }
      }
    }

    if (validIds.length !== transactionIds.length) {
      return NextResponse.json(
        { error: 'All transaction IDs must be valid numbers' },
        { status: 400 }
      )
    }

    // First, verify all transactions belong to the current user
    // This is critical for security - prevents users from deleting other users' transactions
    const { data: ownedTransactions, error: verifyError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', session.user.id)
      .in('id', validIds)

    if (verifyError) {
      console.error('Error verifying transaction ownership:', verifyError)
      return NextResponse.json(
        { error: 'Failed to verify transaction ownership' },
        { status: 500 }
      )
    }

    const ownedIds = ownedTransactions?.map(t => t.id) || []
    
    // Check if user owns all requested transactions
    // Convert both arrays to strings for consistent comparison since DB returns numbers but client sends strings
    const ownedIdsStr = ownedIds.map(id => String(id))
    const validIdsStr = validIds.map(id => String(id))
    const unauthorizedIds = validIdsStr.filter(id => !ownedIdsStr.includes(id))
    if (unauthorizedIds.length > 0) {
      console.warn(`User ${session.user.id} attempted to delete unauthorized transactions:`, {
        requestedIds: validIdsStr,
        ownedIds: ownedIdsStr,
        unauthorizedIds: unauthorizedIds
      })
      return NextResponse.json(
        { error: 'You can only delete your own transactions' },
        { status: 403 }
      )
    }

    // Perform the deletion using the original numeric IDs
    // RLS policies should also prevent unauthorized deletion, but we've already verified above
    const { error: deleteError, count } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', session.user.id) // Extra security: ensure user_id matches
      .in('id', ownedIds) // Use original numeric IDs for database query

    if (deleteError) {
      console.error('Error deleting transactions:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete transactions' },
        { status: 500 }
      )
    }

    // Use the number of owned IDs as the count if Supabase count is unreliable
    const actualDeletedCount = count ?? ownedIds.length
    
    console.log(`Delete operation completed. Supabase count: ${count}, Owned IDs: ${ownedIds.length}, Using: ${actualDeletedCount}`)

    return NextResponse.json({
      success: true,
      deletedCount: actualDeletedCount,
      message: `Successfully deleted ${actualDeletedCount} transaction(s)`
    })

  } catch (error) {
    console.error('Delete transactions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 