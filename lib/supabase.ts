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

// Initialize a basic server-side client for internal operations
const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

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
  // Create a temporary client specifically for this test
  const testClient = createSupabaseClient<Database>(supabaseUrl!, supabaseAnonKey!)
  
  try {
    console.log('=== Supabase Connection Test ===')
    console.log('1. Environment Variables:')
    console.log('   - URL:', supabaseUrl ? 'Present' : 'Missing')
    console.log('   - Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

    // Test basic connection
    console.log('\n2. Testing basic connection...')
    const { data: testData, error: testError } = await testClient
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
    const { data: tableInfo, error: tableError } = await testClient
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
  network_fee_btc?: number | null
  txid?: string | null
  created_at?: string
  updated_at?: string
}

// Use client-side client for authenticated operations
export async function insertTransactions({ 
  orders, 
  transfers,
  csvUploadId
}: { 
  orders: Database['public']['Tables']['orders']['Insert'][], 
  transfers: Database['public']['Tables']['transfers']['Insert'][],
  csvUploadId?: string
}) {
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

    // If csvUploadId is provided, add it to all orders and transfers
    if (csvUploadId) {
      orders = orders.map(order => ({ ...order, csv_upload_id: csvUploadId }))
      transfers = transfers.map(transfer => ({ ...transfer, csv_upload_id: csvUploadId }))
    }

    // Insert orders and transfers in parallel
    const [ordersResult, transfersResult] = await Promise.all([
      orders.length > 0 ? supabase.from('orders').insert(orders).select() : Promise.resolve({ data: [], error: null }),
      transfers.length > 0 ? supabase.from('transfers').insert(transfers).select() : Promise.resolve({ data: [], error: null })
    ])

    if (ordersResult.error) {
      console.error('Orders insert error:', ordersResult.error)
      return { 
        data: null, 
        error: { 
          message: ordersResult.error.message || 'Failed to insert orders',
          details: ordersResult.error.details,
          hint: ordersResult.error.hint,
          code: ordersResult.error.code
        } 
      }
    }

    if (transfersResult.error) {
      console.error('Transfers insert error:', transfersResult.error)
      return { 
        data: null, 
        error: { 
          message: transfersResult.error.message || 'Failed to insert transfers',
          details: transfersResult.error.details,
          hint: transfersResult.error.hint,
          code: transfersResult.error.code
        } 
      }
    }

    // If csvUploadId was provided, update the csv_uploads entry with status and counts
    if (csvUploadId) {
      const importedRowCount = (ordersResult.data?.length || 0) + (transfersResult.data?.length || 0)
      await updateCSVUploadStatus(csvUploadId, 'completed', {
        importedRowCount
      })
    }

    return { 
      data: { 
        orders: ordersResult.data || [], 
        transfers: transfersResult.data || [] 
      }, 
      error: null 
    }
  } catch (err) {
    console.error('Unexpected error:', {
      error: err,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    
    // If csvUploadId was provided, update the status to error
    if (csvUploadId) {
      await updateCSVUploadStatus(csvUploadId, 'error', {
        errorMessage: err instanceof Error ? err.message : String(err)
      })
    }
    
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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('User not authenticated')

    // Fetch orders and transfers in parallel
    const [ordersResult, transfersResult] = await Promise.all([
      supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabaseClient
        .from('transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
    ])

    if (ordersResult.error) throw ordersResult.error
    if (transfersResult.error) throw transfersResult.error

    // Map orders to unified format
    const mappedOrders = (ordersResult.data || []).map(order => ({
      id: `order-${order.id}`,
      date: order.date,
      type: order.type,
      asset: order.asset,
      btc_amount: order.type === 'buy' ? order.received_btc_amount : order.sell_btc_amount,
      usd_value: order.type === 'buy' ? order.buy_fiat_amount : order.received_fiat_amount,
      fee_usd: order.service_fee_currency === 'USD' ? order.service_fee : null,
      price_at_tx: order.price,
      exchange: order.exchange
    }))

    // Map transfers to unified format
    const mappedTransfers = (transfersResult.data || []).map(transfer => ({
      id: `transfer-${transfer.id}`,
      date: transfer.date,
      type: transfer.type,
      asset: transfer.asset,
      btc_amount: transfer.amount_btc,
      usd_value: transfer.amount_fiat,
      fee_usd: transfer.fee_amount_btc ? transfer.fee_amount_btc * (transfer.price || 0) : null,
      price_at_tx: transfer.price,
      exchange: null,
      network_fee_btc: transfer.fee_amount_btc,
      txid: transfer.hash
    }))

    // Combine and sort by date descending
    const allTransactions = [...mappedOrders, ...mappedTransfers].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    console.log(`Successfully fetched and combined ${allTransactions.length} transactions`)
    return { data: allTransactions, error: null }

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

/**
 * Uploads a CSV file to Supabase Storage and creates a record in the csv_uploads table
 */
export async function uploadCSVFile(file: File) {
  const supabaseClient = createBrowserClient()
  
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('User not authenticated')
    
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop()
    const uniqueId = crypto.randomUUID()
    const fileName = `${uniqueId}.${fileExt}`
    const storagePath = `${user.id}/${fileName}`
    
    // Upload the file to Supabase Storage
    const { data: storageData, error: storageError } = await supabaseClient.storage
      .from('csv_uploads')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })
      
    if (storageError) throw storageError
    
    // Create a record in the csv_uploads table
    const { data: csvUpload, error: dbError } = await supabaseClient
      .from('csv_uploads')
      .insert({
        user_id: user.id,
        filename: storagePath,
        original_filename: file.name,
        status: 'pending',
        file_size: file.size
      })
      .select()
      .single()
      
    if (dbError) {
      // If the database insert fails, delete the uploaded file to maintain consistency
      await supabaseClient.storage.from('csv_uploads').remove([storagePath])
      throw dbError
    }
    
    return { data: csvUpload, error: null }
    
  } catch (error) {
    console.error('Error in uploadCSVFile:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to upload CSV file') 
    }
  }
}

/**
 * Update CSV upload status in the database
 */
export async function updateCSVUploadStatus(
  csvUploadId: string,
  status: 'pending' | 'processing' | 'completed' | 'error',
  details?: {
    rowCount?: number;
    importedRowCount?: number;
    errorMessage?: string;
  }
) {
  const supabaseClient = createBrowserClient()

  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('User not authenticated')

    // Explicitly map keys to snake_case database columns
    const updateData: Partial<Database['public']['Tables']['csv_uploads']['Update']> = {
      status,
    }
    if (details?.rowCount !== undefined) {
      updateData.row_count = details.rowCount
    }
    if (details?.importedRowCount !== undefined) {
      updateData.imported_row_count = details.importedRowCount
    }
    if (details?.errorMessage !== undefined) {
      updateData.error_message = details.errorMessage
    }

    const { data, error } = await supabaseClient
      .from('csv_uploads')
      .update(updateData)
      .eq('id', csvUploadId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }

  } catch (error) {
    console.error('Error updating CSV upload status:', error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to update CSV upload status')
    }
  }
}

