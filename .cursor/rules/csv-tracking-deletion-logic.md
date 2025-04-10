# CSV Management & Transaction Deletion Plan

## Overview
Implementation plan for tracking CSV imports and allowing users to delete associated transactions.

## Data Model

### New Table: `csv_imports`
```sql
CREATE TABLE public.csv_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_hash TEXT,
  status TEXT DEFAULT 'pending',
  file_path TEXT,
  transaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Existing Table Updates
```sql
ALTER TABLE public.orders 
  ADD COLUMN csv_import_id UUID REFERENCES public.csv_imports,
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.transfers 
  ADD COLUMN csv_import_id UUID REFERENCES public.csv_imports,
  ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
```

## Implementation Phases

### Phase 1: Database & Storage Setup
- Create database migrations
- Configure storage bucket with RLS
- Update database access functions

### Phase 2: Import Process Enhancement
- Create CSV import record before processing
- Store original file in storage
- Link transactions to import ID

### Phase 3: Management UI
- List view of imports with metadata
- Download original files
- Delete with confirmation

### Phase 4: Deletion Logic
- Backend function to mark imports and transactions as deleted
- Frontend confirmation flow
- Transaction refresh after deletion

## Security Considerations
- Enforce RLS policies
- Validate user ownership
- Rate limit file operations
- Add audit logging

## Estimated Timeline
- Database & Storage: 2-3 days
- Import Process: 3-4 days
- Management UI: 2-3 days
- Deletion Logic: 2-3 days
- Testing: 2-3 days

Total: ~2-3 weeks