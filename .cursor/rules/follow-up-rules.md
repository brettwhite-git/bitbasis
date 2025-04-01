# Key Discussion Points Summary

## 1. Local Development Setup
*   Current local setup (Supabase CLI, Docker, `.env`, migrations) follows best practices.

## 2. Supabase Client Usage & Security
*   Generally using `@supabase/auth-helpers-nextjs` correctly (client, server, middleware).
*   **Action Item (Security):** Refactor API routes (`app/api/bitcoin/...`, `app/api/cron/...`) to **stop** using the `service_role` key directly.
    *   Prefer Supabase Edge Functions or `SECURITY DEFINER` Postgres functions called via RPC.
*   **Action Item:** Review helper functions in `lib/supabase.ts` (`insertTransactions`, `checkEmailExists`) to ensure correct client type (client vs. server) is used based on context.
*   **Action Item (Manual):** Critically review and test **Row Level Security (RLS)** policies in the Supabase dashboard for all tables with user data (`orders`, `send`, `receive`, etc.). Ensure they are enabled and correctly use `auth.uid() = user_id`.
*   Never expose the `service_role` key client-side.

## 3. Calculations (Portfolio/KPIs)
*   Complex portfolio calculations (`getPortfolioMetrics`, etc.) are correctly performed **server-side** in Next.js Server Components (Good!).
*   *Potential Enhancement:* Consider moving calculation logic into Supabase Database Functions (SQL) and calling via `supabase.rpc(...)` for better performance.

## 4. Shared Data Updates (e.g., Price Fetching)
*   **Recommendation:** Use **Supabase Edge Functions** for scheduled/background tasks like fetching external price data and updating shared tables (e.g., `bitcoin_prices`). Avoid the insecure API route pattern currently used.

## 5. Database Design (Price Table)
*   **Current:** Single `bitcoin_prices` table (workable for MVP, but has ATH redundancy).
*   **Recommendation (Better Long-Term):** Separate tables:
    *   `historical_prices` (date, price_usd)
    *   `asset_metadata` (ticker, current_price_usd, current_price_last_updated, ath_price_usd, ath_date)
    *   This improves normalization, reduces redundancy, and simplifies updates.

## 6. Bulk Data Import (e.g., Historical Prices)
*   **Method:** Use a secure **server-side** process (Next.js API Route or Supabase Edge Function).
*   **Endpoint Security:** Protect the import endpoint (admin check, secret key, etc.).
*   **Process:**
    1.  Fetch data from external source server-side.
    2.  Format data into an array matching the Supabase table structure.
    3.  Use Supabase's bulk `insert()` method with `ON CONFLICT` (upsert) handling.
*   **Considerations:** Execution time limits, error handling for bulk operations.
