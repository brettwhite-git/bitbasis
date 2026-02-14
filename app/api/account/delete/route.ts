import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sanitizeError } from '@/lib/utils/error-sanitization'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, createRateLimitResponse, RateLimits } from '@/lib/rate-limiting'

// Service role client ONLY for admin operations that require it
// SEC-005: Minimize service role usage - only use for auth.admin operations
const supabaseAdmin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserDataSummary {
  transactionCount: number
  csvUploadCount: number
  hasActiveSubscription: boolean
  subscriptionType?: 'monthly' | 'lifetime' | null
}

/**
 * Fetch user's data summary for UI display and logging
 * SEC-005: Use authenticated client with RLS instead of service role for queries
 */
async function getUserDataSummary(userId: string, supabase: SupabaseClient<Database>): Promise<UserDataSummary> {
  try {
    // Use authenticated client with RLS - user can only query their own data
    const [transactionsResult, csvUploadsResult, subscriptionsResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('csv_uploads')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('status, metadata')
        .in('status', ['active', 'trialing'])
        .limit(1)
    ])

    const hasActiveSubscription = (subscriptionsResult.data?.length ?? 0) > 0
    const subscriptionMetadata = subscriptionsResult.data?.[0]?.metadata as Record<string, unknown> | null
    const subscriptionType = subscriptionMetadata?.type === 'lifetime' ? 'lifetime' : 
                            hasActiveSubscription ? 'monthly' : null

    return {
      transactionCount: transactionsResult.count ?? 0,
      csvUploadCount: csvUploadsResult.count ?? 0,
      hasActiveSubscription,
      subscriptionType
    }
  } catch (error) {
    console.error('Error fetching user data summary:', error)
    // Return defaults on error - don't block deletion
    return {
      transactionCount: 0,
      csvUploadCount: 0,
      hasActiveSubscription: false
    }
  }
}

/**
 * Delete user's Stripe data (subscriptions and customer)
 * Handles cases where:
 * - User has no Stripe customer record in database (free users, never subscribed)
 * - User has customer record but customer doesn't exist in Stripe (edge case)
 * - User has subscriptions in database that need cancellation
 * - User has subscriptions in Stripe that need cancellation
 */
/**
 * Delete user's Stripe data (subscriptions and customer)
 * SEC-005: Use authenticated client for queries, service role only for admin operations
 */
