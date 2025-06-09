import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Validation schema for transaction updates
const updateTransactionSchema = z.object({
  date: z.string().datetime().optional(),
  type: z.enum(['buy', 'sell', 'deposit', 'withdrawal', 'interest']).optional(),
  asset: z.string().optional(),
  sent_amount: z.number().positive().nullable().optional(),
  sent_currency: z.string().nullable().optional(),
  sent_cost_basis: z.number().nullable().optional(),
  from_address: z.string().nullable().optional(),
  from_address_name: z.string().nullable().optional(),
  to_address: z.string().nullable().optional(),
  to_address_name: z.string().nullable().optional(),
  received_amount: z.number().positive().nullable().optional(),
  received_currency: z.string().nullable().optional(),
  received_cost_basis: z.number().nullable().optional(),
  fee_amount: z.number().min(0).nullable().optional(),
  fee_currency: z.string().nullable().optional(),
  fee_cost_basis: z.number().nullable().optional(),
  realized_return: z.number().nullable().optional(),
  fee_realized_return: z.number().nullable().optional(),
  transaction_hash: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    
    // Validate input
    const validatedData = updateTransactionSchema.parse(body)

    // First, verify the transaction belongs to the user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update the transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Transaction updated successfully',
      transaction: updatedTransaction 
    })

  } catch (error) {
    console.error('Transaction update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete the transaction (RLS policies will ensure user can only delete their own)
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting transaction:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Transaction deleted successfully' 
    })

  } catch (error) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 