/**
 * Get all CSV uploads for the current user
 */
export async function getCSVUploads() {
  const supabaseClient = createBrowserClient()
  
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabaseClient
      .from('csv_uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return { data, error: null }
    
  } catch (error) {
    console.error('Error in getCSVUploads:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to get CSV uploads') 
    }
  }
}

/**
 * Delete a CSV upload and its associated file
 */
export async function deleteCSVUpload(csvUploadId: string) {
  const supabaseClient = createBrowserClient()
  
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('User not authenticated')
    
    // First, get the file path
    const { data: csvUpload, error: getError } = await supabaseClient
      .from('csv_uploads')
      .select('filename')
      .eq('id', csvUploadId)
      .eq('user_id', user.id)
      .single()
      
    if (getError || !csvUpload) throw getError || new Error('CSV upload not found')
    
    // Delete the file from storage
    if (csvUpload.filename) {
      const { error: storageError } = await supabaseClient.storage
        .from('csv_uploads')
        .remove([csvUpload.filename])
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue anyway, as we want to delete the database record
      }
    }
    
    // Delete the database record - this will cascade delete related transactions
    const { error: deleteError } = await supabaseClient
      .from('csv_uploads')
      .delete()
      .eq('id', csvUploadId)
      .eq('user_id', user.id)
      
    if (deleteError) throw deleteError
    
    return { success: true, error: null }
    
  } catch (error) {
    console.error('Error in deleteCSVUpload:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to delete CSV upload') 
    }
  }
} 