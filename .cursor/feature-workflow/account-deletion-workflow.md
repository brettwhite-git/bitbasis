# Account Deletion Workflow - Feature Planning Document

## Overview

This document outlines the complete account deletion workflow for BitBasis, ensuring GDPR compliance, data integrity, and a smooth user experience when users choose to permanently delete their accounts.

## Current State Analysis

### ✅ Existing Implementation
- **Frontend UI**: Account deletion button with basic confirmation dialog in `components/settings/account-settings.tsx`
- **Individual Data APIs**: Endpoints for deleting transactions (`/api/transaction-history`) and CSV uploads
- **Database Security**: Row Level Security (RLS) policies prevent unauthorized data access
- **Data Export**: Users can export all data via `exportAllUserDataSingle()` function
- **Database Constraints**: Foreign key constraints with `ON DELETE CASCADE` for some relationships

### ❌ Missing Implementation
- **Complete Account Deletion API**: No comprehensive endpoint for full account deletion
- **Supabase Auth Integration**: Current frontend handler is placeholder code
- **Stripe Cleanup Logic**: No handling of customer/subscription data during deletion
- **Coordinated Workflow**: No systematic approach to delete all user-related data
- **Error Recovery**: No rollback mechanism for partial deletion failures

## User Data Inventory

Based on database schema analysis, the following user data needs cleanup:

### Database Tables
1. **`transactions`** - User's Bitcoin transaction history
2. **`csv_uploads`** - CSV upload metadata and processing status
3. **`terms_acceptance`** - Legal compliance records
4. **`customers`** - Stripe customer linkage
5. **`subscriptions`** - Stripe subscription data
6. **`auth.users`** - Supabase Auth user account (via admin API)

### External Data
1. **Supabase Storage** - CSV files uploaded by user (in user-specific folders)
2. **Stripe Customer Data** - Customer profile and payment methods
3. **Stripe Subscriptions** - Active or canceled subscription records

## Proposed Account Deletion Flow

### Phase 1: Pre-Deletion Validation & Preparation

#### 1.1 User Intent Confirmation
```
UI Flow:
1. User clicks "Delete Account" button
2. Show enhanced confirmation dialog with:
   - Warning about data permanence
   - List of data that will be deleted
   - Option to export data first
   - Subscription status check
   - Required confirmation input
```

#### 1.2 Subscription Status Check
```
Business Logic:
- If active subscription exists:
  - Display subscription details
  - Offer cancellation options:
    a) Cancel immediately and delete account
    b) Cancel at period end, then delete
    c) Return to manage subscription first
- If lifetime subscription:
  - Show special handling notice
  - Confirm forfeiture of lifetime access
```

#### 1.3 Data Export Opportunity
```
User Options:
- "Export my data first" (recommended)
- "I already have my data"
- "Delete without export" (requires additional confirmation)
```

#### 1.4 Final Confirmation
```
Security Measures:
- Require typing "DELETE" in text field
- Show final summary of what will be deleted
- Email confirmation link (optional enhancement)
- Clear "this cannot be undone" messaging
```

### Phase 2: Deletion Execution Sequence

#### 2.1 API Endpoint Design
```typescript
POST /api/account/delete
{
  confirmationText: "DELETE",
  cancelSubscriptions: boolean,
  exportDataFirst?: boolean,
  acknowledgeDataLoss: boolean
}
```

#### 2.2 Deletion Order (Critical Sequence)
```
1. Validate user authentication & confirmation
2. Handle Stripe subscriptions:
   - Cancel active subscriptions
   - Delete payment methods (optional)
   - Delete Stripe customer record
3. Delete application data (with transaction):
   - csv_uploads (triggers cascade to transactions)
   - terms_acceptance
   - customers table record
   - subscriptions table records
4. Delete Supabase Storage files:
   - List all files in user folder
   - Delete individual files
   - Remove user folder
5. Delete Supabase Auth user:
   - Use admin client to delete auth.users record
   - This cascades to remaining FK relationships
6. Clear user session and redirect
```

### Phase 3: Post-Deletion Cleanup

#### 3.1 Session Management
```
- Immediately sign out user
- Clear all browser sessions
- Invalidate refresh tokens
- Clear local storage/cookies
```

#### 3.2 User Feedback
```
- Redirect to deletion confirmation page
- Show success message
- Optional: Send confirmation email to deleted account
- Provide support contact for issues
```

## Technical Implementation Details

### Error Handling Strategy

#### Database Transaction Approach
```sql
BEGIN;
  -- Delete user data in correct order
  DELETE FROM csv_uploads WHERE user_id = $1;
  DELETE FROM terms_acceptance WHERE user_id = $1;
  DELETE FROM customers WHERE id = $1;
  DELETE FROM subscriptions WHERE user_id = $1;
COMMIT;
```

#### Rollback Scenarios
1. **Stripe API Failure**: Log error, continue with account deletion, manual Stripe cleanup
2. **Storage Deletion Failure**: Log files for manual cleanup, continue with account deletion
3. **Database Transaction Failure**: Rollback all changes, show error to user
4. **Auth Deletion Failure**: Log for manual cleanup, user account may be orphaned

### Security Considerations

#### Authentication Requirements
- User must be actively authenticated
- Recent login verification (optional enhancement)
- Rate limiting on deletion attempts
- Audit logging of deletion requests

#### Data Validation
- Verify user owns all data being deleted
- Double-check subscription ownership
- Validate confirmation text exactly matches
- Ensure no active sessions from other devices

