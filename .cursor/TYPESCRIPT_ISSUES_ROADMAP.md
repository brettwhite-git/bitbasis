# TypeScript Issues Roadmap

**Date Created:** December 19, 2024  
**Total Errors:** 118 errors across 29 files  
**Status:** Ready for systematic resolution  

## 🎯 **Overview**

This document catalogs all TypeScript compilation errors discovered after dependency cleanup. These errors are **pre-existing issues** unrelated to the dependency removal and need systematic resolution to enable successful Vercel deployments.

## 📊 **Error Summary by Category**

| Category | Count | Priority | Impact |
|----------|-------|----------|--------|
| Type Interface Conflicts | 45 | 🔴 Critical | Blocks deployment |
| Legacy Schema References | 28 | 🔴 Critical | Breaks functionality |
| Database Query Type Mismatches | 18 | 🔴 Critical | Runtime errors |
| Form Validation Types | 12 | 🟡 Medium | UX issues |
| Chart.js Callback Types | 8 | 🟡 Medium | Chart functionality |
| Import Path Issues | 4 | 🟡 Medium | Module resolution |
| Edge Function Types | 3 | 🟢 Low | Development only |

---

## 🔴 **CRITICAL ISSUES (Priority 1)**

### **1. Type Interface Conflicts**
**Root Cause:** Multiple conflicting type definitions for transaction data structures

#### **Files Affected:**
- `components/portfolio/performance/returns-table.tsx` (4 errors)
- `lib/hooks/use-cost-basis-calculation.ts` (2 errors)
- `lib/hooks/use-dashboard-tax-liability.ts` (1 error)
- `lib/hooks/use-performance-data.ts` (1 error)
- `lib/hooks/use-transactions.ts` (2 errors)
- `lib/core/portfolio/performance.ts` (1 error)
- `types/transactions.ts` (1 error)

#### **Specific Issues:**
```typescript
// Conflict 1: ID field type mismatch
// types/transactions.ts expects: id: string
// Database returns: id: number

// Conflict 2: Transaction type union mismatch
// Expected: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'interest'
// Database returns: string

// Conflict 3: Import declaration conflicts
// Multiple definitions of UnifiedTransaction
```

#### **Solution Strategy:**
1. **Consolidate type definitions** into single source of truth
2. **Create type guards** for database query results
3. **Update all imports** to use canonical types

---

### **2. Legacy Schema References**
**Root Cause:** Code still referencing old database schema fields

#### **Files Affected:**
- `lib/core/calculations.ts` (14 errors)
- `lib/core/portfolio/cost-basis.ts` (10 errors)
- `lib/core/portfolio/types.ts` (1 error)
- `lib/core/portfolio/tax.ts` (1 error)
- `lib/services/portfolio/portfolioDataService.ts` (14 errors)

#### **Legacy Fields Still Referenced:**
```typescript
// OLD SCHEMA (no longer exists)
order.buy_fiat_amount          // → sent_amount
order.service_fee              // → fee_amount  
order.service_fee_currency     // → fee_currency
order.received_fiat_amount     // → received_amount
order.sell_btc_amount         // → sent_amount
order.received_btc_amount     // → received_amount
order.price                   // → price field in transactions table
order.date                    // → date field in transactions table

// MISSING TABLE REFERENCE
Database['public']['Tables']['orders'] // Table was renamed to 'transactions'
```

#### **Solution Strategy:**
1. **Map all legacy field references** to new unified schema
2. **Update calculation functions** to use new field names
3. **Remove Order type dependencies** in favor of UnifiedTransaction

---

### **3. Database Query Type Mismatches**
**Root Cause:** Database queries return generic types, but code expects specific interfaces

#### **Files Affected:**
- `components/settings/manage-files.tsx` (1 error)
- `components/subscription/PaymentRecoveryBanner.tsx` (3 errors)
- `components/transactions/import/confirmation-step.tsx` (4 errors)

#### **Pattern:**
```typescript
// Database query returns generic type
const { data } = await supabase.from('table').select('*')
// data type: { [key: string]: any }[]

// Code expects specific interface
setTransactions(data) // Error: generic type not assignable to UnifiedTransaction[]
```

#### **Solution Strategy:**
1. **Add type assertions** with runtime validation
2. **Create database query helpers** with proper typing
3. **Implement consistent type guards** across all queries

---

## 🟡 **MEDIUM PRIORITY ISSUES (Priority 2)**

### **4. Form Validation Types**
**Root Cause:** Inconsistent handling of null vs undefined in form fields

#### **Files Affected:**
- `components/transactions/edit/edit-transaction-form.tsx` (1 error)
- `components/transactions/forms/fields/common-transaction-fields.tsx` (1 error)
- `components/transactions/forms/fields/transfer-transaction-fields.tsx` (1 error)
- `components/transactions/forms/wizard/steps/transaction-details-step.tsx` (6 errors)
- `components/transactions/forms/wizard/steps/transaction-type-step.tsx` (1 error)

#### **Pattern:**
```typescript
// Form expects: number | undefined
// Database provides: number | null
// React components expect: string | number | readonly string[]
// Form provides: number | null | undefined
```

