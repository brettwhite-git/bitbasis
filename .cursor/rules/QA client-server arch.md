# BitBasis Architecture Review & Optimization Plan

## 1. Introduction

This document provides an assessment of the BitBasis project's current architecture, focusing on client/server best practices, component reuse, data fetching, performance optimization, and scalability, particularly concerning the Next.js (App Router) and Supabase stack.

## 2. Current Architecture Assessment

The project demonstrates a solid foundation leveraging modern web development practices:

*   **✅ Strong Client/Server Separation:** Effective use of Next.js App Router with Server Components (`async` page components) for initial data fetching (`app/dashboard/page.tsx`) and Client Components likely used for interactivity (e.g., `DashboardContent`).
*   **✅ Secure & Efficient Auth:** Server-side authentication checks (`lib/server-auth.ts`) protect routes and data fetching. Client-side auth providers (`SupabaseAuthProvider`, `SupabaseProvider`) manage the session state.
*   **✅ Data Fetching Abstraction:** Data fetching logic is well-encapsulated within the `lib` directory (e.g., `lib/portfolio.ts`), separating concerns from UI components.
*   **✅ Parallel Initial Loads:** `Promise.all` is used for concurrent data fetching on the server during initial page loads.
*   **✅ Organized Components:** The `components` directory structure (by feature and shared elements like `ui`, `shared`) promotes modularity and reusability.
*   **✅ Server-Side CSV Handling:** Acknowledged plan to process CSVs server-side and store raw files in Supabase Storage is correct.

## 3. Key Areas for Review & Optimization

While the foundation is strong, the following areas warrant review for potential optimization and scalability improvements:

*   **Data Fetching & Database Interaction (`lib/*`, `supabase/migrations`):**
    *   **Query Efficiency:** Review all Supabase queries (especially within `lib/portfolio.ts`, `lib/calculations.ts`).
        *   Are `select()` statements specific, fetching only required columns?
        *   Are filters (`eq`, `in`, `gte`, etc.) applied effectively server-side?
        *   Can complex joins or data transformations be optimized?
    *   **Indexing:** Ensure database indexes are strategically placed on columns frequently used in `WHERE` clauses, `JOIN` conditions, and `ORDER BY` clauses (e.g., `user_id`, `date`, `type`, `asset` in the `orders` table). Analyze query plans if performance issues arise. Use `pg_stat_statements` extension in Supabase if needed.
*   **Client Interaction & Mutations:**
    *   **Server Actions:** Evaluate the use of Next.js Server Actions for form submissions, data mutations (adding/deleting records), and subsequent data re-fetching triggered by client events. They often simplify logic and improve security compared to manual API routes + client fetches.
    *   **Optimistic UI:** For faster perceived performance during mutations, consider implementing optimistic UI updates.
*   **Caching Strategy:**
    *   **Server Component Caching:** Leverage Next.js fetch caching and revalidation (`next: { revalidate: <seconds> }` or Route Segment Config). Define appropriate revalidation periods for data like BTC prices, Fear & Greed index, and potentially user portfolio data (e.g., revalidate every few minutes or on demand after mutation).
    *   **External API Data:** Implement robust caching for external API calls (Coinpaprika, CoinMarketCap) using scheduled functions (like Supabase Cron Jobs or Vercel Cron Jobs) to populate `historical_prices`, `spot_price`, etc., avoiding rate limits and improving response times.
*   **Client-Side Performance:**
    *   **Bundle Size Analysis:** Regularly use `@next/bundle-analyzer` to monitor JavaScript bundle sizes shipped to the client.
    *   **Code Splitting:** Apply `next/dynamic` to load large components or libraries lazily (e.g., charting libraries, complex modals/forms) only when needed.
    *   **React Memoization:** Use `React.memo`, `useCallback`, and `useMemo` judiciously in Client Components to prevent unnecessary re-renders and computations.
*   **CSV Processing:**
    *   **Memory Efficiency:** Ensure the server-side parsing logic can handle large files without consuming excessive memory (consider streams if applicable).
    *   **Background Jobs:** For uploads > ~10MB (or based on testing), use background jobs (Supabase Edge Functions, Vercel Functions) to process CSVs asynchronously, providing immediate feedback to the user and preventing request timeouts.

## 4. Additional Performance & Scalability Considerations

*   **Authentication:**
    *   **RLS Policy Performance:** Review Row Level Security policies. Complex logic or joins within policies can impact query performance, especially under load. Keep them efficient.
*   **Server-Side Processing:**
    *   **Function Types:** Choose between Vercel Serverless/Edge Functions and Supabase Edge Functions based on execution time limits, required Node APIs, and latency needs (e.g., Edge Functions for quick tasks, Serverless for longer processing like large CSVs).
    *   **Realtime:** If using Supabase Realtime extensively, design subscriptions efficiently (specific filters, minimal data) to manage connection limits and server load.
*   **Client-Side Rendering & State:**
    *   **Rendering Strategy:** Evaluate if SSR is necessary for *all* dashboard sections or if parts could be client-rendered after the initial shell load, potentially improving TTI (Time to Interactive). Balance with SEO needs.
    *   **Web Vitals:** Monitor Core Web Vitals (LCP, FID, CLS) via Vercel Analytics or similar tools to catch real-world performance regressions.
    *   **State Management:** Keep client-side state management lean. Avoid unnecessary global state or overly complex logic that could hinder performance.
*   **Calculations (`lib/calculations.ts`):**
    *   **Calculation Location:** Decide where complex portfolio calculations are best performed:
        *   **Database:** Using SQL functions/views can be fast for aggregations but increases DB load.
        *   **Backend (Server Component/Action):** Good balance, leverages server resources.
        *   **Client:** Increases bundle size and client CPU load, generally avoid for heavy computation.
    *   **Memoization:** Memoize expensive, pure calculation functions server-side or client-side where applicable.
*   **Component Design:**
    *   **Prop Drilling vs. Composition:** Avoid excessive prop drilling. Use component composition or state management solutions where appropriate. Ensure reusable components fetch data efficiently or receive it via props.
    *   **Conditional Rendering:** Optimize how components are conditionally rendered to avoid mounting/unmounting expensive component trees unnecessarily.
*   **Infrastructure & Database:**
    *   **Advanced Indexing:** Explore partial indexes or indexes on expressions if specific complex query patterns are identified as bottlenecks.
    *   **CDN & Asset Optimization:** Ensure Vercel's CDN effectively caches static assets. Use `next/image` for image optimization.

## 5. Actionable Recommendations Summary

1.  **Audit Database Queries:** Prioritize reviewing queries in `lib/` for efficiency (`select`, filters) and ensure proper indexing.
2.  **Adopt Server Actions:** Evaluate and implement Server Actions for mutations and client-triggered data re-fetching.
3.  **Define Caching Strategy:** Set explicit `revalidate` times for Server Component fetches and ensure robust caching for external APIs via scheduled jobs.
4.  **Analyze Bundle & Split Code:** Use `@next/bundle-analyzer` and implement `next/dynamic` for large Client Components/libraries.
5.  **Optimize CSV Uploads:** Confirm memory efficiency and implement background jobs for large file processing.
6.  **Review RLS Policies:** Ensure RLS policies are performant.
7.  **Monitor Web Vitals:** Set up monitoring for Core Web Vitals.
8.  **Optimize Calculation Logic:** Determine the optimal location (DB, Backend, Client) for heavy calculations and apply memoization.
