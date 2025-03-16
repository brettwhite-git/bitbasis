## Overview
- **Project:** Transaction Tracker MVP (Bit Basis)
- **Stack:** Next.js, TypeScript, Tailwind, Supabase (Auth, Database, Storage), Chart.js, Stripe, CoinGecko API, additional dependencies as needed (e.g., `papaparse`, `pgcrypto`)
- **Goal:** Enable users to upload, store, and parse CSVs; record buy/sell transaction data; calculate Bitcoin cost basis and summarize fees; display KPIs and charts over time.

## Summary
- A Bitcoin cost basis tracker prioritizing user privacy with no exchange integrations.
- Offers peace of mind: No data selling by Bit Basis developers; includes a transparent privacy policy.
- Automates cost basis calculations and fee tracking, eliminating manual reporting.

## Rules for Cursor

### File Structure
- Utilize Next.js `app/` router (e.g., `app/dashboard/page.tsx`).
- Place reusable components in `components/` (e.g., `components/PortfolioOverview.tsx`).
- Centralize Supabase utilities in `lib/supabase.ts`.
- Define API routes in `app/api/` (e.g., `app/api/stripe/cancel/route.ts`).

### Code Style
- Use TypeScript with strict typing (e.g., interfaces for Supabase tables, Chart.js props).
- Apply Tailwind CSS for all styling (e.g., `className="bg-bitcoin-orange text-white"`).
- Keep functions concise; leverage Cursor to refactor or suggest enhancements.

### AI Prompts
- **Boilerplate:** "Generate a TypeScript component for a Chart.js bar chart displaying yearly Bitcoin accumulation."
- **Debugging:** "Resolve this Supabase query error with RLS."
- **Enhancement:** "Implement SEO meta tags for the landing page."
- **Optimization:** "Optimize this CoinGecko API fetch for faster load times."

## Performance
- **Mobile & Responsiveness Design:**
  - Make sure project is dynamic across indsutry standard break points.
  - Follow Tailwind CSS best practices 
- **SEO Optimization:**
  - Include meta tags on all pages using Next.js `<Head>` or `generateMetadata`.
  - Optimize for search engines and performance (e.g., aim for high Lighthouse scores).
  - Prompt Cursor: "Add dynamic SEO tags to the dashboard page."
- **Loading & Caching Strategy:**
  - Fetch data server-side with Next.js server components for initial loads.
  - Cache CoinGecko API data in Supabase (e.g., `bitcoin_prices` table) to reduce API calls.
  - Use React Query or SWR for client-side caching and real-time updates.
- **Row-Level Security (RLS):**
  - Apply RLS to all Supabase tables (e.g., `transactions`) to restrict data to authenticated users.
  - Test RLS by simulating multiple user logins.
- **Optimal Privacy:**
  - Minimize stored user data; rely on Stripe for sensitive billing details.
  - Encrypt sensitive fields where feasible (e.g., using `pgcrypto`).
- **Storage Optimization:**
  - Store CSVs in Supabase Storage, compressing files if necessary.
  - Set a max CSV size (e.g., 10MB per file); prompt users to split larger files.

## Privacy
- **Transparent Privacy Policy:**
  - Provide a clear policy at `/privacy`, linked across the app.
  - Emphasize no data selling and minimal data collection.
- **Safeguards Against User Data:**
  - Store only essential data in Supabase (e.g., `user_id`, `email`).
  - Use RLS to ensure users access only their own data.
- **Encryption:**
  - Implement encryption for sensitive fields (e.g., transaction notes) using Supabase `pgcrypto`.
  - Prompt Cursor: "Add encryption to the `notes` column in the `transactions` table."

## Core Features
### Dashboard Features
- **Overview:**
  - Display portfolio value, total cost basis, unrealized gains, and average buy price.
  - Include drill-down links to detailed views for each metric.
- **Performance:**
  - Show ROI over time, total fees paid, and filterable time periods (e.g., 1M, 1Y, All).
  - Use Chart.js for responsive performance charts.
