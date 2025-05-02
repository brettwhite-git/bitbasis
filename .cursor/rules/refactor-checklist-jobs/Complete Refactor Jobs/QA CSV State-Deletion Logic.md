# Data Management & Deletion Strategy

## Overview
This document outlines the design for managing user-uploaded CSV files and deleting transaction data within the BitBasis application. The primary goals are to provide users control over their data while ensuring data integrity and security through Supabase RLS and best practices. **This includes differentiating between transactions originating from CSV imports versus manual entry.**

// ... existing code ...

### 1.3. UI for CSV Management
- **Location:** Use 'Manage CSV's filter in the import form 
- **Functionality:**
    - List all uploaded CSVs for the user (showing filename, upload date, status, row count, imported count).
    - Display errors if an import failed for a specific CSV.
    - Allow users to `DELETE` a CSV record. Deleting the record should:
        - Trigger deletion of the corresponding file from Supabase Storage.
        - Trigger deletion of all associated `orders` and `transfers` **that have the matching `csv_upload_id`** (see Bulk Deletion below).
    - **(Optional):** Consider UI elements to show which transactions in the main `TransactionsTable` originated from a specific CSV vs. manual entry (e.g., an icon or filter).

## 2. Linking CSVs to Transactions

### 2.1. Schema Changes (`orders` & `transfers` tables)
- Add a new nullable column `csv_upload_id` to both `public.orders` and `public.transfers` tables.
- This column will be a foreign key referencing `public.csv_uploads(id)`.
- Set the foreign key constraint to `ON DELETE CASCADE`. **This cascade will only affect rows where `csv_upload_id` matches the deleted `csv_uploads` record.**
- **Crucially, for transactions created via the Manual Entry form, the `csv_upload_id` column will be `NULL`. This distinguishes manually entered data from CSV-imported data.**

- **Migration Example (Conceptual):**
    ```sql
    -- Add column to orders
    ALTER TABLE public.orders
    ADD COLUMN csv_upload_id UUID REFERENCES public.csv_uploads(id) ON DELETE CASCADE;
    CREATE INDEX idx_orders_csv_upload_id ON public.orders(csv_upload_id);

    -- Add column to transfers
    ALTER TABLE public.transfers
    ADD COLUMN csv_upload_id UUID REFERENCES public.csv_uploads(id) ON DELETE CASCADE;
    CREATE INDEX idx_transfers_csv_upload_id ON public.transfers(csv_upload_id);
    ```

### 2.2. Import Process Update
- **CSV Import:**
    - **Step 1 (Local Parsing):** File selected/dropped, parsed locally, validated.
    - **Step 2 (Preview):** User reviews data in `ImportPreview`.
    - **Step 3 (Confirmation & Upload):** User confirms import. File uploaded to Storage, `csv_uploads` record created (status: 'pending'), get `csvUploadId`.
    - **Step 4 (Processing Status):** `csv_uploads` status updated to 'processing'.
    - **Step 5 (Insertion):** `insertTransactions` called with data and `csvUploadId`. It adds the ID to each transaction and inserts.
    - **Step 6 (Completion/Error):** `insertTransactions` updates `csv_uploads` status to 'completed' or 'error'.
- **Manual Entry:**
    - Transactions added via the "Manual Entry" form (`components/import/import-form.tsx`) are processed and sent to `insertTransactions` **without** a `csv_upload_id`.
    - The `insertTransactions` function inserts these rows into `orders` and `transfers` with the `csv_upload_id` column set to `NULL`.

## 3. Transaction Deletion

### 3.1. Single Row Deletion (Manual)
- **Applies To:** Both CSV-imported and Manually Entered transactions.
- **Component:** `components/transactions/transactions-table.tsx`
- **Frontend Logic:**
    - User selects one or more rows in the table.
    - The frontend collects the list of selected transaction IDs (e.g., `['order-123', 'transfer-456', 'order-789']`). **These IDs uniquely identify the row regardless of its origin.**
    - Send this list to a dedicated backend endpoint (API Route or Server Action).
