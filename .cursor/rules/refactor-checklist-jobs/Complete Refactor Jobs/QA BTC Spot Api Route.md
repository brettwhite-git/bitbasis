# Refactoring Plan: Bitcoin Spot Price Integration

**Goal:** Replace all instances of fetching Bitcoin prices from the old `bitcoin_prices` or `historical_prices` tables and any hardcoded values with a new, unified system utilizing the `spot_price` table for near real-time data.

**New Approach:**

We will implement a three-part system for fetching and distributing the latest Bitcoin spot price:

1.  **Server-Side Utility (`lib/spotPrice.ts`):**
    *   Contains `getLatestSpotPrice()` function.
    *   Fetches the most recent entry from the `spot_price` table.
    *   Uses `React.cache` for server-side request memoization.
    *   **Usage:** Called directly within Server Components or server-side functions (`getServerSideProps`, Route Handlers).

2.  **API Route (`app/api/spot-price/route.ts`):**
    *   A `GET` endpoint that calls `getLatestSpotPrice()`.
    *   Provides a simple interface for client-side fetching.
    *   Includes basic caching headers (`Cache-Control`).

3.  **Client-Side Hook (`hooks/useSpotPrice.ts`):**
    *   Uses `useSWR` to fetch data from `/api/spot-price`.
    *   Provides client components with the spot price, loading/error states, and automatic revalidation (e.g., every 1-2 minutes).
    *   **Usage:** Called within Client Components (`'use client'`).

**Refactoring Targets & Implementation Steps:**

| File / Component                         | Current Method                                      | Required Change                                                                                                | Notes                                                                   |
| :--------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `lib/portfolio.ts`                       | Queries `bitcoin_prices` (lines 171, 494, 500)      | Modify functions (e.g., `getPortfolioPerformance`) to accept `currentPrice` as an argument.                    | The caller (likely a Server Component) will use `getLatestSpotPrice()` to get the price and pass it in. |
| `components/portfolio/tax-liability-card.tsx` | Queries `bitcoin_prices` (line 56)                 | Refactor component (or its parent Server Component) to fetch price using `getLatestSpotPrice()` and pass it down. | If the component is client-side, use the `useSpotPrice` hook.           |
| `components/portfolio/performance-returns.tsx` | Queries `bitcoin_prices` (line 151)                | Refactor component (or its parent Server Component) to fetch price using `getLatestSpotPrice()` and pass it down. | If the component is client-side, use the `useSpotPrice` hook.           |
| `components/calculator/bitcoin-calculator.tsx` | Uses `useState(85000)` for `btcPrice`             | Replace `useState` with `useSpotPrice` hook to fetch and use the live price. Handle loading/error states.      | This is a Client Component, so the hook is appropriate.                 |
| Callers of `lib/calculations.ts`         | Passing potentially stale `currentPrice` parameter. | Ensure callers (likely Server Components) fetch the price using `getLatestSpotPrice()` before calling.        | Trace where `calculatePortfolioMetrics`, `calculateUnrealizedGains` are used. |
| Users of `lib/bitcoin-prices.ts`         | Calling `getCurrentPrice()`, etc. (queries `historical_prices`) | Replace calls to `getCurrentPrice()` with `getLatestSpotPrice()`. Assess if `getHistoricalPrices` needs changes. | May deprecate `lib/bitcoin-prices.ts` if `spot_price` covers all needs. |
| `components/performance/buy-price-references.tsx` | Displays "Current Price" (source unclear)         | Verify price source. If server-rendered, use `getLatestSpotPrice()`. If client-rendered, use `useSpotPrice`.     | Ensure consistency with the new system.                                 |

**Type Definition Updates:**

*   Remove references to `bitcoin_prices` from `lib/database.types.ts` and `types/supabase.ts`.
*   Ensure `spot_price` table definitions are present and accurate in these files (may require regenerating types after database migration if not already done).

**Cleanup:**

*   After verifying all references are removed, consider deleting the old `lib/bitcoin-prices.ts` file if it's no longer needed.
*   Remove any remaining direct queries to `bitcoin_prices` or `historical_prices` (for current price fetching).
*   Eventually, drop the `bitcoin_prices` table from the database if it's truly obsolete.

**Implementation Checklist:**

- [ ] Implement the `lib/spotPrice.ts` utility.
- [ ] Implement the `app/api/spot-price/route.ts` API route.
- [ ] Implement the `hooks/useSpotPrice.ts` hook.
- [ ] Refactor `lib/portfolio.ts`.
- [ ] Refactor `components/portfolio/tax-liability-card.tsx`.
- [ ] Refactor `components/portfolio/performance-returns.tsx`.
- [ ] Refactor `components/calculator/bitcoin-calculator.tsx`.
- [ ] Refactor callers of `lib/calculations.ts`.
- [ ] Refactor users of `lib/bitcoin-prices.ts`.
- [ ] Refactor `components/performance/buy-price-references.tsx`.
- [ ] Update type definitions (`lib/database.types.ts`, `types/supabase.ts`).
- [ ] Test thoroughly across all refactored components and pages.
- [ ] Perform cleanup (delete old files/code, consider dropping old table).
