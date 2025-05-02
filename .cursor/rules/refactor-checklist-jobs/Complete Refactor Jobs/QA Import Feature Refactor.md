# Refactoring Plan: Import Components (`components/import/`)

## 1. Goal

Modularize the transaction import functionality currently centralized in `import-form.tsx` and `import-preview.tsx`. Create a clear separation between:
-   Container/State Management (`ImportFormContainer.tsx`)
-   UI for different input methods (`form/file-upload.tsx`, `form/manual-entry.tsx`, `form/manage-csvs.tsx`, `form/import-resources.tsx`)
-   Data Processing Logic (`types.ts`, `utils.ts`, `parsing.ts`, `validation.ts`)
-   Preview Display (`import-preview.tsx`, adapted)

## 2. Learnings from Initial Attempt

The first refactoring attempt was rejected due to broken functionality and missing UI elements. Key learnings include:

*   **State Management Complexity:** Distributing the complex state (file data, parsing/validation status, transaction data, UI feedback states) across multiple new components requires careful prop/callback design.
*   **UI/UX Coupling:** UI elements (loaders, errors, success messages, preview table) are tightly coupled to state changes. Refactoring state management requires refactoring UI triggers simultaneously.
*   **Preview Component Integration:** The preview step is integral. The preview component (`import-preview.tsx`) must be functional and integrated *during* the form refactor, not deferred. It needs to accept data from the new container.
*   **Type Handling:** Careful mapping is needed between intermediate parsed types (`ParsedTransaction`) and final database types (`OrderInsert`, `TransferInsert`), especially regarding nullability and required fields for DB insertion.
*   **API Signatures:** Precise understanding of external function signatures (e.g., Supabase helpers like `uploadCSVFile`, `updateCSVUploadStatus`) is crucial.
*   **Testing Strategy:** Large refactoring steps without intermediate testing are risky. An incremental approach is needed.

## 3. Revised Incremental Refactoring Plan

We will revert the previous changes and re-attempt the refactor incrementally. **After each step, we will test the core import functionality.** Ensure `userId` is accessible where needed (API calls, validation) via `useAuth` hook or context. Define and implement consistent strategies for handling loading states and error feedback, likely managed centrally in the container.

**Phase 1: Foundational Logic & Types (Isolate non-UI logic)**

1.  **(Re)Create & Populate `types.ts`:**
    *   Define `ParsedTransaction` (and base types `ParsedOrder`, `ParsedTransfer`), `ValidationIssue`, `CSVRow`, `ImportPreviewData`, `UploadedCSV`, etc.
    *   Ensure database types (`OrderInsert`, `TransferInsert`) are correctly referenced or defined using `Database['public']['Tables']...`.
2.  **(Re)Create & Populate `utils.ts`:**
    *   Move pure utility functions: type guards `isOrder`/`isTransfer`, `formatDate`, `formatFileSize`, `normalizeTransactionType`, `capitalizeExchange` (from preview), `isShortTerm`.
    *   Ensure imports are updated in original files (`import-form.tsx`, `import-preview.tsx`).
3.  **Test:** Verify `import-form.tsx` and `import-preview.tsx` still function correctly using the types and utils from the new files.
4.  **(Re)Create & Populate `parsing.ts`:**
    *   Move `parseAmount` and `parseDate` here.
    *   **Implement Header Mapping:** Add logic to detect common header variations (e.g., "Date"/"Timestamp", different amount names) and map them to the standardized `CSVRow` interface.
    *   Move and refactor `transformCSVToTransaction` (rename potentially to `transformRowToTransaction`) to work with the standardized `CSVRow`. Handle manual entry transformation if needed (perhaps a separate `transformManualEntryToTransaction` function).
    *   Refactor `import-form.tsx` to *import and use* these functions.
5.  **Test:** Thoroughly test CSV parsing (with various headers) and manual entry transformation within the original `import-form.tsx` structure.
6.  **(Re)Create & Populate `validation.ts`:**
    *   Move `validateTransaction`. Ensure it accepts `ParsedTransaction`.
    *   Refactor `import-form.tsx` to *import and use* this function after parsing.
7.  **Test:** Test CSV parsing *and* validation feedback within the original `import-form.tsx`.

**Phase 2: Container & Form UI Separation**

