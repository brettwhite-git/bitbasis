import { NextResponse } from 'next/server'
import { sanitizeError } from '@/lib/utils/error-sanitization'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Authenticate user and use authenticated client (RLS enforced)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // SEC-005: Use authenticated client with RLS enforcement instead of service role
    // RLS policies ensure users can only access their own data
    // Note: Explicit user_id filters added for clarity and as defense-in-depth
    const [transactionsResult, csvUploadsResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('csv_uploads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('subscriptions')
        .select('id, status, metadata, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created', { ascending: false })
        .limit(1)
    ])

    const transactionCount = transactionsResult.count ?? 0
    const csvUploadCount = csvUploadsResult.count ?? 0
    const activeSubscription = subscriptionsResult.data?.[0] ?? null

    let subscriptionInfo: {
      hasActive: boolean
      type?: 'monthly' | 'lifetime'
      nextBillingDate?: string
    } = {
      hasActive: false
    }

    if (activeSubscription) {
      const metadata = activeSubscription.metadata as Record<string, unknown> | null
      const isLifetime = metadata?.type === 'lifetime' || activeSubscription.id.startsWith('lifetime_')
      
      subscriptionInfo = {
        hasActive: true,
        type: isLifetime ? 'lifetime' : 'monthly',
        nextBillingDate: activeSubscription.current_period_end 
          ? new Date(activeSubscription.current_period_end).toISOString()
          : undefined
      }
    }

    return NextResponse.json({
      transactionCount,
      csvUploadCount,
      subscription: subscriptionInfo,
      email: user.email
    })

  } catch (error) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeError(error, 'Failed to fetch account summary', 'account summary')
    
    return NextResponse.json(
      sanitized,
      { status: 500 }
    )
  }
}
