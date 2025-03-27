import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

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

// Create a Supabase client for server-side operations
export const supabase = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false, // Don't persist session for server-side client
      autoRefreshToken: false,
    },
    db: {
      schema: 'public'
    }
  }
)

// Create a Supabase client for client-side operations with auth
let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createBrowserClient = () => {
  if (browserClient) return browserClient
  
  browserClient = createClientComponentClient<Database>({
    options: {
      db: {
        schema: 'public'
      }
    }
  })
  
  return browserClient
}

// Check if an email already exists using Supabase auth API
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Use the server-side client for this operation
    const { error } = await supabase.auth.signInWithOtp({
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
      .from('transactions')
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
      .from('transactions')
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
      message: err instanceof Error ? err.message : 'Unknown error'
    })
    return false
  }
}

// Run the test immediately
void testSupabaseConnection()

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
  type: 'Buy' | 'Sell' | 'Send' | 'Receive'
  asset: string
  sent_amount: number | null
  sent_currency: string | null
  buy_amount: number | null
  buy_currency: string | null
  sell_amount: number | null
  sell_currency: string | null
  price: number
  received_amount: number | null
  received_currency: string | null
  exchange: string | null
  network_fee: number | null
  network_currency: string | null
  service_fee: number | null
  service_fee_currency: string | null
}>) {
  try {
    const { data: { user }, error: authError } = await createBrowserClient().auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      throw new Error('Authentication failed: ' + authError.message)
    }
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('Inserting transactions:', {
      count: transactions.length,
      sample: transactions[0],
      userId: user.id
    })

    const { data, error } = await createBrowserClient()
      .from('transactions')
      .insert(
        transactions.map(transaction => ({
          user_id: user.id,
          ...transaction
        }))
      )
      .select()

    if (error) {
      console.error('Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Insert transaction error:', {
      error,
      type: typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return { data: null, error }
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
      .from('transactions')
      .select('count')
      .limit(1)

    if (testQuery.error) {
      console.error('Test query failed:', testQuery.error)
      throw new Error(`Database access error: ${testQuery.error.message}`)
    }

    // Now perform the actual query
    const { data, error } = await supabaseClient
      .from('transactions')
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