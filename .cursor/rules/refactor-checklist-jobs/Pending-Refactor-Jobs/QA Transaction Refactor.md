# Transaction Table Refactoring Plan

This document outlines the plan for refactoring the transactions table component to improve modularity, performance, and maintainability.

## 1. Global Utility Components

### Data Formatting Utilities

- [ ] Create `/lib/utils/formatters.ts` with:
  - [ ] `formatNumber(value: number | null | undefined, decimals: number = 8): string` - For BTC amounts
  - [ ] `formatCurrency(value: number | null | undefined): string` - For USD values
  - [ ] `formatDate(date: string | Date | null | undefined): string` - Consistent date formatting
  - [ ] `capitalizeExchange(exchange: string | null | undefined): string` - Format exchange names

### Transaction Type Utilities

- [ ] Create `/lib/utils/transaction-utils.ts` with:
  - [ ] `getTransactionIcon(type: string)` - Return appropriate icons for transaction types
  - [ ] `getTransactionTypeStyles(type: string)` - Return styling based on transaction type
  - [ ] `isShortTerm(date: string | Date): boolean` - Check if transaction is short term
  - [ ] `normalizeTransactionType(type: string | null | undefined): 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'unknown'`

## 2. Reusable Components Structure

### Shared Data Table Components

- [ ] Create `/components/shared/data-table/` directory:
  - [ ] `DataTableHeader.tsx` - Reusable header with sorting functionality
  - [ ] `DataTablePagination.tsx` - Pagination controls component
  - [ ] `DataTableFilters.tsx` - Base component for filter groups
  - [ ] `DataTableEmpty.tsx` - Empty state component
  - [ ] `DataTableLoading.tsx` - Loading state component
  - [ ] `DataTableError.tsx` - Error state component

### Shared Filter Components

- [ ] Create `/components/shared/filters/`:
  - [ ] `SearchFilter.tsx` - Search input with clear button
  - [ ] `DateRangeFilter.tsx` - Date range picker
  - [ ] `DropdownFilter.tsx` - Generic dropdown filter

### Transaction-Specific Components

- [ ] Create `/components/transactions/badges/`:
  - [ ] `TransactionBadge.tsx` - Badge for transaction types
  - [ ] `TermBadge.tsx` - Badge for SHORT/LONG terms

- [ ] Create `/components/transactions/dialogs/`:
  - [ ] `DeleteDialog.tsx` - Confirmation dialog for deletion
  - [ ] `SuccessDialog.tsx` - Success message dialog

## 3. Component Restructuring

- [ ] Split the monolithic transactions-table.tsx:
  - [ ] `/components/transactions/TransactionsContainer.tsx` - Main wrapper component
  - [ ] `/components/transactions/filters/TransactionsFilters.tsx` - All filters group
  - [ ] `/components/transactions/table/TransactionsTable.tsx` - Just the table
  - [ ] `/components/transactions/table/TransactionRow.tsx` - Individual row component
  - [ ] `/components/transactions/actions/TransactionsActions.tsx` - Export/delete buttons

## 4. Custom Hooks

- [ ] Create data fetching and state management hooks:
  - [ ] `/hooks/useTransactions.ts` - Fetching, caching and error handling
  - [ ] `/hooks/useTransactionFilters.ts` - Filter state management
  - [ ] `/hooks/useTransactionSorting.ts` - Sorting logic
  - [ ] `/hooks/useTransactionSelection.ts` - Selection state management

## 5. TypeScript Types

- [ ] Create `/types/transactions.ts` with:
  - [ ] `UnifiedTransaction` interface - Shared between all components
  - [ ] `TransactionFilterState` interface - For filter state
  - [ ] `SortConfig` type - For sorting configuration

## 6. Performance Optimizations

- [ ] Implement memoization:
  - [ ] Use `React.memo()` for row components to prevent unnecessary renders
  - [ ] Use `useMemo()` for filtered and sorted data
  - [ ] Use `useCallback()` for handler functions

- [ ] Consider virtualization:
  - [ ] Evaluate `react-window` or `react-virtualized` for large datasets
  - [ ] Implement if transaction count exceeds 100

## 7. Enhanced Functionality

- [ ] Improve mobile experience:
  - [ ] Create responsive table view for mobile
  - [ ] Implement expandable rows for mobile screens

- [ ] Add accessibility improvements:
  - [ ] Ensure proper ARIA labels
  - [ ] Implement keyboard navigation
  - [ ] Test with screen readers

## 8. Implementation Strategy

1. **Phase 1: Create utility functions and components**
   - Implement formatting utilities
   - Create transaction utility functions
   - Build shared data table components

2. **Phase 2: Develop custom hooks**
   - Build data fetching hook
   - Implement filter and sorting hooks
   - Create selection management hook

3. **Phase 3: Component refactoring**
   - Split monolithic component into smaller pieces
   - Implement new component structure

4. **Phase 4: Performance optimization**
   - Add memoization
   - Implement virtualization if needed
   - Optimize rendering performance

5. **Phase 5: Testing and refinement**
   - Unit test critical components
   - Test with large datasets
   - Verify mobile responsiveness

## 9. Quality Assurance Checklist

- [ ] Code Cleanliness
  - [ ] Remove console.logs
  - [ ] Clean up commented code
  - [ ] Add JSDoc comments

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
