import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// Admin client for data summary (bypasses RLS)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Authenticate user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Fetch user's data counts
    const [transactionsResult, csvUploadsResult, subscriptionsResult] = await Promise.all([
      supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseAdmin
        .from('csv_uploads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseAdmin
        .from('subscriptions')
        .select('id, status, metadata, current_period_end')
        .eq('user_id', userId)
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
    console.error('Error fetching account summary:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch account summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