- **Backend Logic (API Route/Server Action - e.g., `/api/transactions/delete`):**
    - Authenticate the request.
    - Receive the list of transaction IDs.
    - Iterate through the list:
        - Parse each ID to determine type (`order` or `transfer`) and the numeric `id`.
        - For `order-ID`: Execute `DELETE FROM public.orders WHERE id = <ID> AND user_id = auth.uid();`.
        - For `transfer-ID`: Execute `DELETE FROM public.transfers WHERE id = <ID> AND user_id = auth.uid();`.
        - **This works irrespective of whether `csv_upload_id` is NULL or not.**
    - Handle potential errors.
    - Return a success or error response.
- **RLS Policy (`orders` & `transfers`):** Ensure `DELETE` policies exist and enforce ownership (`auth.uid() = user_id`).

### 3.2. Bulk Deletion (by CSV)
- **Applies To:** Only transactions imported from a specific CSV file.
- **Trigger:** User deletes a record from the `csv_uploads` table via the UI (Import History).
- **Mechanism:** Relies on the `ON DELETE CASCADE` foreign key constraint on the `csv_upload_id` column in `orders` and `transfers`.
- **Backend Logic:**
    - Create an API Route / Server Action (e.g., `/api/csv-uploads/delete`).
    - Receive the `csv_upload_id` to delete.
    - Verify the user owns this `csv_uploads` record.
    - Delete the file from Supabase Storage.
    - Delete the record from the `public.csv_uploads` table.
    - **The `ON DELETE CASCADE` constraint automatically triggers the deletion of all rows in `orders` and `transfers` where `csv_upload_id` matches the deleted record's ID.**
    - **Manually entered transactions (where `csv_upload_id` is `NULL`) are unaffected by this operation.**
    - Return success/error status.

## 4. Security Considerations
- **RLS is critical:** ... (rest of the section remains the same)

## 5. Implementation Steps
1.  Create Supabase Storage bucket `csv_uploads` and configure policies.
2.  Create `public.csv_uploads` table migration, add RLS policies and indexes.
3.  Create migration to add `csv_upload_id` column (FK, `ON DELETE CASCADE`, index) to `orders` and `transfers`.
4.  Update the CSV import workflow to populate `csv_upload_id`.
5.  Update the Manual Entry workflow to ensure `csv_upload_id` is **not** set (remains `NULL`).
6.  Implement the backend API Route / Server Action for single transaction deletion (verify it handles both types implicitly).
7.  Connect the `handleDeleteSelected` function in `transactions-table.tsx` to the new backend endpoint.
8.  Verify/Implement RLS `DELETE` policies on `orders` and `transfers`.
9.  Build the "Import History" UI for managing `csv_uploads` records.
10. Implement the backend API Route / Server Action for deleting `csv_uploads` records (verifying cascade behavior).
11. Connect the delete action in the "Import History" UI to this backend endpoint. 

## Implementation Checklist

- [x] Create Supabase Storage bucket `csv_uploads` and configure policies.
- [x] Create `public.csv_uploads` table migration, add RLS policies and indexes.
- [x] Create migration to add `csv_upload_id` column (FK, `ON DELETE CASCADE`, index) to `orders` and `transfers`.
- [x] Update the CSV import workflow to populate `csv_upload_id`.
- [x] Update the Manual Entry workflow to ensure `csv_upload_id` is **not** set (remains `NULL`).
- [x] Implement the backend API Route / Server Action for single transaction deletion.
- [x] Connect the `handleDeleteSelected` function in `transactions-table.tsx` to the new backend endpoint.
- [x] Verify/Implement RLS `DELETE` policies on `orders` and `transfers`.
- [x] Build the "Import History" UI for managing `csv_uploads` records.
- [x] Implement the backend API Route / Server Action for deleting `csv_uploads` records.
- [x] Connect the delete action in the "Import History" UI to this backend endpoint.
