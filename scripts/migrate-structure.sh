#!/bin/bash

echo "🚀 Starting BitBasis structure migration..."

# Phase 1: Rename component files to PascalCase
echo "📝 Phase 1: Renaming component files..."

# Transaction History Components
mv components/transaction-history/transaction-history-table.tsx components/transaction-history/TransactionTable.tsx
mv components/transaction-history/transaction-history-row.tsx components/transaction-history/TransactionRow.tsx
mv components/transaction-history/transaction-history-headers.tsx components/transaction-history/TransactionHeaders.tsx
mv components/transaction-history/transaction-history-accordion.tsx components/transaction-history/TransactionAccordion.tsx
mv components/transaction-history/transaction-history-mobile-view.tsx components/transaction-history/TransactionMobileView.tsx
mv components/transaction-history/transaction-history-row-mobile.tsx components/transaction-history/TransactionRowMobile.tsx
mv components/transaction-history/edit-transaction-form.tsx components/transaction-history/EditTransactionForm.tsx
mv components/transaction-history/edit-transaction-drawer.tsx components/transaction-history/EditTransactionDrawer.tsx
mv components/transaction-history/edit-drawer-provider.tsx components/transaction-history/EditDrawerProvider.tsx
mv components/transaction-history/transaction-type-fields.tsx components/transaction-history/TransactionTypeFields.tsx

# Add Transaction Wizard Components
mv components/add-transaction-wizard/add-transaction-wizard.tsx components/add-transaction-wizard/AddTransactionWizard.tsx
mv components/add-transaction-wizard/add-transaction-wizard-context.tsx components/add-transaction-wizard/AddTransactionWizardContext.tsx

# Other Components
mv components/theme-provider.tsx components/ThemeProvider.tsx
mv components/error-boundary.tsx components/ErrorBoundary.tsx
mv components/logo.tsx components/Logo.tsx
mv components/icons.tsx components/Icons.tsx

echo "✅ Phase 1 complete: Component files renamed"

# Phase 2: Consolidate hooks directory
echo "📁 Phase 2: Consolidating hooks..."

# Move hooks to lib/hooks/
mv hooks/use-subscription.ts lib/hooks/use-subscription.ts
mv hooks/use-transaction-limits.ts lib/hooks/use-transaction-limits.ts

# Remove empty hooks directory
rmdir hooks

echo "✅ Phase 2 complete: Hooks consolidated"

# Phase 3: Create index files for better imports
echo "📋 Phase 3: Creating index files..."

# Create transaction components index
cat > components/transactions/index.ts << 'EOF'
export { TransactionTable } from './TransactionTable'
export { TransactionRow } from './TransactionRow'
export { TransactionHeaders } from './TransactionHeaders'
export { TransactionAccordion } from './TransactionAccordion'
export { TransactionMobileView } from './TransactionMobileView'
export { TransactionRowMobile } from './TransactionRowMobile'
export { EditTransactionForm } from './EditTransactionForm'
export { EditTransactionDrawer } from './EditTransactionDrawer'
export { EditDrawerProvider } from './EditDrawerProvider'
export { TransactionTypeFields } from './TransactionTypeFields'
EOF

# Create shared components index
cat > components/shared/index.ts << 'EOF'
export { ErrorBoundary } from '../ErrorBoundary'
export { Logo } from '../Logo'
export { Icons } from '../Icons'
EOF

# Create hooks index
cat > lib/hooks/index.ts << 'EOF'
export { useSubscription } from './use-subscription'
export { useTransactionLimits } from './use-transaction-limits'
EOF

echo "✅ Phase 3 complete: Index files created"

echo "🎉 Migration script complete! Remember to:"
echo "1. Update all import statements"
echo "2. Run TypeScript check: npm run type-check"
echo "3. Run tests: npm test"
echo "4. Update any file references in documentation" 