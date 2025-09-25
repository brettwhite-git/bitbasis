# Supabase Security Remediation Plan

## Security Issues Summary

### Function Search Path Vulnerabilities (24 functions)
**Risk**: Functions inherit session search_path, creating potential security exploits
**Impact**: Malicious users could manipulate search paths to access unintended objects

### Extension Security Risk (1 extension)
**Risk**: pg_net extension installed in public schema
**Impact**: Reduces security isolation

### Auth Configuration Issues (2 items)
**Risk**: Suboptimal authentication security settings
**Impact**: Increased vulnerability window and reduced password security

### Database Version (1 item)
**Risk**: PostgreSQL version has available security patches
**Impact**: Missing critical security updates

## Remediation Checklist

### Phase 1: Immediate Auth Configuration (Zero Risk)
- [ ] Reduce OTP expiry from >1 hour to 30 minutes in Supabase Auth settings
- [ ] Note: Leaked password protection warning not applicable (magic link auth only)

### Phase 2: Function Security Hardening (Low Risk)
- [ ] Create migration to fix all 24 functions with search_path = ''
- [ ] Priority functions to fix first:
  - [ ] ensure_user_id_matches_auth
  - [ ] get_user_transaction_count_v2
  - [ ] get_user_subscription_info
  - [ ] can_user_add_transactions
- [ ] Update function definitions to fully qualify all schema references
- [ ] Test function behavior after search_path changes

### Phase 3: Extension Schema Migration (Medium Risk)
- [ ] Audit current pg_net extension usage in codebase
- [ ] Create extensions schema: CREATE SCHEMA IF NOT EXISTS extensions
- [ ] Move pg_net extension: ALTER EXTENSION pg_net SET SCHEMA extensions
- [ ] Update any code references to pg_net functions
- [ ] Test HTTP request functionality

### Phase 4: Database Upgrade (Scheduled Maintenance)
- [ ] Schedule PostgreSQL upgrade during low-traffic window
- [ ] Backup database before upgrade
- [ ] Upgrade from supabase-postgres-15.8.1.044 to latest patched version
- [ ] Verify all functionality post-upgrade

## Testing Strategy
- [ ] Test Phase 1 changes in production (configuration only)
- [ ] Test Phase 2 changes in development branch first
- [ ] Test Phase 3 changes in development branch with HTTP functionality verification
- [ ] Schedule Phase 4 during maintenance window with rollback plan

## Affected Functions List
ensure_user_id_matches_auth, get_latest_terms_acceptance, update_spot_price, call_update_price, fetch_and_update_btc_spot_price, get_user_transaction_count_v2, set_historical_price_date, update_btc_monthly_close_updated_at, get_last_day_of_month, is_last_day_of_month, upsert_monthly_close, update_fear_greed_index, fetch_and_store_btc_price_http, get_monthly_close_data, validate_monthly_close_completeness, update_ath, check_and_update_btc_ath, get_user_subscription_info, get_user_transaction_count, update_btc_price, update_updated_at_column, can_user_add_transactions

## Success Criteria
- [ ] All function search_path warnings resolved
- [ ] pg_net extension moved to dedicated schema
- [ ] OTP expiry reduced to secure timeframe
- [ ] PostgreSQL updated to latest patched version
- [ ] Zero functional regressions after all changes
