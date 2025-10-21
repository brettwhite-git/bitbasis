# Supabase Configuration Updates

This document contains manual configuration changes that must be made in the Supabase Dashboard. These cannot be applied via SQL migrations.

## Overview

Three security advisors require dashboard configuration changes:
1. **Auth OTP Long Expiry** - Reduce magic link expiration time
2. **Leaked Password Protection** - Enable password breach checking
3. **Postgres Version Upgrade** - Apply latest security patches

---

## 1. Reduce Auth OTP Expiry (Security)

### Current Issue
- Magic link emails remain valid for more than 1 hour
- Security risk: Links could be intercepted and used much later
- Supabase recommends expiry < 1 hour

### Recommended Configuration
- **Magic Link Expiry**: 30 minutes (1800 seconds)
- **User Experience**: Unaffected - users stay logged in via refresh tokens (see Session Management below)

### Steps to Update

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `npcvbxrshuflujcnikon`
3. Go to **Authentication** → **Settings** → **Auth Providers**
4. Click on **Email** provider
5. Find **"Magic Link Expiry"** or **"Email OTP Expiry"** setting
6. Change value from current to **1800 seconds** (30 minutes)
7. Click **Save** at the bottom of the page

### Verification
After applying:
- Test magic link login to ensure links still work
- Wait 30+ minutes and verify link expires with error message
- Existing logged-in users should remain logged in (refresh tokens are separate)

---

## 2. Enable Leaked Password Protection (Security)

### Current Issue
- Password breach checking is disabled
- If users ever use passwords, they could use compromised passwords
- Supabase Auth can check against HaveIBeenPwned.org database

### Recommended Configuration
- **Enable**: Password breach checking
- **Impact**: None currently (we use magic link auth only)
- **Future-proofing**: If password auth is ever enabled, this protection is active

### Steps to Update

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `npcvbxrshuflujcnikon`
3. Go to **Authentication** → **Settings** → **Auth Providers**
4. Find **"Password Security"** or **"Leaked Password Protection"** section
5. Enable **"Check against HaveIBeenPwned.org"** toggle
6. Click **Save**

### Verification
- No immediate change to user experience (magic link auth)
- Future password sign-ups will be checked automatically

---

## 3. Upgrade Postgres Version (Security)

### Current Issue
- Current version: `supabase-postgres-15.8.1.044`
- Security patches available in newer 15.x releases
- Minor version upgrades include security fixes and bug patches

### Recommended Actions

#### Local Development Upgrade

Update Supabase CLI to get latest Postgres version:

```bash
# Option 1: Homebrew (macOS)
brew upgrade supabase/tap/supabase

# Option 2: npm (all platforms)
npm install -g supabase

# Verify new version
supabase --version

# Restart local Supabase with new version
supabase stop
supabase start

# Verify local Postgres version
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT version();"
```

#### Production Upgrade

**⚠️ Important**: Create backup before upgrading

**Steps:**

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `npcvbxrshuflujcnikon`
3. Go to **Database** → **Backups**
4. Click **"Create Backup"** and wait for completion
5. Go to **Database** → **Settings**
6. Find **"Postgres Version"** section
7. If upgrade is available, click **"Upgrade"** button
8. Review upgrade details and confirm
9. Wait for upgrade to complete (typically 2-5 minutes)
10. Monitor **Database** → **Logs** for any issues

**Timing Considerations:**
- Schedule during low-traffic window if possible
- Downtime is typically < 1 minute for minor version upgrades
- Supabase handles migration and rollback automatically

**Post-Upgrade Verification:**

```bash
# Check production Postgres version
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres.npcvbxrshuflujcnikon@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -c "SELECT version();"

# Verify all functions still work
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres.npcvbxrshuflujcnikon@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -c "\df+ public.upsert_monthly_close"
```

### Rollback Plan
- Supabase automatically creates snapshot before upgrade
- If issues occur, contact Supabase support for rollback assistance
- Backup created in step 4 can be restored manually if needed

---

## Session Management Reference

### Magic Link Authentication Flow

Understanding how magic links and sessions work together:

