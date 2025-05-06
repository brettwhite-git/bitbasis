import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * POST /api/transactions/add
 * 
 * Adds new transactions to the database
 * 
 * Request body:
 * {
 *   transactions: Array of transaction objects
 * }
 * 
 * Response:
 * {
 *   message: Success message,
 *   count: Number of transactions added
 * }
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to add transactions.' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { transactions } = await request.json();
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided.' },
        { status: 400 }
      );
    }
    
    // Transform transactions to match database schema
    const transformedTransactions = transactions.map(transaction => {
      // Create a base transaction object
      const dbTransaction: any = {
        user_id: user.id,
        date: transaction.date,
        type: transaction.type,
        asset: transaction.asset || 'BTC',
        price: transaction.price || null,
        exchange: transaction.exchange || null
      };
      
      // Add type-specific fields
      if (transaction.type === 'buy') {
        dbTransaction.buy_fiat_amount = transaction.usdAmount;
        dbTransaction.buy_currency = 'USD';
        dbTransaction.received_btc_amount = transaction.btcAmount;
        dbTransaction.service_fee = transaction.fees || 0;
        dbTransaction.service_fee_currency = 'USD';
      } 
      else if (transaction.type === 'sell') {
        dbTransaction.sell_btc_amount = transaction.btcAmount;
        dbTransaction.sell_btc_currency = 'BTC';
        dbTransaction.received_fiat_amount = transaction.usdAmount;
        dbTransaction.received_fiat_currency = 'USD';
        dbTransaction.service_fee = transaction.fees || 0;
        dbTransaction.service_fee_currency = 'USD';
      }
      else if (transaction.type === 'deposit') {
        dbTransaction.amount_btc = transaction.btcAmount;
        dbTransaction.price = transaction.price;
        dbTransaction.hash = transaction.txid || null;
      }
      else if (transaction.type === 'withdrawal') {
        dbTransaction.amount_btc = transaction.btcAmount;
        dbTransaction.price = transaction.price;
        dbTransaction.fee_amount_btc = transaction.network_fee || 0;
        dbTransaction.hash = transaction.txid || null;
      }
      
      return dbTransaction;
    });
    
    // Determine which table to insert to based on transaction type
    const orders = transformedTransactions.filter(t => t.type === 'buy' || t.type === 'sell');
    const transfers = transformedTransactions.filter(t => t.type === 'deposit' || t.type === 'withdrawal');
    
    let results = [];
    
    // Insert orders if any
    if (orders.length > 0) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orders)
        .select();
      
      if (orderError) {
        throw new Error(`Error inserting orders: ${orderError.message}`);
      }
      
      results = [...results, ...(orderData || [])];
    }
    
    // Insert transfers if any
    if (transfers.length > 0) {
      const { data: transferData, error: transferError } = await supabase
        .from('transfers')
        .insert(transfers)
        .select();
      
      if (transferError) {
        throw new Error(`Error inserting transfers: ${transferError.message}`);
      }
      
      results = [...results, ...(transferData || [])];
    }
    
    // Return success response
    return NextResponse.json({
      message: `Successfully added ${results.length} transactions.`,
      count: results.length
    });
    
  } catch (error: any) {
    console.error('API Error - /api/transactions/add:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to add transactions.',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 