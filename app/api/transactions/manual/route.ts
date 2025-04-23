import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { page = 1, pageSize = 10, search = '', userId } = requestBody;
    
    // Return unauthorized if no user ID provided
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Calculate pagination parameters
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Base query for orders (buy/sell)
    let ordersQuery = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('csv_upload_id', null) // Only get manually entered transactions (those without a CSV upload ID)
      .order('date', { ascending: false });
    
    // Base query for transfers (deposit/withdrawal)
    let transfersQuery = supabase
      .from('transfers')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('csv_upload_id', null) // Only get manually entered transactions
      .order('date', { ascending: false });
    
    // Apply search filter if provided
    if (search) {
      // Search in orders by exchange
      ordersQuery = ordersQuery.ilike('exchange', `%${search}%`);
      
      // For transfers, we might want to search by transaction hash or other fields
      transfersQuery = transfersQuery.or(`hash.ilike.%${search}%`);
    }
    
    // Execute both queries in parallel
    const [ordersResult, transfersResult] = await Promise.all([
      ordersQuery,
      transfersQuery
    ]);
    
    // Handle any database errors
    if (ordersResult.error) {
      console.error('Error fetching orders:', ordersResult.error);
      return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
    }
    
    if (transfersResult.error) {
      console.error('Error fetching transfers:', transfersResult.error);
      return NextResponse.json({ error: transfersResult.error.message }, { status: 500 });
    }
    
    // Combine and sort results
    const allTransactions = [
      ...(ordersResult.data || []),
      ...(transfersResult.data || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate total count
    const totalCount = (ordersResult.count || 0) + (transfersResult.count || 0);
    
    // Apply pagination to the combined results
    const paginatedTransactions = allTransactions.slice(from, from + pageSize);
    
    return NextResponse.json({
      transactions: paginatedTransactions,
      totalCount,
      page,
      pageSize
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 