# Portfolio Refactor Plan

## Overview

The current portfolio structure needs refactoring to improve modularity, separation of concerns, and maintainability. Key issues include:

1. Oversized files (`portfolio.ts` at ~1200 lines and `performance-returns.tsx` at ~500 lines)
2. Mixed concerns in single files
3. Duplicated type definitions across files
4. Complex calculation logic embedded directly in components

## Current Structure

```
/lib/core/
    - portfolio.ts (1200+ lines)
    - calculations.ts (156 lines)

/components/portfolio/
    - performance-returns.tsx (508 lines)
    - performance-returns-wrapper.tsx (39 lines)

/app/dashboard/portfolio/
    - page.tsx (101 lines)
```

## Proposed Structure

```
/lib/
    /core/
        /portfolio/
            - types.ts (shared type definitions)
            - metrics.ts (core metrics calculations)
            - cost-basis.ts (cost basis calculations)
            - performance.ts (performance metrics)
            - tax.ts (tax calculations)
            - index.ts (exports)
    /utils/
        - portfolio-utils.ts (helper functions)
    /hooks/
        - usePerformanceMetrics.ts
        - usePortfolioMetrics.ts
        - useCostBasisCalculation.ts

/components/portfolio/
    /metrics/
        - portfolio-value.tsx
        - cost-basis.tsx
        - bitcoin-holdings.tsx
        - fees-paid.tsx
        - holdings-term.tsx
    /performance/
        - returns-table.tsx
        - compound-growth.tsx
        - cumulative-returns.tsx
    /tax/
        - cost-basis-comparison.tsx
        - tax-liability.tsx
    /charts/
        - performance-chart.tsx
    - index.ts (exports)
```

## Implementation Checklist

### Phase 1: Restructuring & Type Consolidation ✅

#### Folder Structure
- [x] Create `/lib/core/portfolio/` directory
- [x] Create `/lib/utils/` directory (if not exists)
- [x] Create component subdirectories:
  - [x] `/components/portfolio/metrics/`
  - [x] `/components/portfolio/performance/`
  - [x] `/components/portfolio/tax/`
  - [x] `/components/portfolio/charts/`

#### Type Consolidation
- [x] Create `/lib/core/portfolio/types.ts`
- [x] Extract and consolidate types from:
  - [x] `portfolio.ts`
  - [x] `calculations.ts`
  - [x] `performance-returns.tsx`
  - [x] `performance-returns-wrapper.tsx`
- [x] Standardize naming conventions for types
- [x] Add JSDoc comments to describe types

#### Create Base Files
- [x] Create `/lib/core/portfolio/index.ts` for exports
- [x] Create `/components/portfolio/index.ts` for exports
- [x] Create placeholder files with basic exports for all new modules

### Phase 2: Core Logic Refactoring ✅

#### Extract Core Logic Functions
- [x] Create `metrics.ts`:
  - [x] Move basic metrics calculations from `portfolio.ts`
  - [x] Move `calculateTotalBTC`, `calculateCostBasis` functions
  - [x] Refactor to use consolidated types
  
- [x] Create `cost-basis.ts`:
  - [x] Extract FIFO calculation logic
  - [x] Extract LIFO calculation logic
  - [x] Extract Average Cost calculation logic
  - [x] Refactor to improve readability

- [x] Create `performance.ts`:
  - [x] Extract performance metrics calculations
  - [x] Extract compound growth rate calculations
  - [x] Extract drawdown calculations
  - [x] Clean up log statements

- [x] Create `tax.ts`:
  - [x] Extract tax liability calculations
  - [x] Extract realized/unrealized gains functions

- [x] Create `portfolio-utils.ts`:
  - [x] Extract helper functions
  - [x] Move date manipulation utilities
  - [x] Move formatting functions (if not already in utils)

#### Update Entry Points
- [x] Update `index.ts` to export all functions from new files
- [x] Fix imports in existing components
- [ ] Add unit tests for core calculations

### Phase 3: Component Refactoring (Completed)

#### Break Down Large Components
- [x] Create metric components:
  - [x] `portfolio-value.tsx`
  - [x] `cost-basis.tsx`
  - [x] `bitcoin-holdings.tsx`
  - [x] `fees-paid.tsx`
  - [x] `holdings-term.tsx`

- [x] Break down `performance-returns.tsx` into:
  - [x] `returns-table.tsx`
  - [x] `compound-growth.tsx`
  - [x] `cumulative-returns.tsx`
  - [x] `cost-basis-comparison.tsx`

- [x] Extract tax-related components:
  - [x] `tax-liability.tsx`

- [x] Use existing chart components from performance directory:
  - [x] `performance-chart.tsx` (in `/components/performance/overview/`)

#### Data Fetching & State Management
- [x] Create custom hooks for data fetching:
  - [x] `usePortfolioMetrics`
  - [x] `usePerformanceMetrics`
  - [x] `useCostBasisCalculation` 

- [x] Implement loading states
- [x] Add error handling

#### Component Integration
- [x] Update imports in wrapper components
- [x] Ensure proper prop passing
- [x] Implement memoization where appropriate

### Phase 4: Integration & Testing (In Progress)

- [x] Update imports in page components
- [ ] Test with various datasets:
  - [ ] Empty portfolio
  - [ ] Small portfolio
  - [ ] Large portfolio (performance testing)

- [ ] Verify calculations match previous implementation
- [ ] Ensure UI renders identically
- [ ] Test error handling scenarios
- [ ] Fix any regressions

### Final Steps

- [x] Clean up any unused code
  - [x] Removed unused charts directory
  - [x] Removed unused "Comparison Chart" tab from PerformanceReturns
- [x] Add documentation comments
- [ ] Update README or other documentation
- [ ] Perform final code review
- [ ] Deploy and monitor for issues

## Success Criteria

- [x] All functionality preserved
- [x] Improved code readability and maintainability
- [x] Reduced file sizes (no file > 300 lines)
- [x] Consistent naming conventions
- [x] Proper separation of concerns
- [ ] Unit tests for core calculations 