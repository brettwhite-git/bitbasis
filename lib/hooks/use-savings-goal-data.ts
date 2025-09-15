import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/providers/supabase-auth-provider'; // Use custom auth provider
import type { Database } from '@/types/supabase'; // Use the correct generated types

// Define the structure for the input goal data (subset of SavedGoalData)
interface SavingsGoalInput {
  startDate: string | null | undefined; // ISO string
  targetBtcAmount: number | null | undefined;
}

// Define the structure for the hook's return value
export interface SavingsGoalData {
  btcProgressPercent: number;
  accumulatedBtcSinceStart: number;
  isLoading: boolean;
  error: string | null;
}

// Renamed hook: useSavingsGoalData
export function useSavingsGoalData(goal: SavingsGoalInput | null): SavingsGoalData {
  const supabase = createClientComponentClient<Database>();
  const { user } = useAuth(); // Get user from custom auth provider

  const [progressData, setProgressData] = useState<SavingsGoalData>({
    btcProgressPercent: 0,
    accumulatedBtcSinceStart: 0,
    isLoading: true, // Start in loading state
    error: null,
  });

  useEffect(() => {
    // --- Log conditions for early exit ---
    console.log('Hook useEffect triggered. Goal:', goal ? 'Exists' : 'Null', 'StartDate:', goal?.startDate, 'TargetBTC:', goal?.targetBtcAmount, 'User:', user ? 'Exists' : 'Null');

    // Reset state if goal is removed or user logs out
    if (!goal || !goal.startDate || !goal.targetBtcAmount || !user) {
      // Log *why* we are exiting early
      console.log('Hook exiting early. Reason:', { noGoal: !goal, noStartDate: !goal?.startDate, noTarget: !goal?.targetBtcAmount, noUser: !user });
      setProgressData({
        btcProgressPercent: 0,
        accumulatedBtcSinceStart: 0,
        isLoading: false,
        error: null,
      });
      return;
    }

    // --- Log hook inputs ---
    console.log('useSavingsGoalData running with goal:', goal, 'User ID:', user?.id);

    // Set loading state
    setProgressData(prev => ({ ...prev, isLoading: true, error: null }));

    const fetchAndCalculateProgress = async () => {
      // --- Log right before try block ---
      console.log('Attempting to fetch and calculate...');
      try {
        const { startDate, targetBtcAmount } = goal;
        const userId = user.id;

        // --- Log user ID being used ---
        console.log('Querying with User ID:', userId, 'Start Date:', startDate);

        // Fetch relevant buy and sell transactions since the goal start date using unified transactions table
        const { data: transactions, error: fetchError } = await supabase
          .from('transactions')
          .select('type, sent_amount, sent_currency, received_amount, received_currency')
          .eq('user_id', userId)
          .in('type', ['buy', 'sell'])
          .gte('date', startDate)
          .order('date', { ascending: true });

        // --- Log query results ---
        console.log('Fetched transactions:', transactions, 'Fetch error:', fetchError);

        if (fetchError) {
          console.error('Error fetching transactions:', fetchError);
          throw new Error(`Failed to fetch transaction data: ${fetchError.message}`);
        }

        // Calculate accumulated BTC using unified schema
        let accumulatedBtc = 0;
        transactions?.forEach(tx => {
          if (tx.type === 'buy' && tx.received_currency === 'BTC') {
            // For buy transactions, received_amount is the BTC received
            accumulatedBtc += (parseFloat(String(tx.received_amount)) || 0);
          } else if (tx.type === 'sell' && tx.sent_currency === 'BTC') {
            // For sell transactions, sent_amount is the BTC sold
            accumulatedBtc -= (parseFloat(String(tx.sent_amount)) || 0);
          }
        });

        // Calculate progress percentage (handle targetBtcAmount = 0 or null/undefined)
        const progressPercent = (typeof targetBtcAmount === 'number' && targetBtcAmount > 0)
          ? Math.min(100, Math.max(0, (accumulatedBtc / targetBtcAmount) * 100))
          : 0;

        // Update state with results
        setProgressData({
          btcProgressPercent: progressPercent,
          accumulatedBtcSinceStart: accumulatedBtc,
          isLoading: false,
          error: null,
        });

      } catch (err) {
        console.error('Error in useSavingsGoalData:', err);
        setProgressData({
          btcProgressPercent: 0,
          accumulatedBtcSinceStart: 0,
          isLoading: false,
          error: err instanceof Error ? err.message : 'An unknown error occurred.',
        });
      }
    };

    fetchAndCalculateProgress();

    // Dependencies: Hook should re-run if the goal, start date, target amount, or user changes.
  }, [goal, user, supabase]); // Added goal references and supabase client

  return progressData;
} 