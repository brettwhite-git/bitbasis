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
        details: 'Could not insert transactions'
      } 
    }
  }
}

export async function getTransactions() {
  const supabase = createClientComponentClient<Database>()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    console.error('Auth error or no user:', authError)
    return { data: { orders: [], transfers: [] }, error: authError || new Error('Not authenticated') }
  }

  const userId = authData.user.id

  try {
    const [ordersResult, transfersResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true }),
      supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
    ])

    if (ordersResult.error) throw ordersResult.error
    if (transfersResult.error) throw transfersResult.error

    return {
      data: {
        orders: ordersResult.data || [],
        transfers: transfersResult.data || []
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { 
      data: { orders: [], transfers: [] }, 
      error: error as PostgrestError 
    }
  }
}

export async function uploadCSVFile(file: File) {
  const supabase = createClientComponentClient<Database>()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    console.error('Auth error or no user for upload:', authError)
    return { data: null, error: { message: 'Authentication required for upload' } }
  }

  const userId = authData.user.id
  const storageFileName = `${userId}/${new Date().toISOString()}-${file.name}`

  try {
    console.log("Attempting to insert CSV upload record with:", {
      user_id: userId,
      filename: storageFileName,
      original_filename: file.name,
      file_size: file.size,
      status: 'pending'
    });

    // 1. Create an entry in the csv_uploads table
    const { data: uploadEntry, error: insertError } = await supabase
      .from('csv_uploads')
      .insert({
        user_id: userId,
        filename: storageFileName,          // Changed from file_name
        original_filename: file.name,        // New required field
        file_size: file.size,                // New required field
        status: 'pending',
        row_count: 0 // Initialize row count
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating CSV upload entry:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return { data: null, error: { message: `Failed to log upload: ${insertError.message}` } }
    }

    const csvUploadId = uploadEntry.id

    // 2. Upload the file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('csv_uploads')  // Changed from 'csv-files' to match your bucket name
      .upload(storageFileName, file, {
        contentType: 'text/csv'
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      // Update status to error if storage fails
      await updateCSVUploadStatus(csvUploadId, 'error', { errorMessage: `Storage error: ${storageError.message}` })
      return { data: null, error: { message: `Failed to upload file: ${storageError.message}` } }
    }

    console.log('Successfully uploaded file:', storageData)

    // 3. Update status to processing (optional, can be done by background job)
    await updateCSVUploadStatus(csvUploadId, 'processing')

    // 4. Return the ID for tracking
    return { data: { id: csvUploadId }, error: null }

  } catch (error) {
    console.error('Error uploading CSV:', error)
    return { data: null, error: { message: 'An unexpected error occurred during upload' } }
  }
}

export async function updateCSVUploadStatus(
  csvUploadId: string,
  status: 'pending' | 'processing' | 'completed' | 'error',
  details?: {
    rowCount?: number;
    importedRowCount?: number;
    errorMessage?: string;
  }
) {
  const supabase = createClientComponentClient<Database>()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    console.error('Auth error during status update')
    return { error: new Error('Authentication required') }
  }

  try {
    const updateData: Partial<Database['public']['Tables']['csv_uploads']['Update']> = {
      status
      // 'updated_at' is handled automatically by Supabase, no need to specify
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

    const { error } = await supabase
      .from('csv_uploads')
      .update(updateData)
      .eq('id', csvUploadId)
      .eq('user_id', authData.user.id)

    if (error) {
      console.error(`Error updating CSV upload ${csvUploadId} status to ${status}:`, error)
      return { error }
    }

    console.log(`CSV upload ${csvUploadId} status updated to ${status}`)
    return { error: null }
  } catch (err) {
    console.error('Unexpected error updating CSV status:', err)
    return { error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

export async function getCSVUploads() {
  const supabase = createClientComponentClient<Database>()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    console.error('Auth error or no user fetching CSV uploads:', authError)
    return { data: [], error: authError || new Error('Not authenticated') }
  }

  try {
    const { data, error } = await supabase
      .from('csv_uploads')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching CSV uploads:', error)
    return { data: [], error: error as PostgrestError }
  }
}

export async function deleteCSVUpload(csvUploadId: string) {
  const supabase = createClientComponentClient<Database>()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    console.error('Auth error during CSV deletion:', authError)
    return { data: null, error: { message: 'Authentication required' } }
  }

  const userId = authData.user.id

  try {
    // 1. Get the CSV upload entry to find the storage path (filename)
    const { data: uploadEntry, error: fetchError } = await supabase
      .from('csv_uploads')
      .select('filename')
      .eq('id', csvUploadId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error(`Error fetching CSV upload ${csvUploadId} for deletion:`, fetchError)
      return { data: null, error: { message: fetchError.message || 'CSV record not found' } }
    }

    if (!uploadEntry?.filename) {
      console.warn(`CSV upload ${csvUploadId} has no filename, deleting DB entry only.`)
    }

    // 2. Delete associated orders and transfers first (optional, depending on RLS/cascade)
    // await supabase.from('orders').delete().eq('csv_upload_id', csvUploadId)
    // await supabase.from('transfers').delete().eq('csv_upload_id', csvUploadId)
    
    // 3. Delete the entry from the csv_uploads table
    const { error: deleteDbError } = await supabase
      .from('csv_uploads')
      .delete()
      .eq('id', csvUploadId)
      .eq('user_id', userId)

    if (deleteDbError) {
      console.error(`Error deleting CSV upload entry ${csvUploadId} from DB:`, deleteDbError)
      return { data: null, error: { message: deleteDbError.message || 'Failed to delete database record' } }
    }

    // 4. Delete the file from Supabase Storage (if path exists)
    if (uploadEntry.filename) {
      const { error: deleteStorageError } = await supabase.storage
        .from('csv_uploads')  // Changed from 'csv-files' to match your bucket name
        .remove([uploadEntry.filename])

      if (deleteStorageError) {
        // Log warning but don't fail the whole operation if storage deletion fails
        console.warn(`Failed to delete file ${uploadEntry.filename} from storage:`, deleteStorageError)
      }
    }

    console.log(`Successfully deleted CSV upload ${csvUploadId} and associated data/file.`)
    return { data: { success: true }, error: null }
  } catch (error) {
    console.error(`Unexpected error deleting CSV upload ${csvUploadId}:`, error)
    return { data: null, error: { message: 'An unexpected error occurred during deletion' } }
  }
} 