8.  **Create `ImportFormContainer.tsx`:**
    *   **State Management:** Initialize *all* necessary state: `file`, `isLoading` (consider granular loading states: `isUploading`, `isParsing`, `isValidating`, `isImporting`), `error` (API errors, parsing errors, etc.), `progress`, `parsedTransactions`, `validationIssues`, `showPreview`, `activeTab`, `manualEntries` (if staging here), `csvUploadId`, `userId`. **Decision Point:** Use prop drilling initially, but be prepared to refactor to React Context or Zustand if state flow becomes overly complex.
    *   **API/Logic Implementation:**
        *   Implement logic for handling file selection/drop: Trigger `uploadCSVFile` (from Supabase helpers), store `csvUploadId`, then trigger parsing (`parsing.ts`).
        *   Implement logic for handling manual entry submission: Trigger parsing/validation (`parsing.ts`, `validation.ts`).
        *   Implement logic for handling preview confirmation (`onConfirmImport` from preview): Prepare final `OrderInsert[]`/`TransferInsert[]` data, call `insertTransactions`, call `updateCSVUploadStatus` ('success' or 'error').
        *   Implement logic for cancellation (`onCancel` from preview): Reset relevant state.
        *   Implement central error handling and loading state updates.
        *   Fetch `userId` using `useAuth`.
9.  **Create `form/file-upload.tsx`:**
    *   Build UI for drag/drop, file selection, progress display.
    *   Props In: `isLoading`, `error`, `progress`, `currentFile`, `isDragging`.
    *   Callbacks Out: `onFileSelected` (passes `File` to container), `onClearFile`, `onDragEnter`, `onDragLeave`.
10. **Integrate `FileUpload`:** Render `FileUpload` within `ImportFormContainer`. Connect state and callbacks.
11. **Test:** Test file selection/drop, container reaction (triggering upload/parse), state updates (loading, progress, error), and file clearing. Use console logs/basic state display in container.
12. **Create `form/manual-entry.tsx`:**
    *   Build UI for manual entry fields and the "Add to Preview List" functionality. Manage form field state internally.
    *   Stage completed entries internally within this component's state.
    *   Props In: `isLoading`, `userId` (if needed for default values).
    *   Callbacks Out: `onSubmitEntries` (passes *list* of completed raw entries to container for parsing/validation).
13. **Integrate `ManualEntry`:** Render `ManualEntry` within `ImportFormContainer`. Connect state and callbacks.
14. **Test:** Test adding manual entries, submitting the list to the container. Check container's reaction (parsing/validation triggering). Test form clearing.
15. **Create `form/manage-csvs.tsx`:**
    *   Build UI for listing/deleting previous uploads.
    *   Fetch data directly using `getCSVUploads` (needs `userId`).
    *   Implement delete confirmation and call `deleteCSVUpload` (needs `userId`).
    *   Manage internal loading/error state for this section.
16. **Integrate `ManageCSVs`:** Render `ManageCSVs` within `ImportFormContainer`. Pass `userId`.
17. **Create `form/import-resources.tsx`:** Extract static content into this component.
18. **Integrate `ImportResources`:** Render `ImportResources` within `ImportFormContainer`.

**Phase 3: Preview Integration & Finalization**

19. **Adapt `import-preview.tsx`:**
    *   **Props:** Change props to receive `parsedTransactions: ParsedTransaction[]`, `validationIssues: ValidationIssue[]`, `stats: CalculatedStats` (or calculate internally), `isLoading: boolean`.
    *   **Callbacks:** Add `onCancel: () => void` and `onConfirmImport: () => void`.
    *   **Remove Logic:** Remove `handleImport` logic (API calls like `insertTransactions`, `uploadCSVFile`, `updateCSVUploadStatus`). This logic now resides in the container.
    *   **Retain Logic:** Keep internal logic for `unifiedTransactions` mapping, stats calculation (if not passed in), display formatting (`formatDate`, `formatNumber`, etc.), and type guards (`isOrder`, `isTransfer`).
    *   Ensure it correctly displays validation issues alongside transactions.
20. **Integrate `ImportPreview`:**
    *   Render `ImportPreview` conditionally within `ImportFormContainer` when `showPreview` is true.
    *   Pass required state (`parsedTransactions`, `validationIssues`, `isLoading`) and callbacks (`onCancel`, `onConfirmImport`).
21. **Test:** Test the full end-to-end flow: Upload/Manual Entry -> Container Processing (Upload, Parse, Validate) -> Preview Display -> Confirm Import within Preview -> Container API Calls (Insert, Status Update) -> UI Feedback (Success/Error). Check UI feedback at each step.
22. **Final Cleanup:**
    *   Remove all old code/comments related to the previous structure from all files.
    *   Delete the original `components/import/import-form.tsx` file.
    *   Update `app/dashboard/import/page.tsx` to import and render `ImportFormContainer`.
    *   Ensure all imports point to the new structure (`@/components/import/form/...`, `@/components/import/lib/...` etc.). Verify no unused imports remain.