async function deleteUserStripeData(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // SEC-005: Use authenticated client with RLS to query customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .maybeSingle() // Use maybeSingle to handle case where record doesn't exist

    // If no customer record exists, user likely never interacted with Stripe
    if (customerError && customerError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for users without Stripe
      console.error(`Error checking for Stripe customer: ${customerError.message}`)
      // Continue - not a fatal error
    }

    const stripeCustomerId = customer?.stripe_customer_id

    // Handle Stripe subscriptions if customer exists
    if (stripeCustomerId) {
      try {
        // Verify customer exists in Stripe (edge case: database has ID but Stripe doesn't)
        try {
          await stripe.customers.retrieve(stripeCustomerId)
        } catch (error) {
          if (error instanceof Error && error.message.includes('No such customer')) {
            console.warn(`Stripe customer ${stripeCustomerId} not found in Stripe (database has stale reference)`)
            // Continue - will clean up database record later
            return { success: true, errors: [] }
          }
          throw error // Re-throw if it's a different error
        }

        // List all subscriptions for this customer in Stripe
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 100,
          status: 'all' // Get all statuses to catch everything
        })

        // Cancel all active/trialing subscriptions in Stripe
        for (const subscription of stripeSubscriptions.data) {
          // Only cancel active subscriptions (not already canceled/ended)
          if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
            try {
              // Check if this is a lifetime subscription (metadata check)
              const metadata = subscription.metadata as Record<string, unknown> | null
              const isLifetime = metadata?.type === 'lifetime' || subscription.id.startsWith('lifetime_')

              if (isLifetime) {
                console.log(`Skipping Stripe cancellation for lifetime subscription ${subscription.id}`)
              } else {
                await stripe.subscriptions.cancel(subscription.id)
                console.log(`Canceled Stripe subscription ${subscription.id}`)
              }
            } catch (error) {
              const errorMsg = `Failed to cancel subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              console.error(errorMsg)
              errors.push(errorMsg)
            }
          }
        }

        // Attempt to delete Stripe customer (GDPR compliance)
        try {
          await stripe.customers.del(stripeCustomerId)
          console.log(`Deleted Stripe customer ${stripeCustomerId}`)
        } catch (error) {
          // Handle case where customer is already deleted
          if (error instanceof Error && error.message.includes('No such customer')) {
            console.log(`Stripe customer ${stripeCustomerId} already deleted`)
          } else {
            const errorMsg = `Failed to delete Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.warn(errorMsg) // Warning, not error - continue deletion
            errors.push(errorMsg)
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process Stripe subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    } else {
      // No Stripe customer - user never created one
      console.log(`No Stripe customer record found for user ${userId} - skipping Stripe cleanup`)
    }

    // Note: Database subscriptions will be deleted in deleteUserDatabaseRecords
    // We handle Stripe cleanup above, database cleanup happens in the deletion sequence

    return { success: true, errors }
  } catch (error) {
    const errorMsg = `Unexpected error in Stripe deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    return { success: false, errors: [errorMsg] }
  }
}

/**
 * Delete user's database records in correct order
 * SEC-005: Use authenticated client - RLS policies allow users to delete their own data
 * Note: Some tables have ON DELETE CASCADE, but we delete explicitly for clarity and control
 */
async function deleteUserDatabaseRecords(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; error?: string }> {
  try {
    // SEC-005: Use authenticated client with RLS - users can only delete their own data
    // Delete in order (respecting FK constraints)
    // 1. Transactions (references csv_uploads, so delete first)
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
      return { success: false, error: `Failed to delete transactions: ${transactionsError.message}` }
    }

    // 2. Subscriptions (references user_id, no cascade)
    // RLS ensures user can only delete their own subscriptions
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()

    if (subscriptionsError) {
      console.error('Error deleting subscriptions:', subscriptionsError)
      return { success: false, error: `Failed to delete subscriptions: ${subscriptionsError.message}` }
    }

    // 3. Customers (references user_id, no cascade)
    // RLS ensures user can only delete their own customer record
    const { error: customersError } = await supabase
      .from('customers')
      .delete()

    if (customersError) {
      console.error('Error deleting customers:', customersError)
      return { success: false, error: `Failed to delete customers: ${customersError.message}` }
    }

    // 4. CSV uploads (has CASCADE to transactions, but we already deleted transactions)
    // RLS ensures user can only delete their own uploads
    const { error: csvUploadsError } = await supabase
      .from('csv_uploads')
      .delete()

    if (csvUploadsError) {
      console.error('Error deleting csv_uploads:', csvUploadsError)
      return { success: false, error: `Failed to delete csv_uploads: ${csvUploadsError.message}` }
    }

    // 5. Terms acceptance (has CASCADE, but delete explicitly)
    // RLS ensures user can only delete their own terms acceptance
    const { error: termsError } = await supabase
      .from('terms_acceptance')
      .delete()

    if (termsError) {
      console.error('Error deleting terms_acceptance:', termsError)
      return { success: false, error: `Failed to delete terms_acceptance: ${termsError.message}` }
    }

    console.log(`Successfully deleted database records for user ${userId}`)
    return { success: true }
  } catch (error) {
    const errorMsg = `Database deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete user's storage files from csv_uploads bucket
 * SEC-005: Use authenticated client - storage RLS policies allow users to delete their own files
 */
async function deleteUserStorageFiles(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  try {
    // SEC-005: Use authenticated client with storage RLS
    // List all files for this user (files are stored as userId/timestamp-filename)
    const { data: files, error: listError } = await supabase.storage
      .from('csv_uploads')
      .list(userId, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      const errorMsg = `Failed to list storage files: ${listError.message}`
      console.error(errorMsg)
      errors.push(errorMsg)
      return { success: false, errors }
    }

    if (!files || files.length === 0) {
      console.log(`No storage files found for user ${userId}`)
      return { success: true, errors: [] }
    }

    // Delete all files - RLS ensures user can only delete their own files
    const filePaths = files.map(file => `${userId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('csv_uploads')
      .remove(filePaths)

    if (deleteError) {
      const errorMsg = `Failed to delete storage files: ${deleteError.message}`
      console.warn(errorMsg) // Warning - continue deletion
      errors.push(errorMsg)
    } else {
      console.log(`Successfully deleted ${filePaths.length} storage files for user ${userId}`)
    }

    return { success: true, errors }
  } catch (error) {
    const errorMsg = `Unexpected error in storage deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    return { success: false, errors: [errorMsg] }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Validation
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // SEC-006: Strict rate limiting for account deletion (1 per hour)
    const rateLimitResult = checkRateLimit(
      `account-delete:${user.id}`,
      RateLimits.ACCOUNT_DELETE.limit,
      RateLimits.ACCOUNT_DELETE.windowMs
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { confirmationText } = body

    // Validate confirmation text
    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text must be exactly "DELETE"' },
        { status: 400 }
      )
    }

    const userId = user.id

    // Get user data summary for logging (using authenticated client)
    const dataSummary = await getUserDataSummary(userId, supabase)
    console.log(`Starting account deletion for user ${userId}:`, dataSummary)

    // 2. Stripe Cleanup
    console.log('Step 1: Cleaning up Stripe data...')
    const stripeResult = await deleteUserStripeData(userId, supabase)
    if (stripeResult.errors.length > 0) {
      console.warn('Stripe cleanup had errors but continuing:', stripeResult.errors)
    }

    // 3. Database Deletion (using authenticated client with RLS)
    console.log('Step 2: Deleting database records...')
    const dbResult = await deleteUserDatabaseRecords(userId, supabase)
    if (!dbResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to delete database records',
          details: dbResult.error 
        },
        { status: 500 }
      )
    }

    // 4. Storage Cleanup (using authenticated client)
    console.log('Step 3: Cleaning up storage files...')
    const storageResult = await deleteUserStorageFiles(userId, supabase)
    if (storageResult.errors.length > 0) {
      console.warn('Storage cleanup had errors but continuing:', storageResult.errors)
    }

    // 5. Auth User Deletion
    console.log('Step 4: Deleting auth user...')
    let authDeletionError: string | null = null
    try {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteUserError) {
        authDeletionError = deleteUserError.message
        console.error('Failed to delete auth user:', deleteUserError)
      } else {
        console.log(`Successfully deleted auth user ${userId}`)
      }
    } catch (error) {
      authDeletionError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Unexpected error deleting auth user:', error)
    }

    // Determine response based on completion
    if (authDeletionError) {
      // Partial success - data deleted but auth user remains
      return NextResponse.json({
        success: true,
        warning: 'Account data deleted but auth user deletion failed',
        errors: {
          auth: authDeletionError,
          stripe: stripeResult.errors,
          storage: storageResult.errors
        }
      }, { status: 207 }) // 207 Multi-Status
    }

    // Complete success
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deleted: {
        transactions: dataSummary.transactionCount,
        csvUploads: dataSummary.csvUploadCount,
        subscriptions: dataSummary.hasActiveSubscription ? 1 : 0
      },
      warnings: {
        stripe: stripeResult.errors,
        storage: storageResult.errors
      }
    })

  } catch (error) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeError(error, 'Failed to delete account', 'account deletion')
    
    return NextResponse.json(
      sanitized,
      { status: 500 }
    )
  }
}