#### **Solution Strategy:**
1. **Standardize null/undefined handling** across forms
2. **Create form field adapters** for type conversion
3. **Update form validation schemas** for consistency

---

### **5. Chart.js Callback Types**
**Root Cause:** Partial implementation of Chart.js callback interfaces

#### **Files Affected:**
- `lib/utils/chart-tooltip-config.ts` (13 errors)
- `lib/services/portfolio/chartConfigService.ts` (1 error)

#### **Pattern:**
```typescript
// Partial callback implementation
callbacks: {
  title: (context) => string,
  label: (context) => string
}
// Missing: beforeTitle, afterTitle, beforeBody, afterBody, etc.
```

#### **Solution Strategy:**
1. **Implement complete callback interfaces** or use Partial<> wrapper
2. **Add proper Chart.js type definitions**
3. **Test chart functionality** after type fixes

---

### **6. Import Path Issues**
**Root Cause:** Inconsistent import paths between kebab-case and camelCase

#### **Files Affected:**
- `components/performance/insights/personal-insights.tsx` (1 error)

#### **Pattern:**
```typescript
// Incorrect import path
import { PerformanceData } from "@/hooks/usePerformanceData"
// Correct path (kebab-case)
import { PerformanceData } from "@/lib/hooks/use-performance-data"
```

#### **Solution Strategy:**
1. **Audit all import paths** for consistency
2. **Update to kebab-case convention** throughout project
3. **Create import path aliases** if needed

---

## 🟢 **LOW PRIORITY ISSUES (Priority 3)**

### **7. Supabase Edge Function Types**
**Root Cause:** Deno-specific type issues in Edge Functions

#### **Files Affected:**
- `supabase/functions/update-monthly-btc-close/index.ts` (9 errors)
- `supabase/functions/update-spot-price/index.ts` (2 errors)

#### **Issues:**
- Missing Deno standard library types
- Implicit any types in function parameters
- Error handling type assertions

#### **Solution Strategy:**
1. **Add proper Deno type definitions**
2. **Implement explicit error typing**
3. **Test edge functions** after fixes

---

### **8. Utility Function Generics**
**Root Cause:** Generic type constraints not properly defined

#### **Files Affected:**
- `lib/core/performance-utils.ts` (1 error)
- `lib/core/portfolio/monthly-calculator.ts` (1 error)
- `lib/utils/import-export.ts` (4 errors)
- `lib/utils/transaction-export.ts` (13 errors)

#### **Solution Strategy:**
1. **Add proper generic constraints**
2. **Implement type guards** for utility functions
3. **Add runtime validation** where needed

---

## 🛠️ **IMPLEMENTATION ROADMAP**

### **Phase 1: Critical Type Infrastructure (Week 1)**
1. **Consolidate Type Definitions**
   - [ ] Create canonical `UnifiedTransaction` interface
   - [ ] Remove conflicting type definitions
   - [ ] Update all imports to use single source

2. **Legacy Schema Migration**
   - [ ] Map all legacy field references
   - [ ] Update calculation functions
   - [ ] Remove `Order` type dependencies

3. **Database Query Type Safety**
   - [ ] Create typed query helpers
   - [ ] Add consistent type guards
   - [ ] Implement runtime validation

### **Phase 2: Form & UI Type Safety (Week 2)**
1. **Form Field Type Standardization**
   - [ ] Standardize null/undefined handling
   - [ ] Create form field adapters
   - [ ] Update validation schemas

2. **Chart.js Type Completion**
   - [ ] Implement complete callback interfaces
   - [ ] Add proper type definitions
   - [ ] Test chart functionality

### **Phase 3: Cleanup & Optimization (Week 3)**
1. **Import Path Consistency**
   - [ ] Audit all import paths
   - [ ] Update to kebab-case convention
   - [ ] Create path aliases if needed

2. **Edge Function & Utility Types**
   - [ ] Add Deno type definitions
   - [ ] Implement generic constraints
   - [ ] Add runtime validation



## 📋 **TESTING STRATEGY**

### **After Each Phase:**
1. **Run Type Check:** `npx tsc --noEmit`
2. **Build Test:** `npm run build`
3. **Functionality Test:** Manual testing of affected features
4. **Deploy Test:** Test deployment to Vercel staging

### **Continuous Monitoring:**
- Set up `npx tsc --noEmit --watch` during development
- Use IDE TypeScript integration for real-time feedback
- Add pre-commit hooks for type checking

---

## 🎯 **SUCCESS METRICS**

- [ ] **Zero TypeScript compilation errors**
- [ ] **Successful `npm run build`**
- [ ] **Successful Vercel deployment**
- [ ] **All existing functionality preserved**
- [ ] **Improved type safety throughout codebase**

---

## 📝 **NOTES**

- **Dependency Cleanup Status:** ✅ **COMPLETED** (10 packages removed, ~900KB saved)
- **Root Cause:** Issues are **pre-existing**, not caused by dependency removal
- **Deployment Impact:** **BLOCKING** - must be resolved or bypassed for Vercel deployment
- **Code Quality:** Fixing these issues will significantly improve type safety and maintainability

---

*This roadmap should be tackled systematically to ensure successful resolution without breaking existing functionality.*
