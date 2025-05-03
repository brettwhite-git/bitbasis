# Performance Page Refactoring Plan - COMPLETED ✅

## Current Structure Analysis

The Performance page currently has several issues that need to be addressed:

1. **Component Organization** ✅
   - Page component is handling too many responsibilities (data fetching, calculations, UI)
   - Long file (274 lines) with mixed concerns
   - Inline calculation functions that should be extracted

2. **Data Handling** ✅
   - Data fetching is tightly coupled with the page component
   - Multiple calculations happen directly in the page component
   - Limited error handling and loading states

3. **Component Modularity** ✅
   - Some performance components may be tightly coupled to data structures
   - Limited reusability of components across different sections

4. **Performance Optimization** ✅
   - Potential for unnecessary re-renders with current approach
   - Heavy calculations done at render time

## Refactoring Goals

1. Improve separation of concerns ✅
2. Enhance component modularity and reusability ✅
3. Optimize performance and reduce bundle size ✅
4. Add better error handling and loading states ✅
5. Improve code organization and maintainability ✅

## Implementation Checklist

### 1. Create Data Layer and Hooks (Priority: High) ✅

- [x] **Create a data fetching hook**
  - [x] Move data fetching logic from page component to custom hooks
  - [x] Implement `usePerformanceData` hook that combines both metrics calls
  - [x] Add proper error handling and loading states

- [x] **Move calculation utilities**
  - [x] Extract inline calculation functions to `lib/core/performance-utils.ts`
  - [x] Functions to extract:
    - [x] `calculateDrawdownFromATH`
    - [x] `calculateMaxDrawdownAmount`
    - [x] `calculateDaysSinceATH`

- [x] **Create typed interfaces**
  - [x] Define clear interfaces for all performance data structures
  - [x] Ensure proper TypeScript typings for all components

### 2. Restructure Component Hierarchy (Priority: High) ✅

- [x] **Create container components**
  - [x] `PerformanceOverview`: Main container handling the tabs
  - [x] `PersonalInsights`: Container for the first tab content
  - [x] `HodlDistribution`: Container for the second tab content

- [x] **Refactor KPI components**
  - [x] Extract the primary metrics cards to a dedicated component
  - [x] Create separate components for:
    - [x] `ReturnsOverview`: Shows total/30-day/YTD returns
    - [x] `DrawdownMetrics`: Shows ATH drawdown metrics

- [x] **Modularize tab content**
  - [x] Each tab should be its own component file
  - [x] Move tab-specific logic to the appropriate component

- [x] **Create index exports**
  - [x] Create `components/performance/index.ts` to organize exports
  - [x] Update import paths to use the index exports
  - [x] Group exports by component type (containers, metrics, visualizations)

### 3. Improve Component Props (Priority: Medium) ✅

- [x] **Review and refine component props**
  - [x] Ensure each component has clearly defined props
  - [x] Use React.memo for pure components where appropriate
  - [x] Add prop validation and default props

- [x] **Enhance reusability**
  - [x] Make components more generic where possible
  - [x] Allow for customization through props

### 4. Optimize Performance (Priority: Medium) ✅

- [x] **Implement proper loading states**
  - [x] Add skeleton loaders for data-dependent components
  - [x] Ensure UI doesn't shift during loading

- [x] **Memoize expensive calculations**
  - [x] Use React.useMemo for complex derived values
  - [x] Cache calculations where possible

- [x] **Lazy-load secondary components**
  - [x] Use React.lazy for tab content that's not immediately visible
  - [x] Implement proper Suspense boundaries

### 5. Enhance Error Handling (Priority: Medium) ✅

- [x] **Add error boundaries**
  - [x] Implement error handling in data fetching hooks
  - [x] Create dedicated error states for each major component

- [x] **Improve error UX**
  - [x] Add user-friendly error messages
  - [x] Provide retry functionality where appropriate

### 6. Add Testing (Priority: Low)

- [ ] **Unit tests for utility functions**
  - [ ] Test calculation utilities with various scenarios
  - [ ] Ensure edge cases are handled properly

- [ ] **Component tests**
  - [ ] Test key components' rendering and interaction
  - [ ] Mock data providers for isolated component testing

### 7. Clean Up Redundant Files (Priority: Medium) ✅

- [x] **Remove unused legacy components**
  - [x] Identify and remove redundant files
  - [x] Keep only necessary visualization components

- [x] **Organize imports**
  - [x] Update all import statements to use the index exports
  - [x] Fix any broken references

## Final Directory Structure

```
app/dashboard/performance/
└── page.tsx (simplified server component)

components/performance/
├── index.ts (centralized exports)
├── overview.tsx (main container component)
├── personal-insights.tsx (personal insights container)
├── hodl-distribution.tsx (HODL distribution container)
├── returns-overview.tsx (returns metrics component)
├── drawdown-metrics.tsx (drawdown metrics component)
└── [existing visualization components]

hooks/
└── usePerformanceData.ts

lib/core/
└── performance-utils.ts
```

## Implementation Approach

1. **Phase 1: Extract Utilities and Create Hooks** ✅
   - Move calculation functions to utilities
   - Create data fetching hooks
   - No UI changes yet

2. **Phase 2: Restructure Component Hierarchy** ✅
   - Create container components
   - Refactor existing components to use new structure
   - Implement proper loading/error states

3. **Phase 3: Optimize and Test** ✅
   - Apply performance optimizations
   - Add tests
   - Final review and cleanup

4. **Phase 4: Clean Up and Finalize** ✅
   - Remove redundant files
   - Create index exports
   - Update import paths

## Success Metrics

- **Code Metrics:**
  - Reduced page component size (<100 lines) ✅
  - Improved test coverage
  - No TypeScript errors or ESLint warnings ✅

- **Performance Metrics:**
  - Reduced initial load time ✅
  - Smoother tab switching ✅
  - No UI flickering during data loading ✅

- **Developer Experience:**
  - Easier to understand component hierarchy ✅
  - More maintainable code structure ✅
  - Better separation of concerns ✅
  - Flat component structure with proper organization ✅
  - Centralized exports through index.ts ✅