```
User clicks magic link
  ↓
OTP validated (expires after 30 min)
  ↓
JWT issued (access token + refresh token)
  ↓
Access token valid: 1 hour
  ↓
Refresh token valid: 30 days (default)
  ↓
Middleware auto-refreshes access token when expired
  ↓
User stays logged in across browser sessions ✅
```

### Key Settings

| Setting | Current/Recommended | Purpose | User Impact |
|---------|---------------------|---------|-------------|
| **Magic Link Expiry** | 30 minutes | How long email link is valid | Must click link within 30 min |
| **Access Token (JWT) Expiry** | 1 hour | How long before token refresh needed | Transparent - auto-refreshed |
| **Refresh Token Expiry** | 30 days (default) | How long user stays logged in | Stays logged in for 30 days |
| **Refresh Token Reuse Interval** | 10 seconds | Prevent token theft | Transparent |

### Recommended Adjustments

If you want shorter session duration for security:

1. Go to **Authentication** → **Settings** → **JWT Settings**
2. Adjust **Refresh Token Lifetime**:
   - **High Security**: 7 days (users re-authenticate weekly)
   - **Balanced**: 14 days (default-ish)
   - **High Convenience**: 30 days (current default)
3. Keep **JWT Expiry** at 1 hour (standard)

**Current Recommendation**: Keep 30-day refresh tokens for good UX, rely on 30-minute magic link expiry for security.

---

## Implementation Checklist

Use this checklist to track completion:

### Pre-Implementation
- [ ] Backup production database (via dashboard)
- [ ] Verify current advisor warnings in dashboard
- [ ] Apply migration `20251021000009_final_security_performance_fixes.sql` to production
- [ ] Verify migration success (no errors in logs)

### Configuration Updates
- [ ] Update Magic Link Expiry to 1800 seconds (30 minutes)
- [ ] Enable Leaked Password Protection
- [ ] Upgrade local Supabase CLI
- [ ] Upgrade local Postgres (via `supabase stop && supabase start`)
- [ ] Upgrade production Postgres version

### Post-Implementation Verification
- [ ] Run Supabase security advisors again - verify 3 warnings resolved
- [ ] Test magic link authentication flow
- [ ] Verify magic link expires after 30 minutes
- [ ] Confirm existing users remain logged in
- [ ] Check database logs for any errors
- [ ] Monitor application for 24-48 hours

### Expected Results

After completing all steps:

**Security Advisors - BEFORE:**
- 🔴 6 security warnings
- 🔴 3 performance warnings

**Security Advisors - AFTER:**
- ✅ 3 code-based warnings resolved (via migration)
- ✅ 3 config-based warnings resolved (via dashboard)
- ✅ 3 performance warnings resolved (via migration)
- 🎉 0 warnings remaining

---

## Rollback Procedures

If any issues occur:

### Rollback Auth Settings
1. Go to Authentication → Settings
2. Revert Magic Link Expiry to previous value
3. Disable Leaked Password Protection if it causes issues

### Rollback Postgres Upgrade
1. Contact Supabase Support
2. Request rollback to previous version using pre-upgrade snapshot
3. Provide project ID: `npcvbxrshuflujcnikon`

### Rollback Migration
```bash
# If migration causes issues, rollback via Supabase CLI
supabase db reset

# Or manually revert policies (see migration rollback section)
```

---

## Support & Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/npcvbxrshuflujcnikon
- **Supabase Support**: https://supabase.com/support
- **Auth Documentation**: https://supabase.com/docs/guides/auth
- **Security Best Practices**: https://supabase.com/docs/guides/platform/going-into-prod#security
- **Postgres Upgrades**: https://supabase.com/docs/guides/platform/upgrading

---

## Notes

- All times in this document refer to server time (UTC)
- Database changes are applied immediately
- Auth setting changes take effect within 5 minutes
- Postgres upgrades require brief downtime (< 1 minute typically)
- Always test in development/staging before production when possible

---

**Last Updated**: 2025-01-21  
**Migration Version**: 20251021000009  
**Project ID**: npcvbxrshuflujcnikon

