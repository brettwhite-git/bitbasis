# API Call and Data Fetching Strategy

This document outlines the strategy for managing external API calls, updating Supabase tables, and fetching data for the BitBasis client application. The primary goal is to optimize performance, reduce client-side load, and leverage Supabase features effectively.

## 1. Server-Side Data Fetching & Processing (Supabase)

We will utilize Supabase Cron Jobs and Database Functions/Views to handle external data fetching and core calculations server-side.

### 1.1. Supabase Cron Jobs

Scheduled jobs will run periodically to fetch data from external sources and update our dedicated database tables.

*   **Bitcoin Spot Price (`spot_price` table):**
    *   **Schedule:** `*/10 * * * *` (Every 10 minutes - Adjust based on Coinpaprika rate limits and desired freshness)
    *   **Action:** Call Coinpaprika API for the current BTC spot price.
    *   **Target Table:** `spot_price`
    *   **Logic:** Update (or insert if table is designed for history) the latest spot price. Consider keeping only the most recent entry.
*   **Bitcoin ATH (`ath` table):**
    *   **Schedule:** `0 0 * * *` (Midnight UTC daily)
    *   **Action:** Call Coinpaprika API to check for Bitcoin All-Time High data.
    *   **Target Table:** `ath`
    *   **Logic:** Update the table if a new ATH is reported or if the table is empty.
*   **Daily Fear & Greed Index (`fear_greed_index` table):**
    *   **Schedule:** `0 1 * * *` (1 AM UTC daily - Allow time for index publication)
    *   **Action:** Call CoinMarketCap API (or alternative if needed) for the Fear & Greed Index.
    *   **Target Table:** `fear_greed_index`
    *   **Logic:** Insert the daily index value with the corresponding date.

### 1.2. Supabase Database Functions & Views

SQL functions and views will perform calculations directly within the database, minimizing data transfer and client-side computation.

*   **View: `user_portfolio_metrics` (Example)**
    *   **Purpose:** Calculate core metrics for a specific user.
    *   **Inputs:** `user_id`
    *   **Outputs:** `total_btc`, `total_cost_basis`, `average_buy_price`, `unrealized_gains` (calculated based on a join with the `spot_price` table).
    *   **Logic:** Implement calculations based on the `orders` table as defined in `docs/calculations.md`.
*   **Function: `get_fear_greed_history()` (Example)**
    *   **Purpose:** Retrieve specific historical Fear & Greed values.
    *   **Inputs:** Timeframes (e.g., 'yesterday', '7d', '1m')
    *   **Outputs:** Corresponding index values from `fear_greed_index`.
    *   **Logic:** Query the `fear_greed_index` table based on date calculations.

## 2. Client-Side Data Fetching (Next.js)

The client will primarily fetch pre-processed data from Supabase views and functions.

### 2.1. Reusable Data Hook (`usePortfolioMetrics`)

*   **Purpose:** Provide a centralized way to access all necessary portfolio data.
*   **Functionality:**
    *   Fetch the latest `spot_price`.
    *   Fetch the latest `ath` data.
    *   Fetch recent `fear_greed_index` data using the `get_fear_greed_history()` function.
    *   **(Optional) Realtime:** Subscribe to changes in `spot_price` and potentially the user's `orders` table via Supabase Realtime to update the UI dynamically.
*   **Benefits:** Reduces the number of distinct data-fetching calls, simplifies component logic, promotes reusability.

### 2.2. Direct Table Queries (Minimal)

Direct queries to tables like `orders` or `transfers` should be limited, primarily used for displaying raw data lists (e.g., in the Settings section) rather than for calculations.
Check before implementing any significant changes here. 

## 3. Logging Strategy

*   **Supabase Cron Jobs/Functions:** Use `console.log` or Supabase's built-in logging mechanisms within the function code to track execution, API calls, and errors. Monitor logs via the Supabase dashboard.
*   **Client-Side:** Use standard browser `console.log` for debugging during development. Consider integrating a lightweight logging library (e.g., Sentry, LogRocket) for production error tracking if needed.

## 4. Action Plan

