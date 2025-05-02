Refactored Tax Analysis Feature Implementation Plan
=============================================

**Goal:** Integrate a comprehensive tax analysis section into the Portfolio view, enabling users to compare FIFO, LIFO, and HIFO accounting methods, understand their holding periods, and make informed decisions to potentially minimize tax liability. Calculations will be moved server-side for performance and scalability.

**Location:** New "Tax Analysis" tab within the main Portfolio section.

**I. Backend Implementation (Supabase SQL Functions)**

*   [ ] **Define Core Data Structure:** Ensure the `orders` table contains all necessary fields (`user_id`, `date`, `type`, `received_btc_amount` for buys, `sell_btc_amount` for sells, `buy_fiat_amount`, `service_fee`, `service_fee_currency`).
*   [ ] **Create `calculate_tax_liability` SQL Function:**
    *   **Inputs:** `p_user_id UUID`, `p_sell_amount_btc NUMERIC`, `p_btc_price_usd NUMERIC`, `p_short_term_rate NUMERIC`, `p_long_term_rate NUMERIC`, `p_method TEXT` ('FIFO', 'LIFO', 'HIFO').
    *   **Logic:**
        *   Fetch relevant 'buy' transactions for the user.
        *   Calculate cost basis per lot (including proportional fees).
        *   Determine holding period (short/long) for each lot based on `current_date`.
        *   Sort lots according to the specified `p_method` (date asc for FIFO, date desc for LIFO, cost basis desc for HIFO).
        *   Iterate through sorted lots, matching against `p_sell_amount_btc` to calculate capital gains/losses for each portion sold.
        *   Apply `p_short_term_rate` or `p_long_term_rate` based on holding period.
        *   Handle edge cases (insufficient funds, fees).
    *   **Output:** A record/JSON containing `total_gain_loss NUMERIC`, `estimated_tax NUMERIC`, `short_term_gain NUMERIC`, `long_term_gain NUMERIC`.
*   [ ] **Create Helper Function for Portfolio Composition:**
    *   **Inputs:** `p_user_id UUID`.
    *   **Logic:** Calculate total BTC held, percentage/amount held short-term, percentage/amount held long-term, identify lots nearing long-term status, identify lots currently at a loss (potential tax-loss harvesting).
    *   **Output:** A record/JSON with relevant composition metrics.
*   [ ] **Apply Row Level Security (RLS):** Ensure all functions and underlying table access are restricted to the authenticated user (`auth.uid() = p_user_id`).
*   [ ] **Testing:** Rigorously test SQL functions with various scenarios (small/large sales, different holding periods, fee inclusion, edge cases).

**II. Frontend Implementation (Next.js/React)**

*   [ ] **Create New Component:** `components/portfolio/TaxAnalysisTab.tsx`.
*   [ ] **Add Tab Navigation:** Integrate the "Tax Analysis" tab into the portfolio section's navigation.
*   [ ] **Input Parameters Section:**
        *   Input field: "Amount to Sell (BTC)" (numeric validation).
        *   Input field: "Assumed BTC Price (USD)" (numeric validation, default to current market price).
        *   Input fields: "Short-Term Tax Rate (%)" and "Long-Term Tax Rate (%)" (0-100 validation, default values, persist user overrides).
        *   Button: "Calculate Tax Impact".
*   [ ] **API Integration:**
        *   On "Calculate" button click, call the `calculate_tax_liability` Supabase function via RPC three times (once for each method: FIFO, LIFO, HIFO).
        *   Call the portfolio composition helper function on component load.
*   [ ] **Chart Implementation (using Chart.js or similar):**
    *   **Chart 1: Tax Liability Comparison:**
        *   Type: Grouped Bar Chart.
        *   X-axis: Methods (FIFO, LIFO, HIFO).
        *   Y-axis: Estimated Tax Liability (USD).
        *   Display results from the API calls. Add tooltips with gain/loss details.
    *   **Chart 2: Holding Period Breakdown:**
        *   Type: Donut or Bar Chart.
        *   Data: Show % and amount of BTC held Short-Term vs. Long-Term (from composition API call).
    *   **(Optional) Chart 3: Cost Basis Layers:**
        *   Type: Scatter/Bubble Chart (X: Purchase Date, Y: Cost Basis/BTC, Size: BTC Amount, Color: Short/Long-Term). Fetch detailed lot data if implementing this.
*   [ ] **Dynamic Insights Section:**
        *   Display text insights based on API results and composition data (Optimal method, potential savings, holding period summary, tax-loss harvesting opportunities).
        *   Update dynamically when calculations are re-run.
*   [ ] **Strategic Recommendations Section:**
        *   Provide actionable advice based on insights (e.g., timing considerations for lots nearing long-term, benefits of tax-loss harvesting).
*   [ ] **(Optional) Tax Lot Table:**
        *   Display a detailed table of purchase lots if implementing lot-specific simulation.
*   [ ] **UI Styling:** Apply consistent dark theme, ensure responsiveness.
*   [ ] **Error Handling:** Gracefully handle API errors or scenarios like insufficient funds.

**III. Refactoring & Cleanup**

*   [ ] **Remove Average Cost:** Identify and remove calculations/references to "Average Cost" specifically within the *tax analysis context*. The general "Average Buy Price" metric might remain elsewhere if useful for overall performance.
*   [ ] **Review Existing Components:** Check `performance-returns.tsx` and `tax-liability-card.tsx` for any overlapping logic that can be removed or consolidated.

**IV. Potential Issues & Considerations**

*   **SQL Function Performance:** Monitor execution time for users with very large transaction histories. Consider database indexing on `orders` table (`user_id`, `date`, `type`, `price`).
*   **Fee Allocation:** Accurately allocating `service_fee` across BTC purchased in a single order needs careful implementation (proportional allocation is common).
*   **Wash Sale Rule:** Current plan does not implement wash sale rule detection (complex). Add disclaimer.
*   **Data Accuracy:** Assumes transaction data imported by the user is accurate.
*   **Real-time Price:** Dependency on a reliable, near real-time BTC price feed for default "Assumed Price".
*   **Complexity:** HIFO/LIFO/FIFO logic can be intricate; thorough testing is crucial.
*   **User Experience:** Ensure the UI clearly explains each method and the insights provided. Avoid overwhelming the user.

**V. Ongoing Error/Issue Tracking During Refactor**

*   *(Empty - Add issues as they arise during development)*
*   Issue:
    *   Description:
    *   Status: (Open/In Progress/Resolved)
    *   Resolution:
