import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { transactionSchema } from '@/types/add-transaction';
import { TransactionLimitService } from '@/lib/subscription/transaction-limits';
import { checkRateLimit, getRateLimitHeaders, RateLimits } from '@/lib/rate-limiting';
import { sanitizeError } from '@/lib/utils/error-sanitization';

/**
 * POST /api/transaction-history/add-unified
 * 
 * Adds new transactions to the unified transactions table
 * 
 * Request body:
 * {
 *   transactions: Array of transaction objects matching the unified schema
 * }
 * 
 * Response:
 * {
 *   message: Success message,
 *   count: Number of transactions added,
 *   data: Array of created transactions
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

    // SEC-004: Rate limiting - 15 requests per hour per user
    const rateLimitResult = checkRateLimit(
      user.id,
      RateLimits.BULK_TRANSACTIONS.limit,
      RateLimits.BULK_TRANSACTIONS.windowMs
    );

    if (!rateLimitResult.allowed) {
      const minutesUntilReset = Math.ceil((rateLimitResult.resetAt - Date.now()) / (60 * 1000));
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many transaction uploads. Please try again in ${minutesUntilReset} minute(s).`,
          retryAfter: minutesUntilReset * 60, // seconds
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
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

    // Validate each transaction against schema
    const validatedTransactions = [];
    for (let i = 0; i < transactions.length; i++) {
      try {
        const validated = transactionSchema.parse(transactions[i]);
        validatedTransactions.push(validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: `Invalid transaction data at index ${i}`,
              details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
              }))
            },
            { status: 400 }
          );
        }
        throw error;
      }
    }

    // Validate transaction limits (safety net)
    const limitResult = await TransactionLimitService.validateBulkTransactionAdd(user.id, validatedTransactions.length);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Transaction limit exceeded',
          message: limitResult.message,
          currentCount: limitResult.currentCount,
          maxAllowed: limitResult.maxAllowed
        },
        { status: 403 }
      );
    }

    // Get current BTC price if not provided for each transaction
    const getCurrentBTCPrice = async () => {
      try {
        // First try to get from our database
        const { data: priceData } = await supabase
          .from('spot_price')
          .select('price')
          .order('date', { ascending: false })
          .limit(1)
          .single();
        
        return priceData?.price || null;
      } catch (error) {
        console.warn('Could not fetch BTC price from database:', error);
        return null;
      }
    };

    const currentPrice = await getCurrentBTCPrice();

    // Transform and prepare transactions for database insertion
    console.log('Debug: Processing transactions with csv_upload_id:', validatedTransactions[0]?.csv_upload_id)
    const dbTransactions = validatedTransactions.map(transaction => {
      const dbTransaction: Record<string, unknown> = {
        user_id: user.id,
        date: new Date(transaction.date).toISOString(),
        type: transaction.type,
        asset: transaction.asset || 'BTC',
        price: transaction.price || currentPrice,
        comment: transaction.comment || null,
        csv_upload_id: transaction.csv_upload_id || null, // Include CSV upload ID for tracking
      };

      // Map transaction-specific fields based on type
      switch (transaction.type) {
        case 'buy':
          dbTransaction.sent_amount = transaction.sent_amount;
          dbTransaction.sent_currency = 'USD'; // Always USD for buy transactions
          dbTransaction.received_amount = transaction.received_amount;
          dbTransaction.received_currency = transaction.received_currency || 'BTC';
          dbTransaction.fee_amount = transaction.fee_amount || null;
          dbTransaction.fee_currency = transaction.fee_amount ? 'USD' : null; // Always USD for buy fees
          dbTransaction.from_address_name = transaction.from_address_name || null;
          dbTransaction.to_address_name = transaction.to_address_name || null;
          
          // Calculate cost basis for buy transactions
          dbTransaction.sent_cost_basis = transaction.sent_amount; // Fiat paid = cost basis
          dbTransaction.received_cost_basis = transaction.sent_amount; // BTC received gets same cost basis
          if (transaction.fee_amount && transaction.fee_currency === transaction.sent_currency) {
            dbTransaction.fee_cost_basis = transaction.fee_amount;
          }
          break;

        case 'sell':
          dbTransaction.sent_amount = transaction.sent_amount;
          dbTransaction.sent_currency = transaction.sent_currency || 'BTC';
          dbTransaction.received_amount = transaction.received_amount;
          dbTransaction.received_currency = 'USD'; // Always USD for sell transactions
          dbTransaction.fee_amount = transaction.fee_amount || null;
          dbTransaction.fee_currency = transaction.fee_amount ? 'USD' : null; // Always USD for sell fees
          dbTransaction.from_address_name = transaction.from_address_name || null;
          dbTransaction.to_address_name = transaction.to_address_name || null;
          
          // Calculate realized return for sell transactions
          const sellPrice = transaction.price || currentPrice;
          if (sellPrice) {
            dbTransaction.sent_cost_basis = transaction.sent_amount * sellPrice; // BTC sold at current price
            dbTransaction.realized_return = transaction.received_amount - (transaction.sent_amount * sellPrice);
          }
          if (transaction.fee_amount && transaction.fee_currency === transaction.received_currency) {
            dbTransaction.fee_cost_basis = transaction.fee_amount;
          }
          break;

        case 'deposit':
          dbTransaction.received_amount = transaction.received_amount;
          dbTransaction.received_currency = transaction.received_currency || 'BTC';
          dbTransaction.fee_amount = transaction.fee_amount || null;
          dbTransaction.fee_currency = transaction.fee_currency || 'BTC';
          dbTransaction.from_address = transaction.from_address || null;
          dbTransaction.from_address_name = transaction.from_address_name || null;
          dbTransaction.to_address = transaction.to_address || null;
          dbTransaction.to_address_name = transaction.to_address_name || null;
          dbTransaction.transaction_hash = transaction.transaction_hash || null;
          
          // Cost basis for deposits (if price available)
          const depositPrice = transaction.price || currentPrice;
          if (depositPrice) {
            dbTransaction.received_cost_basis = transaction.received_amount * depositPrice;
            if (transaction.fee_amount) {
              dbTransaction.fee_cost_basis = transaction.fee_amount * depositPrice;
            }
          }
          break;

        case 'withdrawal':
          dbTransaction.sent_amount = transaction.sent_amount;
          dbTransaction.sent_currency = transaction.sent_currency || 'BTC';
          dbTransaction.fee_amount = transaction.fee_amount || null;
          dbTransaction.fee_currency = transaction.fee_currency || 'BTC';
          dbTransaction.from_address = transaction.from_address || null;
          dbTransaction.from_address_name = transaction.from_address_name || null;
          dbTransaction.to_address = transaction.to_address || null;
          dbTransaction.to_address_name = transaction.to_address_name || null;
          dbTransaction.transaction_hash = transaction.transaction_hash || null;
          
          // No cost basis changes for withdrawals (just tracking movement)
          break;

        case 'interest':
          dbTransaction.received_amount = transaction.received_amount;
          dbTransaction.received_currency = transaction.received_currency || 'BTC';
          dbTransaction.from_address_name = transaction.from_address_name || null;
          dbTransaction.to_address_name = transaction.to_address_name || null;
          
          // Cost basis for interest (treated as income at current price)
          const interestPrice = transaction.price || currentPrice;
          if (interestPrice) {
            dbTransaction.received_cost_basis = transaction.received_amount * interestPrice;
          }
          break;

        default:
          throw new Error(`Unsupported transaction type: ${(transaction as { type: string }).type}`);
      }

      return dbTransaction;
    });

    // Insert transactions into unified table
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(dbTransactions)
      .select();
    
    if (insertError) {
      // SEC-010: Sanitize error message before returning to client
      const sanitized = sanitizeError(insertError, 'Failed to save transactions to database', 'transaction insert')
      return NextResponse.json(
        sanitized,
        { status: 500 }
      );
    }

    // Invalidate dashboard cache to ensure fresh data on next page load
    // This is critical for production where server components are aggressively cached
    revalidatePath('/dashboard');

    // Return success response with rate limit headers
    return NextResponse.json({
      message: `Successfully added ${insertedTransactions.length} transaction(s).`,
      count: insertedTransactions.length,
      data: insertedTransactions
    }, {
      headers: getRateLimitHeaders(rateLimitResult),
    });
    
  } catch (error: unknown) {
    // SEC-010: Sanitize error message before returning to client
    const sanitized = sanitizeError(error, 'Failed to add transactions', 'bulk transaction add')
    
    return NextResponse.json(
      sanitized,
      { status: 500 }
    );
  }
} 