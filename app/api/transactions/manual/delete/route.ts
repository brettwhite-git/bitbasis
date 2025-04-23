import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { transactionId, transactionType, userId } = requestBody;
    
    // Return unauthorized if no user ID provided
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate required fields
    if (!transactionId || !transactionType) {
      return NextResponse.json(
        { error: 'Transaction ID and type are required' },
        { status: 400 }
      );
    }
    
    // Validate transaction type
    if (!['buy', 'sell', 'deposit', 'withdrawal'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    let result;
    
    // Delete from the appropriate table based on transaction type
    if (transactionType === 'buy' || transactionType === 'sell') {
      // Delete from orders table
      result = await supabase
        .from('orders')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)
        .eq('type', transactionType)
        .is('csv_upload_id', null); // Only allow deleting manually entered transactions
    } else {
      // Delete from transfers table
      result = await supabase
        .from('transfers')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)
        .eq('type', transactionType)
        .is('csv_upload_id', null); // Only allow deleting manually entered transactions
    }
    
    // Handle any database errors
    if (result.error) {
      console.error(`Error deleting ${transactionType} transaction:`, result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} transaction deleted successfully`
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 