# BitBasis Refactoring Plan: Enhancing Modularity

## 1. Introduction & Summary

This document outlines a strategic plan for refactoring the BitBasis codebase to significantly improve its modularity. The primary goals of this refactor are to enhance:

*   **Maintainability:** Make the code easier to understand, modify, and debug.
*   **Scalability:** Allow the application to grow in complexity without becoming unmanageable.
*   **Testability:** Isolate logic to facilitate unit and integration testing.
*   **Performance:** Optimize data fetching, calculations, and enable effective caching.
*   **Developer Experience:** Improve code organization and reduce duplication.

We will achieve this by restructuring the codebase around principles of separation of concerns, creating distinct layers for data access, business logic, UI components, and external service interactions.

## 2. Current Codebase Assessment (Assumptions)

While a direct line-by-line review hasn't been performed, based on the project requirements and typical Next.js development patterns, we can anticipate potential areas for improvement:

*   **Scattered Data Fetching:** Supabase client calls might be dispersed across Server Components, API routes, or even Client Components, leading to duplication and inconsistency.
*   **Logic in UI:** Complex calculations (portfolio metrics, cost basis) or data transformations might reside directly within React components (Server or Client), making them hard to test and reuse.
*   **Component Monoliths:** Some UI components might be doing too much – fetching data, managing complex state, and rendering large sections of the UI.
*   **Inconsistent API Interactions:** Calls to external APIs (CoinPaprika, CoinMarketCap) might be handled inline within components or routes, lacking centralization for error handling, caching, or configuration.
*   **Type Safety Gaps:** While using TypeScript, explicit types or validation schemas might not be consistently applied, especially around data fetching and API boundaries.
*   **Utility Function Placement:** Helper functions (formatting, validation) might be colocated with specific features instead of being centralized for reuse.

## 3. Refactoring Roadmap & Implementation Steps

This roadmap breaks down the refactoring process into logical, modular areas.

### 3.1. Data Access Layer (DAL)

*   **Goal:** Centralize all direct interactions with the Supabase database.
*   **Rationale:** Creates a single source of truth for database operations, simplifies data fetching logic in higher layers, makes it easier to implement caching or logging, isolates Supabase dependencies, reduces code duplication.
*   **Implementation Checklist:**
    *   [ ] Create a directory: `lib/data-access/` (or `services/supabase/`).
    *   [ ] Create files for each primary entity (e.g., `orders.ts`, `transfers.ts`, `btcPrice.ts`, `users.ts`).
    *   [ ] Implement functions within these files for specific CRUD operations (e.g., `getOrdersByUserId(userId)`, `createOrder(orderData)`, `getBtcSpotPrice()`, `insertHistoricalPrices(prices)`, `getUserProfile(userId)`).
    *   [ ] Ensure these functions encapsulate the `createClient` (or `createServerClient`) logic and handle basic data fetching/mutation.
    *   [ ] Define clear TypeScript interfaces/types for function arguments and return values (consider using types generated from Supabase schema).
    *   [ ] Refactor existing Server Components, Server Actions, and API routes to use these DAL functions instead of direct Supabase calls.

### 3.2. Core Business Logic / Domain Layer

*   **Goal:** Isolate critical business calculations and rules from the framework and UI.
*   **Rationale:** Makes core logic highly testable (pure functions), reusable across different parts of the application (e.g., API vs. UI), portable, and easier to understand without framework noise. Enables caching of calculation results.
*   **Implementation Checklist:**
    *   [ ] Create a directory: `lib/domain/` (or `lib/core/`).
    *   [ ] Create files for logical groupings (e.g., `portfolioCalculations.ts`, `validationRules.ts`).
    *   [ ] Implement pure functions for all calculations defined in requirements (e.g., `calculateTotalBtc(orders)`, `calculateCostBasis(buyOrders)`, `calculateUnrealizedGains(totalBtc, currentPrice, costBasis)`, `calculateAverageBuyPrice(costBasis, totalBtcBought)`).
    *   [ ] Ensure these functions accept clearly typed data structures (defined in `types/`) and return calculated results. They should *not* depend on Supabase, Next.js, or React directly.
    *   [ ] Define and implement data validation logic (e.g., checking transaction types, required fields) if not handled solely by database constraints or form validation libraries.
    *   [ ] Refactor areas currently performing these calculations (e.g., dashboard pages, API routes) to import and use these domain functions, passing in data fetched via the DAL.

### 3.3. External API Clients

*   **Goal:** Encapsulate all interactions with third-party APIs.
*   **Rationale:** Isolates external dependencies, centralizes API key management, simplifies error handling and rate-limiting logic, allows for easy mocking during tests, provides a clear point for caching external API responses.
*   **Implementation Checklist:**
    *   [ ] Create a directory: `lib/external-apis/`.
    *   [ ] Create files for each service (e.g., `coinpaprika.ts`, `coinmarketcap.ts`).
    *   [ ] Implement functions to fetch specific data points (e.g., `fetchBtcSpotPrice()`, `fetchBtcHistoricalData()`, `fetchFearGreedIndex()`, `fetchBtcAllTimeHigh()`).
    *   [ ] These functions should handle the `fetch` call, API key usage (from environment variables), request/response parsing, and basic error handling.
    *   [ ] Define clear TypeScript types for API responses.
    *   [ ] Consider implementing caching strategies within these modules (e.g., using `React.cache` or simple time-based caching) to respect rate limits and improve performance.
    *   [ ] Refactor any code currently calling these APIs directly to use these client functions.