1.  [X] Create this `docs/api_strategy.md` document.
2.  [X] Define and create SQL migration files for the new tables: `spot_price`, `ath`, `fear_greed_index` 
3.  [X] Apply the migrations to the local Supabase instance.
4.  [X] Implement Supabase Edge Functions (Spot Price, ATH, Fear & Greed) that will fetch data from external APIs and update the newly created tables.
5.  [X] Implement basic logging within Supabase Edge Functions used by Cron Jobs.
6.  [X]Verify Edge Functions are running correctly and populating the tables.
7.  [ ] Create Supabase Database Functions and Views (e.g., `user_portfolio_metrics`, `get_fear_greed_history`) that query the populated tables and the existing `orders` table. Write and test SQL.
8.  [ ] Implement the `usePortfolioMetrics` hook in the Next.js application to fetch data from the views/functions.
9.  [ ] Refactor client-side components to use the `usePortfolioMetrics` hook.
10. [ ] Test the end-to-end flow: table creation, edge function updates, view/function calculations, and client data fetching.

## 5. Implementation Progress

### 5.1. Completed Tasks

- Created and deployed Edge Functions for all external API data sources:
  - `update-spot-price`: Updates Bitcoin spot price from Coinpaprika API (runs every 10 minutes)
  - `update-btc-ath`: Monitors for new Bitcoin all-time high prices (runs daily at midnight UTC)
  - `update-fear-greed`: Updates the Fear & Greed Index using Alternative.me API (runs daily at 1 AM UTC)

- Deployed all necessary tables and schemas:
  - `spot_price`: Stores the latest Bitcoin price (with cleanup to retain only the most recent 100 entries)
  - `ath`: Tracks Bitcoin's all-time high price information
  - `fear_greed_index`: Stores daily Fear & Greed Index values with classifications

- Implemented logging for all API operations to track execution status and errors

### 5.2. Next Steps

- Implement the core SQL views and functions for portfolio metrics calculations
- Develop the client-side hooks for data fetching
- Test end-to-end data flow from API to UI

-----------------
-----------------

# API Implementation Status

This document tracks the implementation status of the data fetching and API strategy defined in `.cursor/rules/api_strategy.md`.

## 1. Tables and Schema

### 1.1 Core Tables

| Table Name | Status | Description |
|------------|--------|-------------|
| `spot_price` | ✅ Implemented | Stores current Bitcoin price data |
| `ath` | ✅ Implemented | Tracks Bitcoin all-time high prices |
| `fear_greed_index` | ✅ Pre-existing | Stores Fear & Greed Index data |
| `price_update_logs` | ✅ Pre-existing | Logs API calls and updates |

### 1.2 RLS Policies

All tables have appropriate Row Level Security (RLS) policies implemented:
- Authenticated users can read data
- Only service role can modify data

## 2. Edge Functions

| Function Name | Status | Schedule | Description |
|---------------|--------|----------|-------------|
| `update-spot-price` | ✅ Implemented | `*/10 * * * *` | Updates BTC price every 10 minutes |
| `update-btc-ath` | ✅ Implemented | `0 0 * * *` | Checks for new ATH daily at midnight UTC |
| `update-fear-greed` | ✅ Implemented | `0 1 * * *` | Updates Fear & Greed Index daily at 1 AM UTC |

## 3. Database Functions and Views

| Function/View Name | Status | Description |
|------------|--------|-------------|
| `user_portfolio_metrics` view | 🔄 In Progress | View that joins user transactions with pricing data |
| `get_fear_greed_history()` function | 🔄 In Progress | Function to get historical Fear & Greed data |

## 4. Client-side Integration

| Component | Status | Description |
|------------|--------|-------------|
| `usePortfolioMetrics` hook | ⏱️ Pending | React hook to fetch portfolio metrics data |
| Dashboard components | ⏱️ Pending | UI components to display metrics |

## 5. Testing Status

| Test Type | Status | Description |
|------------|--------|-------------|
| Edge Function Local Testing | ⏱️ Pending | Test functions in local Supabase instance |
| Edge Function Remote Testing | ⏱️ Pending | Test functions in production Supabase instance |
| Data Consistency Checks | ⏱️ Pending | Verify calculation accuracy |
| E2E Flow Testing | ⏱️ Pending | Test full data flow from API to UI |

## 6. Next Steps

1. Verify Edge Functions are working properly by testing them in the local environment
2. Complete the implementation of database views and functions for portfolio metrics
3. Create the client-side hooks to access this data
4. Integrate the hooks into the Dashboard UI components
5. Perform comprehensive testing to ensure data consistency

## 7. Known Issues & Challenges

- TypeScript type definitions in Edge Functions need the appropriate Deno types
- Remote database connection issues (need to resolve authentication problem)
- Coinpaprika API has rate limits that need to be managed in production 