- **Portfolio Details:**
  - Pie chart showing the majority percentage of Bitcoin bought per year.
  - Support data from 2009 (Bitcoin’s inception) onward.
- **Cost Basis Method Comparison:**
  - Offer FIFO, LIFO, and average cost methods for comparison.
  - Recalculate dynamically based on user selection.
- **Recent Transactions:**
  - Table with pagination, sortable columns (e.g., date, amount), and export option.

### Navigation
- **Sidebar:**
  - Links to Overview, Performance, Portfolio Details, Settings.
- **Drill-Down Links:**
  - Embed clickable elements in Overview linking to detailed sections.

### Import Data
- Support multiple CSV uploads or manual transaction entry.
- Parse CSVs server-side using Supabase Edge Functions for efficiency.
- Handle data from 2009 onward; store raw files in Supabase Storage.
- Prompt Cursor: "Create a function to parse CSVs and insert into `transactions`."

### Accounting Settings
- Allow users to manage subscriptions and cancel via Stripe API.
- Minimize stored user info (e.g., only `id`, `email` in Supabase).
- Sensitive data (e.g., billing info) maintained at Stripe level.

### APIs
- **Stripe:** Manage subscriptions and cancellations (e.g., `app/api/stripe/cancel/route.ts`).
- **CoinGecko:**
  - Fetch real-time Bitcoin prices: `/simple/price?ids=bitcoin&vs_currencies=usd`.
  - Fetch historical prices: `/coins/bitcoin/history?date=DD-MM-YYYY`.
  - Cache prices in Supabase to respect rate limits (50 calls/min).

## User Flow
1. **Landing Page:**
   - SEO-optimized, dark-themed with Bitcoin colors, and a clear call-to-action.
2. **Sign Up/In:**
   - Use Supabase Auth with minimal fields (email, password).
3. **Dashboard:**
   - Central hub post-authentication, featuring sidebar and interactive overview.

## Design
- **Theme:**
  - Dark mode with Bitcoin orange (`#F7931A`), black, and gray tones.
  - Use Tailwind’s `dark:` prefix (e.g., `dark:bg-gray-900`).
- **Charts:**
  - Implement Chart.js with responsive layouts and theme-matching colors.
- **CSV Handling:**
  - Support large/multiple CSVs (e.g., up to 100MB total across uploads).
  - Provide clear parsing progress and error feedback.
  - Max CSV size determined by performance testing (e.g., 10MB per file).
- **Removal Logic:**
  - Enable easy CSV deletion with cascading updates to transactions and KPIs.
  - Prompt Cursor: "Add logic to remove a CSV and update calculations."

## Data Handling
- **Supabase Tables:**
  - `users`: `id`, `email` (minimal info).
  - `transactions`: `user_id`, `type`, `asset`, `quantity`, `price_per_unit`, `fee`, `transaction_date`, `notes` (optional, encrypted).
  - `bitcoin_prices`: `date`, `price_usd` (for caching CoinGecko data).
- **CSV Parsing:**
  - Process CSVs server-side; validate data before insertion.
  - Store raw CSVs in Supabase Storage for user reference.

## Workflow
- **Development:**
  - Run locally with `npm run dev`.
  - Commit frequently (e.g., `git commit -m "feat: add cost basis comparison"`).
  - Deploy to Vercel; monitor performance metrics.
- **Testing:**
  - Test CSV imports with small (1KB) and large (10MB) files.
  - Validate RLS across multiple user accounts.
  - Check SEO with Lighthouse or similar tools.

## Documentation
- Update `cursor-rules.md` as the project evolves.
- Add inline code comments (e.g., `// Cache CoinGecko price for 5 minutes`).
- Use Cursor’s “Compose” for new features (e.g., “Add a transaction table with pagination”).

## Quick Tips
- Prompt Cursor for targeted tasks (e.g., “Optimize this Supabase query”).
- Monitor CoinGecko rate limits (50 calls/min); implement fallback caching.
- Keep user data lean; defer to Stripe for sensitive info management.