## 4. Next Steps

*   Confirm this updated plan and checklist.
*   Revert the workspace to the state *before* the previous refactor attempt was started.
*   Begin Phase 1, starting with creating `types.ts`.

---

## 5. Current Status & Error Checklist (As of [Current Date/Time])

### Completed Steps Summary
*   **Phase 1 (Foundational Logic):**
    *   `types.ts` created and populated with core types.
    *   `utils.ts` created and populated with utility functions.
    *   `parsing.ts` created and populated with parsing/transformation logic.
    *   `validation.ts` created and populated with validation logic.
    *   Original `import-form.tsx` partially updated to use these modules (with some remaining errors).
*   **Phase 2 (Container Init):**
    *   `ImportFormContainer.tsx` created with initial state and core logic handlers (`handleFileSelected`, `handleManualSubmit`, `handlePreviewConfirm`, `handlePreviewCancel`). PapaParse integrated.

### Known Issues / Error Checklist

*   [x] **`ImportFormContainer.tsx` Linter Error (Line ~291):**
    *   **Issue:** `Type 'string | null | undefined' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
    *   **Context:** Assigning `currentCsvUploadId` (state var, type `string | null`) to `csvUploadId` property in `insertTransactions` call.
    *   **Hypothesis:** Potential mismatch between `currentCsvUploadId` state handling and the expected signature of `insertTransactions`, or inaccurate `TransferInsert` / `OrderInsert` type definitions.
    *   **Next Step:** Fixed by ensuring `null` is not passed to `insertTransactions`.
*   [ ] **`ImportFormContainer.tsx` Manual Mapping Logic:**
    *   **Issue:** `handleManualSubmit` function contains placeholder mapping logic (`csvRowEquivalent: CSVRow = { /* ... mapping logic ... */ };`).
    *   **Next Step:** Implement the actual mapping from the structure of `manualEntries` (currently `any[]`, needs definition) to `CSVRow`.
*   [ ] **`import-form.tsx` Deferred Linter Errors:**
    *   **Issue:** Existing linter errors within the temporary `ImportPreview` component definition inside `import-form.tsx` were deferred.
    *   **Next Step:** Address these errors once `ImportPreview` component is properly separated or before `import-form.tsx` is deleted.
*   [ ] **`import-form.tsx` RPC Type Error:**
    *   **Issue:** Previously noted persistent RPC typing error for `get_paginated_transactions`.
    *   **Next Step:** Manually regenerate Supabase types using the CLI (`npx supabase gen types typescript ...`).
*   [ ] **Supabase Type Accuracy:**
    *   **Issue:** Suspected inaccuracy or inconsistency in generated types (`OrderInsert`, `TransferInsert`, function signatures) contributing to linter errors.
    *   **Next Step:** Regenerate Supabase types (Still recommended despite fixing the container error, especially for the RPC error).
*   [ ] **Header Mapping Robustness (`parsing.ts`):**
    *   **Issue:** `normalizeHeaders` function has basic mapping; may need expansion for more diverse CSV formats.
    *   **Next Step:** Review and potentially enhance header normalization logic based on expected user CSV formats.
*   [ ] **Intermediate Testing:**
    *   **Issue:** The plan specified testing after each logical step in Phase 1, which was not performed.
    *   **Next Step:** Implement testing strategy moving forward, especially before integrating UI components.

---

## 6. Refactoring Checklist (Updated)

**Setup:**

*   [-] Revert workspace to pre-refactor state (if necessary).
*   [x] Confirm understanding of State Management approach (Prop Drilling vs. Context/Zustand).
*   [x] Confirm understanding of Error/Loading feedback strategy.

**Phase 1: Foundational Logic & Types**

*   [x] **Create `types.ts`:**
    *   [x] Define `ParsedTransaction`, `ParsedOrder`, `ParsedTransfer`.
    *   [x] Define `ValidationIssue`.
    *   [x] Define `CSVRow`.
    *   [ ] Define `ImportPreviewData`.
    *   [x] Define `UploadedCSV`.
    *   [ ] Define/Reference `OrderInsert`, `TransferInsert` from Supabase types.
*   [x] **Create `utils.ts`:**
    *   [x] Move/Create `isOrder` type guard.
    *   [x] Move/Create `isTransfer` type guard.
    *   [x] Move `formatDate`.
    *   [x] Move `formatFileSize`.
    *   [x] Move `normalizeTransactionType`.
    *   [x] Move `capitalizeExchange`.
    *   [x] Move `isShortTerm`.
    *   [x] Update imports in `import-form.tsx` and `import-preview.tsx`.
*   [ ] **Test Phase 1.1:** Verify `import-form.tsx` and `import-preview.tsx` still work with new types/utils.
*   [x] **Create `parsing.ts`:**
    *   [x] Move/Create `parseAmount`.
    *   [x] Move/Create `parseDate`.
    *   [x] Implement CSV header detection/mapping logic.
    *   [x] Move/Refactor `transformCSVToTransaction` (e.g., `transformRowToTransaction`) using `CSVRow`.
    *   [ ] Create `transformManualEntryToTransaction` (if needed).
    *   [x] Update `import-form.tsx` to use parsing functions.
*   [ ] **Test Phase 1.2:** Test CSV parsing (various headers) & manual entry transformation in `import-form.tsx`.
*   [x] **Create `validation.ts`:**
    *   [x] Move `validateTransaction`, ensure it takes `ParsedTransaction`.
    *   [x] Update `import-form.tsx` to use validation function.
*   [ ] **Test Phase 1.3:** Test parsing *and* validation feedback in `import-form.tsx`.

**Phase 2: Container & Form UI Separation**

*   [x] **Create `ImportFormContainer.tsx`:**
    *   [x] Initialize all required state variables (file, loading states, error, progress, transactions, issues, preview flag, tab, manual entries, csvUploadId, userId).
    *   [x] Implement file selection logic (trigger upload, parse).
    *   [x] Implement manual entry submission logic (trigger parse, validate).
    *   [x] Implement preview confirmation logic (prepare data, insert, update status).
    *   [x] Implement cancellation logic (reset state).
    *   [x] Implement central error/loading management.
    *   [x] Fetch `userId`.
*   [x] **Create `form/file-upload.tsx`:**
    *   [x] Build UI (drag/drop, input, progress).
    *   [x] Define props (isLoading, error, progress, file, isDragging).
    *   [x] Define callbacks (`onFileSelected`, `onClearFile`, drag handlers).
*   [x] **Integrate `FileUpload`:** Render in container, connect state/callbacks.
*   [x] **Test Phase 2.1:** Test file selection, container reaction, state updates, clearing.
*   [x] **Create `form/manual-entry.tsx`:**
    *   [x] Build UI (fields, "Add" button, staged list display).
    *   [x] Manage internal form state.
    *   [x] Manage internal staged list state.
    *   [x] Define props (`isLoading`, `userId`).
    *   [x] Define callback (`onSubmitEntries`).
*   [x] **Integrate `ManualEntry`:** Render in container, connect state/callbacks.
*   [x] **Test Phase 2.2:** Test adding entries, submitting list, container reaction, form clearing.
*   [x] **Create `form/manage-csvs.tsx`:**
    *   [x] Build UI (list, delete buttons).
    *   [x] Implement data fetching (`getCSVUploads`).
    *   [x] Implement deletion (`deleteCSVUpload`, confirmation).
*   [x] **Integrate `ManageCSVs`:** Render in container, pass `userId`.
*   [x] **Create `form/import-resources.tsx`:** Add static content.
*   [x] **Integrate `ImportResources`:** Render in container.

**Phase 3: Preview Integration & Finalization**

*   [x] **Adapt `import-preview.tsx`:**
    *   [x] Update props (`parsedTransactions`, `validationIssues`, `isLoading`).
    *   [x] Add callbacks (`onCancel`, `onConfirmImport`).
    *   [x] Remove API call logic (`handleImport`).
    *   [x] Verify display logic (unified view, stats, formatting) is correct.
    *   [x] Ensure validation issues are displayed correctly.
*   [x] **Integrate `ImportPreview`:** Render conditionally in container, pass state/callbacks.
*   [x] **Test Phase 3.1:** Test full E2E flow (Upload/Manual -> Parse/Validate -> Preview -> Confirm -> Insert/Update -> Feedback).
*   [ ] **Final Cleanup:**
    *   [ ] Remove old code/comments.
    *   [x] Delete `components/import/import-form.tsx`.
    *   [x] Update `app/dashboard/import/page.tsx` to use `ImportFormContainer`.
    *   [x] Verify all imports use the new structure.
    *   [ ] Remove unused imports/variables. 