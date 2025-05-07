# Transaction Table Refactoring Plan

This document outlines the plan for refactoring the transactions table component to improve modularity, performance, and maintainability.

## 1. Global Utility Components

### Data Formatting Utilities

- [x] Create `/lib/utils/formatters.ts` with:
  - [x] `formatNumber(value: number | null | undefined, decimals: number = 8): string` - For BTC amounts
  - [x] `formatCurrency(value: number | null | undefined): string` - For USD values
  - [x] `formatDate(date: string | Date | null | undefined): string` - Consistent date formatting
  - [x] `capitalizeExchange(exchange: string | null | undefined): string` - Format exchange names
  - Note: Implemented in `/lib/utils/format.ts`

### Transaction Type Utilities

- [x] Create `/lib/utils/transaction-utils.ts` with:
  - [x] `getTransactionIcon(type: string)` - Return appropriate icons for transaction types
  - [x] `getTransactionTypeStyles(type: string)` - Return styling based on transaction type
  - [x] `isShortTerm(date: string | Date): boolean` - Check if transaction is short term
  - [x] `normalizeTransactionType(type: string | null | undefined): 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'unknown'`
  - Note: File was renamed to `transaction-utils.tsx`

## 2. Reusable Components Structure

### Shared Data Table Components

- [x] Create `/components/shared/data-table/` directory:
  - [x] `DataTableHeader.tsx` - Reusable header with sorting functionality
  - [x] `DataTablePagination.tsx` - Pagination controls component
  - [x] `DataTableFilters.tsx` - Base component for filter groups
  - [x] `DataTableEmpty.tsx` - Empty state component
  - [x] `DataTableLoading.tsx` - Loading state component
  - [x] `DataTableError.tsx` - Error state component

### Shared Filter Components

- [x] Create `/components/shared/filters/`:
  - [x] `SearchFilter.tsx` - Search input with clear button
  - [x] `DateRangeFilter.tsx` - Date range picker
  - [x] `DropdownFilter.tsx` - Generic dropdown filter

### Transaction-Specific Components

- [x] Create `/components/transactions/badges/`:
  - [x] `TransactionBadge.tsx` - Badge for transaction types
  - [x] `TermBadge.tsx` - Badge for SHORT/LONG terms

- [x] Create `/components/transactions/dialogs/`:
  - [x] `DeleteDialog.tsx` - Confirmation dialog for deletion
  - [x] `SuccessDialog.tsx` - Success message dialog

## 3. Component Restructuring

- [x] Split the monolithic transactions-table.tsx:
  - [x] `/components/transactions/TransactionsContainer.tsx` - Main wrapper component
  - [x] `/components/transactions/filters/TransactionsFilters.tsx` - All filters group
  - [x] `/components/transactions/table/TransactionsTable.tsx` - Just the table
  - [x] `/components/transactions/table/TransactionRow.tsx` - Individual row component
  - [x] `/components/transactions/actions/TransactionsActions.tsx` - Export/delete buttons

## 4. Custom Hooks

- [x] Create data fetching and state management hooks:
  - [x] `/hooks/useTransactions.ts` - Fetching, caching and error handling
  - [x] `/hooks/useTransactionFilters.ts` - Filter state management
  - [x] `/hooks/useTransactionSorting.ts` - Sorting logic
  - [x] `/hooks/useTransactionSelection.ts` - Selection state management

## 5. TypeScript Types

- [x] Create `/types/transactions.ts` with:
  - [x] `UnifiedTransaction` interface - Shared between all components
  - [x] `TransactionFilterState` interface - For filter state
  - [x] `SortConfig` type - For sorting configuration

## 6. Performance Optimizations

- [x] Implement memoization:
  - [x] Use `React.memo()` for row components to prevent unnecessary renders
  - [x] Use `useMemo()` for filtered and sorted data
  - [x] Use `useCallback()` for handler functions

## 7. Enhanced Functionality

- [x] Improve mobile experience:
  - [x] Create responsive table view for mobile
  - [x] Implement expandable rows for mobile screens

- [x] Add accessibility improvements:
  - [x] Ensure proper ARIA labels
  - [x] Implement keyboard navigation
  - [ ] Test with screen readers

## 8. Implementation Strategy

1. **Phase 1: Create utility functions and components** ✅
   - Implement formatting utilities ✅
   - Create transaction utility functions ✅
   - Build shared data table components ✅

2. **Phase 2: Develop custom hooks** ✅
   - Build data fetching hook ✅
   - Implement filter and sorting hooks ✅
   - Create selection management hook ✅

3. **Phase 3: Component refactoring** ✅
   - Split monolithic component into smaller pieces ✅
   - Implement new component structure ✅

4. **Phase 4: Performance optimization** 🚧
   - Add memoization
   - Optimize rendering performance

5. **Phase 5: Testing and refinement** 🚧
   - Unit test critical components
   - Test with large datasets
   - Verify mobile responsiveness

## 9. Quality Assurance Checklist

- [x] Code Cleanliness
  - [x] Remove console.logs
  - [x] Clean up commented code
  - [x] Add JSDoc comments

- [ ] Performance Testing
  - [ ] Test with 1,000+ transactions
  - [ ] Verify sorting performance
  - [ ] Check filter responsiveness

- [ ] Cross-Browser Testing
  - [ ] Test in Chrome, Firefox, Safari
  - [ ] Verify mobile browsers

- [ ] Accessibility Check
  - [ ] Run Lighthouse audit
  - [ ] Test keyboard navigation
  - [ ] Verify screen reader compatibility

## 10. Next Steps

1. Complete quality assurance:
   - Remove console.logs and commented code
   - Add JSDoc comments to all functions and components
   - Test with 1,000+ transaction records
   - Verify cross-browser compatibility

2. Test accessibility:
   - Run Lighthouse audit
   - Test keyboard navigation
   - Test with screen readers

3. Final code review:
   - Check for any duplicate code that could be further refactored
   - Ensure consistent naming conventions
   - Verify types are comprehensive and accurate

4. Performance testing:
   - Test with large datasets
   - Verify filter and sort operations are performant
   - Check for any memory leaks or unexpected re-renders
