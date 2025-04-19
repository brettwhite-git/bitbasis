import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  // Get user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const userId = session.user.id;

  // Get transaction IDs from request body
  let transactionIds: string[];
  try {
    const body = await request.json();
    if (!Array.isArray(body.transactionIds)) {
      throw new Error('Invalid input: transactionIds must be an array.');
    }
    transactionIds = body.transactionIds;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (transactionIds.length === 0) {
    return NextResponse.json({ message: 'No transaction IDs provided' }, { status: 200 });
  }

  const results = {
    deletedOrders: 0,
    deletedTransfers: 0,
    errors: [] as { id: string; message: string }[],
  };

  // Process deletions individually
  for (const idString of transactionIds) {
    const parts = idString.split('-');
    if (parts.length !== 2) {
      results.errors.push({ id: idString, message: 'Invalid ID format' });
      continue;
    }

    const type = parts[0];
    const numericId = parseInt(parts[1], 10);

    if (isNaN(numericId)) {
      results.errors.push({ id: idString, message: 'Invalid numeric ID part' });
      continue;
    }

    try {
      let deleteError = null;
      if (type === 'order') {
        const { error } = await supabase
          .from('orders')
          .delete()
          .match({ id: numericId, user_id: userId });
        if (!error) results.deletedOrders++;
        deleteError = error;
      } else if (type === 'transfer') {
        const { error } = await supabase
          .from('transfers')
          .delete()
          .match({ id: numericId, user_id: userId });
         if (!error) results.deletedTransfers++;
         deleteError = error;
      } else {
        results.errors.push({ id: idString, message: 'Unknown transaction type in ID' });
        continue; // Skip to next id
      }

      if (deleteError) {
        console.error(`Error deleting ${idString}:`, deleteError);
        results.errors.push({ id: idString, message: deleteError.message });
      }
    } catch (error: any) {
       console.error(`Unexpected error deleting ${idString}:`, error);
       results.errors.push({ id: idString, message: error.message || 'Unexpected error' });
    }
  }

  // Determine response status based on errors
  if (results.errors.length === transactionIds.length) {
    // All deletions failed
    return NextResponse.json({ 
        error: 'Failed to delete any transactions.', 
        details: results.errors 
    }, { status: 500 });
  } else if (results.errors.length > 0) {
     // Partial success
     return NextResponse.json({ 
        message: `Partially completed: Deleted ${results.deletedOrders} orders and ${results.deletedTransfers} transfers. Some errors occurred.`,
        errors: results.errors 
    }, { status: 207 }); // Multi-Status
  } else {
    // Full success
    return NextResponse.json({ 
        message: `Successfully deleted ${results.deletedOrders} orders and ${results.deletedTransfers} transfers.` 
    }, { status: 200 });
  }
} 