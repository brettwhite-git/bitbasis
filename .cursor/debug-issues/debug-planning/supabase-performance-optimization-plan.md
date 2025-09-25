# Supabase Performance Optimization Plan

## Performance Issues Summary

### Critical Issues (81.8% of total query time + RLS overhead)
1. **Bitcoin Price Updates**: fetch_and_update_btc_spot_price() consuming 66% of total query time (21,997 calls, 142ms avg)
2. **RLS Performance Problems**: All auth policies using inefficient auth.uid() pattern causing per-row evaluation
3. **Multiple Overlapping Policies**: fear_greed_index, subscriptions, and terms_acceptance tables have redundant policies
4. **Supabase Dashboard Metadata**: Complex introspection queries consuming 15.8% of total query time (8,301 calls, 90ms avg)

### Moderate Issues
5. **Legacy Orders Table**: Multiple PostgREST queries still hitting deprecated orders table
6. **Connection Overhead**: High frequency of session configuration queries (196,381 calls)
7. **System Catalog Queries**: Extension and function metadata queries adding overhead

## Optimization Checklist

### Phase 1: RLS Policy Optimization (Immediate - Critical Impact)
- [ ] Fix auth.uid() pattern in transactions table policies (4 policies)
- [ ] Fix auth.uid() pattern in subscriptions table policies (5 policies)
- [ ] Fix auth.uid() pattern in csv_uploads table policies (4 policies)
- [ ] Fix auth.uid() pattern in terms_acceptance table policies (3 policies)
- [ ] Fix auth.uid() pattern in customers table policies (1 policy)
- [ ] Fix auth.uid() pattern in fear_greed_index table policies (2 policies)
- [ ] Consolidate overlapping policies on fear_greed_index table
- [ ] Consolidate overlapping policies on subscriptions table
- [ ] Test all RLS policies after optimization

### Phase 2: Bitcoin Price Caching (Immediate - High Impact)
- [ ] Increase Bitcoin price cache duration from 2 minutes to 5-10 minutes
- [ ] Review cron job frequency for price updates (currently every ~10 minutes)
- [ ] Audit client-side price update triggers
- [ ] Monitor price update call frequency after changes

### Phase 3: Legacy Table Migration (Medium Priority)
- [ ] Identify remaining queries using orders table vs transactions table
- [ ] Create migration plan to eliminate orders table usage
- [ ] Update PostgREST queries to use unified transactions schema
- [ ] Remove orders table once migration complete

### Phase 4: Connection and Query Optimization (Low Priority)
- [ ] Review Supabase connection pooling configuration
- [ ] Limit team dashboard access during peak hours
- [ ] Consider read replica for dashboard metadata queries
- [ ] Optimize session configuration query patterns

### Phase 5: Monitoring and Alerts
- [ ] Set query performance thresholds and alerts
- [ ] Create dashboard for tracking top slow queries
- [ ] Monitor query execution time trends
- [ ] Establish baseline metrics after optimizations

## Expected Performance Improvements
- **Phase 1**: 50-80% reduction in RLS policy evaluation overhead (critical for all queries)
- **Phase 2**: 60-80% reduction in Bitcoin price update overhead
- **Phase 3**: Elimination of duplicate table maintenance overhead
- **Phase 4**: 10-20% reduction in connection overhead
- **Overall**: Target 80% reduction in total query execution time

## Success Criteria
- [ ] All RLS policies use optimized (select auth.uid()) pattern
- [ ] No overlapping permissive policies on any table
- [ ] Bitcoin price updates consume <20% of total query time
- [ ] Orders table queries eliminated completely
- [ ] Average query response time <30ms for application queries
- [ ] Database CPU utilization reduced by 60%
- [ ] Zero functional regressions after optimizations

## Risk Assessment
- **Phase 1**: Medium risk - RLS changes require thorough auth testing
- **Phase 2**: Low risk - only affects cache duration
- **Phase 3**: Medium risk - requires thorough testing of transaction queries
- **Phase 4**: Low risk - configuration changes only
- **Phase 5**: No risk - monitoring additions only

## RLS Optimization Examples

### Auth Pattern Fix
```sql
-- BEFORE (inefficient - evaluates per row)
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- AFTER (efficient - evaluates once per query)
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING ((select auth.uid()) = user_id);
```

### Policy Consolidation Example
```sql
-- BEFORE (multiple overlapping policies)
CREATE POLICY "users_select" ON subscriptions FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "users_insert" ON subscriptions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "users_update" ON subscriptions FOR UPDATE USING ((select auth.uid()) = user_id);

-- AFTER (single comprehensive policy)
CREATE POLICY "users_all_operations" ON subscriptions
FOR ALL USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
```