### 3.4. Reusable UI Components & Design System

*   **Goal:** Create a library of generic, reusable UI components adhering to the project's theme.
*   **Rationale:** Ensures UI consistency, reduces code duplication in pages/features, speeds up development, simplifies theme updates (dark mode).
*   **Implementation Checklist:**
    *   [ ] Create a directory: `components/ui/`.
    *   [ ] Identify common UI elements used across the application (Buttons, Inputs, Cards, Modals, Data Tables, Chart Wrappers, Spinners, Alert Messages).
    *   [ ] Develop these components as generic, presentational components, accepting data and callbacks via props.
    *   [ ] Ensure components correctly implement Tailwind dark mode (`dark:` prefix) and use theme colors (`#F7931A`, grays).
    *   [ ] Integrate Chart.js logic into a reusable `Chart` component wrapper if not already done.
    *   [ ] Refactor existing feature components and pages to utilize these `components/ui/` elements.

### 3.5. Custom Hooks (Stateful UI Logic)

*   **Goal:** Encapsulate complex client-side state management, side effects, and UI-related logic.
*   **Rationale:** Cleans up Client Components, makes UI logic reusable and testable, separates state concerns from presentation.
*   **Implementation Checklist:**
    *   [ ] Create a directory: `hooks/`.
    *   [ ] Identify Client Components with complex state or side effects (e.g., forms with validation, components fetching/updating data client-side, interactive charts/tables).
    *   [ ] Create custom hooks to manage this logic (e.g., `useBtcPriceStream()`, `useCsvUploadManager()`, `useSettingsForm()`, `useDataTableState()`).
    *   [ ] Hooks should return state variables and handler functions needed by the component.
    *   [ ] Refactor Client Components to use these custom hooks, simplifying the component body.

### 3.6. Types & Schemas

*   **Goal:** Ensure robust type safety and data validation throughout the application.
*   **Rationale:** Improves developer experience (intellisense), catches errors at build time, serves as documentation, ensures data integrity at boundaries (API, forms, database).
*   **Implementation Checklist:**
    *   [ ] Create a central directory: `types/`.
    *   [ ] Generate Supabase types using `npx supabase gen types typescript --project-id <your_id> --schema public > types/supabase.ts` and keep it updated.
    *   [ ] Define custom types/interfaces for domain objects, API payloads, form data, etc., potentially extending or composing Supabase types.
    *   [ ] Implement validation schemas (e.g., using Zod) for API inputs, form submissions, and potentially CSV row validation. Store these in `lib/schemas/` or alongside relevant types/features.
    *   [ ] Apply these types and schemas consistently across DAL functions, domain logic, component props, API routes, and Server Actions.

### 3.7. Feature-Based Modules (Advanced/Optional)

*   **Goal:** Organize code by application feature rather than purely by type (component, hook, etc.).
*   **Rationale:** Enhances cohesion (all code for a feature lives together), reduces coupling between features, potentially improves code splitting, makes navigating large codebases easier, facilitates team collaboration on specific features.
*   **Implementation Checklist (Consider after foundational layers are refactored):**
    *   [ ] Create top-level directories for major features: `features/authentication/`, `features/dashboard/`, `features/csv-import/`, `features/settings/`, etc.
    *   [ ] Move feature-specific components, hooks, pages/routes, and related logic into their respective feature directories.
    *   [ ] Shared components remain in `components/ui/`, shared hooks in `hooks/`, core logic in `lib/domain/`, data access in `lib/data-access/`, etc.
    *   [ ] Features should primarily interact via the DAL, domain logic, and shared UI components/hooks.

## 4. Phasing / Prioritization (Suggestion)

1.  **Foundation:** Start with the foundational layers:
    *   **DAL (3.1):** Centralize database access first.
    *   **Domain Logic (3.2):** Isolate core calculations.
    *   **External API Clients (3.3):** Encapsulate third-party calls.
    *   **Types & Schemas (3.6):** Establish strong typing early.
2.  **UI & Interaction:**
    *   **Reusable UI Components (3.4):** Build the core UI blocks.
    *   **Custom Hooks (3.5):** Clean up client-side logic.
3.  **Structure & Features:**
    *   Refactor specific pages/routes to use the new layers.
    *   Consider the Feature-Based Module structure (3.7) if the codebase complexity warrants it.

## 5. Conclusion

Executing this refactoring plan will require a concerted effort but will yield significant long-term benefits for the BitBasis project. The resulting codebase will be more robust, easier to maintain and extend, better performing, and more pleasant to work on. Remember to commit changes frequently and test thoroughly at each stage. 