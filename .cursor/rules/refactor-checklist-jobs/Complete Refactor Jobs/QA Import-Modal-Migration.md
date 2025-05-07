# Import Feature Migration to Transactions Modal

## Overview
Migrate the standalone CSV import functionality currently located in `/components/import/index.tsx` to a multi-step modal workflow within the Transactions section. This will provide a more integrated user experience while preserving all existing functionality.

## Current Structure
- **Standalone Import Page**: `/app/dashboard/import/page.tsx`
- **Main Import Component**: `/components/import/index.tsx` (443 lines)
- **Import Helper Components**: `/components/import/components/*`
- **Import Utilities**: `/components/import/lib/*`
- **Transactions Container**: `/components/transactions/TransactionsContainer.tsx`
- **Transactions Table**: `/components/transactions/TransactionsTable.tsx`

## Target Structure
```
/components/transactions/dialogs/import/
├── ImportModal.tsx            # Main container for the import workflow ✓
├── ImportContext.tsx          # Context provider for state management ✓
├── UploadStep.tsx             # File upload with progress animation ✓
├── PreviewStep.tsx            # Transaction preview table ✓
└── ConfirmationStep.tsx       # Final confirmation step ✓
```

## User Flow
1. **Trigger**: User clicks "Import" button in Transactions table ✓
2. **Step 1 - Upload**: 
   - Drag & drop CSV file or use file browser ✓
   - Show parsing progress animation ✓
   - Validate CSV format and content ✓
3. **Step 2 - Preview**: 
   - Display parsed transactions in table format ✓
   - Allow row selection/deselection if needed
   - Show validation warnings/errors ✓
4. **Step 3 - Confirmation**:
   - Summary of transactions to be imported ✓
   - Final confirmation button ✓
   - Success/error feedback ✓

## Required Features
- [x] File upload with drag & drop
- [x] Progress animation during parsing
- [x] Multi-step modal navigation
- [x] Transaction preview table
- [x] Confirmation step with summary
- [x] Success/error states and notifications
- [x] API integration for actual import

## Implementation Tasks

### 1. Modal Framework Setup
- [x] Create `ImportModal.tsx` with step navigation
- [x] Add state management for multi-step process
- [x] Implement modal trigger in TransactionsTable.tsx

### 2. File Upload Step
- [x] Migrate drag & drop functionality from existing code
- [x] Add progress animation during parsing
- [x] Implement file validation with error handling
- [x] Extract CSV parsing logic from current implementation

### 3. Preview Step
- [x] Create transaction preview table component
- [x] Implement column mapping if necessary
- [x] Show validation errors/warnings
- [ ] Add row selection/deselection functionality

### 4. Confirmation Step
- [x] Create summary view of transactions to import
- [x] Implement final confirmation UI
- [x] Add API integration for import process
- [x] Implement success/error states

### 5. Integration & Testing
- [x] Connect to existing API endpoints
- [x] Ensure proper state refresh after successful import
- [ ] Test with various CSV formats and sizes
- [ ] Verify large file handling
- [ ] Test error handling and boundary conditions

## Code Migration Strategy
1. **Copy-then-Refactor**: First copy relevant code, then refactor for new context ✓
2. **Incremental Testing**: Test each component as it's migrated
3. **Shared Utilities**: Create shared utilities for functions used in multiple places ✓
4. **Maintain Type Safety**: Ensure TypeScript types are maintained throughout ✓

## Technical Considerations
- **State Management**: Use React Context for sharing state between steps ✓
- **Performance**: Process large files in chunks with visible progress ✓
- **Accessibility**: Ensure modal navigation is keyboard accessible ✓
- **Responsiveness**: Design for all screen sizes ✓

## Completion Criteria
- [x] All functionality from standalone import page is available in modal
- [x] Users can successfully import CSVs through the new workflow
- [x] UI provides clear feedback at each step
- [ ] Large files (up to 100MB total) are handled gracefully
- [x] All validation logic is preserved

## Dependencies
- Existing API endpoints for transaction import ✓
- Current CSV parsing and validation logic ✓
- UI components from shadcn/ui for modal framework ✓

## Next Steps
1. Testing with various CSV formats
2. Implementing row selection/deselection in preview step
3. Optimizing large file handling
4. Removing the standalone import page after full migration 