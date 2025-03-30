import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { PostgrestError } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate URL format and placeholder values
if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
  console.error('Invalid or missing Supabase URL. Please check your .env.local file.')
  throw new Error('Invalid or missing NEXT_PUBLIC_SUPABASE_URL')
}

// Validate anon key format and placeholder values
if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error('Invalid or missing Supabase anon key. Please check your .env.local file.')
  throw new Error('Invalid or missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a Supabase client for client-side operations with auth
let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createBrowserClient = () => {
  try {
    if (browserClient) {
      // Verify the client is still valid
      console.log('Reusing existing browser client')
      return browserClient
    }
    
    console.log('Creating new browser client')
    browserClient = createClientComponentClient<Database>({
      options: {
        db: {
          schema: 'public'
        }
      }
    })
    
    return browserClient
  } catch (err) {
    console.error('Error creating browser client:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    throw err
  }
}

// Check if an email already exists using Supabase auth API
export async function checkEmailExists(email: string): Promise<boolean> {
  // This function now needs to create its own client if it's intended for server-side use
  // outside the normal request flow. If used in API routes/Server Actions, 
  // it should use the client provided by the appropriate helper.
  // For now, let's assume it needs its own temporary client:
  const tempServerClient = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  try {
    // Use the temporary server-side client for this operation
    const { error } = await tempServerClient.auth.signInWithOtp({ // Use tempServerClient
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    return !error || error.message.includes('Email not confirmed')
  } catch (error) {
    console.error('Error checking email:', error)
    return false
  }
}

// Test the connection with more detailed error handling
async function testSupabaseConnection() {
  try {
    console.log('=== Supabase Connection Test ===')
    console.log('1. Environment Variables:')
    console.log('   - URL:', supabaseUrl ? 'Present' : 'Missing')
    console.log('   - Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

    // Test basic connection
    console.log('\n2. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Basic connection test failed:', {
        code: testError.code,
        message: testError.message,
        details: testError.details,
        hint: testError.hint
      })
      return false
    }

    // Test table structure
    console.log('\n3. Testing table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('orders')
      .select('*')
      .limit(0)

    if (tableError) {
      console.error('Table structure test failed:', {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      })
      return false
    }

    console.log('Table structure:', tableInfo)
    console.log('\n4. Connection test successful!')
    return true
  } catch (err) {
    console.error('Connection test failed with error:', {
      error: err,
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    return false
  }
}

// Run the test immediately if not in production
// if (process.env.NODE_ENV !== 'production') {
//   void testSupabaseConnection() // Temporarily disable to check if it causes the cookies error
// }

export interface Transaction {
  id?: string
  user_id: string
  transaction_date: string
  transaction_type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  asset: string
  quantity: number
  price_usd: number
  total_usd: number
  fee_usd: number
  created_at?: string
  updated_at?: string
}

// Use client-side client for authenticated operations
export async function insertTransactions(transactions: Array<{
  date: string
  type: 'buy' | 'sell'
  asset: string
  price: number
  exchange: string | null
  buy_fiat_amount: number | null
  buy_currency: string | null
  buy_btc_amount: number | null
  received_btc_amount: number | null
  received_currency: string | null
  sell_btc_amount: number | null
  sell_btc_currency: string | null
  received_fiat_amount: number | null
  received_fiat_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
}>) {
  const supabase = createClientComponentClient<Database>()

  try {
    // First check if we're authenticated
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      return { data: null, error: { message: 'Authentication failed' } }
    }
    if (!authData.user) {
      console.error('No user found')
      return { data: null, error: { message: 'Please sign in to continue' } }
    }

    // Add user_id to transactions and ensure they match the orders table schema
    const preparedTransactions = transactions.map(t => {
      // Log the transaction being processed
      console.log('Processing transaction:', {
        type: t.type,
        amounts: {
          buy_fiat_amount: t.buy_fiat_amount,
          received_btc_amount: t.received_btc_amount,
          sell_btc_amount: t.sell_btc_amount,
          received_fiat_amount: t.received_fiat_amount
        }
      })

      // Validate required fields
      if (!t.date || !t.type || !t.asset || typeof t.price !== 'number') {
        throw new Error(`Missing required fields: date, type, asset, or price`)
      }

      // Validate type-specific required fields
      if (t.type === 'buy' && (!t.buy_fiat_amount || !t.received_btc_amount)) {
        throw new Error(`Buy transaction requires buy_fiat_amount and received_btc_amount`)
      }
      if (t.type === 'sell' && (!t.sell_btc_amount || !t.received_fiat_amount)) {
        throw new Error(`Sell transaction requires sell_btc_amount and received_fiat_amount`)
      }

      return {
        user_id: authData.user.id,
        date: t.date,
        type: t.type,
        asset: t.asset,
        price: t.price,
        exchange: t.exchange,
        buy_fiat_amount: t.type === 'buy' ? t.buy_fiat_amount : null,
        buy_currency: t.type === 'buy' ? t.buy_currency : null,
        received_btc_amount: t.type === 'buy' ? t.received_btc_amount : null,
        received_currency: t.type === 'buy' ? t.received_currency : null,
        sell_btc_amount: t.type === 'sell' ? t.sell_btc_amount : null,
        sell_btc_currency: t.type === 'sell' ? t.sell_btc_currency : null,
        received_fiat_amount: t.type === 'sell' ? t.received_fiat_amount : null,
        received_fiat_currency: t.type === 'sell' ? t.received_fiat_currency : null,
        service_fee: t.service_fee,
        service_fee_currency: t.service_fee_currency
      }
    })

    // Log the prepared transactions
    console.log('Prepared transactions:', preparedTransactions)

    // Try to insert the transactions
    const { data, error: insertError } = await supabase
      .from('orders')
      .insert(preparedTransactions)
      .select()

    if (insertError) {
      console.error('Insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return { 
        data: null, 
        error: { 
          message: insertError.message || 'Failed to insert transactions',
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        } 
      }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Unexpected error:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        code: 'UNKNOWN'
      } 
    }
  }
}

export async function getTransactions() {
  const supabaseClient = createBrowserClient()
  
  try {
    console.log('Fetching transactions: Starting...')
    
    // Get the current user using the client-side client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      console.error('Authentication error:', userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }
    
    if (!user) {
      console.error('No user found')
      throw new Error('Authentication required')
    }

    console.log('User authenticated, fetching transactions for user:', user.id)

    // First, test if we can access the table at all
    const testQuery = await supabaseClient
      .from('orders')
      .select('count')
      .limit(1)

    if (testQuery.error) {
      console.error('Test query failed:', testQuery.error)
      throw new Error(`Database access error: ${testQuery.error.message}`)
    }

    // Now perform the actual query
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    console.log(`Successfully fetched ${data?.length || 0} transactions`)
    return { data, error: null }
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      error,
      type: typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    console.error('Error in getTransactions:', errorDetails)
    
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to fetch transactions') 
    }
  }
} 