### Performance Considerations

#### Async Processing Option
```
For users with large datasets:
1. Queue deletion job
2. Send immediate confirmation
3. Process deletion in background
4. Email completion notification
```

#### Batch Operations
- Delete transactions in batches if count > 1000
- Stream file deletion for large storage usage
- Implement timeout handling for long operations

## User Experience Design

### Enhanced Confirmation Dialog

```typescript
interface DeletionConfirmationProps {
  userEmail: string;
  transactionCount: number;
  csvUploadCount: number;
  subscriptionStatus: 'active' | 'canceled' | 'lifetime' | 'none';
  lastExportDate?: Date;
}
```

#### Dialog Content Structure
1. **Header**: "Delete Account - This Cannot Be Undone"
2. **Data Summary**: 
   - "X transactions will be deleted"
   - "X CSV uploads will be removed"
   - "Subscription status: [status]"
3. **Export Reminder**: Last export date or "Never exported"
4. **Confirmation Input**: "Type DELETE to confirm"
5. **Action Buttons**: "Cancel" / "Delete My Account"

### Success/Error Pages

#### Success Page (`/account-deleted`)
- Confirmation message
- What was deleted
- Support contact information
- Prevent back navigation

#### Error Page
- Clear error explanation
- Next steps for user
- Support contact
- Option to try again

## Compliance & Legal Considerations

### GDPR Compliance
- **Right to be Forgotten**: Complete data deletion within 30 days
- **Data Portability**: Export functionality before deletion
- **Audit Trail**: Log deletion requests (minimal data)
- **Third-party Cleanup**: Ensure Stripe data is also removed

### Data Retention Policy
```
Minimal logging for legal compliance:
- Deletion timestamp
- User email (hashed)
- Reason code
- Success/failure status
```

### Terms of Service Integration
- Update ToS to include account deletion process
- Clarify data retention periods
- Explain third-party data handling

## Testing Strategy

### Unit Tests
- API endpoint validation
- Database transaction rollback
- Stripe integration mocking
- File deletion verification

### Integration Tests
- Complete deletion workflow
- Error scenario handling
- Cross-service data consistency
- Performance with large datasets

### Manual Testing Scenarios
1. **Happy Path**: Standard user with moderate data
2. **Heavy User**: User with 1000+ transactions, multiple CSV uploads
3. **Active Subscriber**: User with active monthly subscription
4. **Lifetime Subscriber**: User with lifetime subscription
5. **Error Scenarios**: Network failures, API timeouts
6. **Partial Failures**: Stripe success but database failure

## Implementation Timeline

### Phase 1: Core Implementation (Week 1)
- [ ] Create `/api/account/delete` endpoint
- [ ] Implement database deletion logic
- [ ] Update frontend confirmation dialog
- [ ] Basic error handling

### Phase 2: External Integrations (Week 2)
- [ ] Stripe customer/subscription deletion
- [ ] Supabase Storage file cleanup
- [ ] Supabase Auth user deletion
- [ ] Enhanced error recovery

### Phase 3: UX & Polish (Week 3)
- [ ] Enhanced confirmation dialog
- [ ] Success/error pages
- [ ] Email notifications
- [ ] Performance optimizations

### Phase 4: Testing & Documentation (Week 4)
- [ ] Comprehensive testing
- [ ] Documentation updates
- [ ] Privacy policy updates
- [ ] Deployment and monitoring

## Success Criteria

### Functional Requirements
- [ ] User can successfully delete account with all data
- [ ] Stripe subscriptions are properly canceled
- [ ] All database records are removed
- [ ] Storage files are deleted
- [ ] User is signed out and redirected

### Performance Requirements
- [ ] Deletion completes within 30 seconds for typical users
- [ ] No data remains accessible after deletion
- [ ] Error scenarios are handled gracefully
- [ ] Large datasets don't cause timeouts

### Compliance Requirements
- [ ] GDPR compliance verified
- [ ] Audit trail maintained
- [ ] Privacy policy updated
- [ ] Legal review completed

## Risk Assessment

### High Risk
- **Data Leakage**: Incomplete deletion leaving user data accessible
- **Service Disruption**: Deletion process affecting other users
- **Legal Compliance**: GDPR violations from improper deletion

### Medium Risk
- **Stripe Integration**: Payment data not properly cleaned up
- **Performance Impact**: Large deletions affecting database performance
- **User Experience**: Confusing or frustrating deletion process

### Low Risk
- **Edge Cases**: Unusual data configurations causing issues
- **Monitoring**: Lack of visibility into deletion success rates
- **Documentation**: Incomplete documentation for support team

## Monitoring & Alerting

### Metrics to Track
- Deletion request volume
- Success/failure rates
- Processing duration
- Error types and frequency
- User feedback on process

### Alerts
- Deletion failures requiring manual intervention
- Unusual spike in deletion requests
- Performance degradation during deletions
- Stripe API integration failures

---

## Appendix

### Database Schema References
- See `supabase/migrations/` for current table structures
- RLS policies defined in migration files
- Foreign key constraints with CASCADE behavior

### API Documentation
- Current transaction deletion: `DELETE /api/transaction-history`
- Current CSV deletion: via `deleteCSVUpload()` function
- Stripe integration: `lib/stripe/` modules

### Related Documentation
- Privacy Policy: `/app/privacy/page.tsx`
- Terms of Service: `/app/terms/page.tsx`
- User Settings: `components/settings/account-settings.tsx`

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Author: Development Team*  
*Status: Planning Phase*
