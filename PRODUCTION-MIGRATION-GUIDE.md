# Production Migration Guide

**Last Updated**: January 2025  
**Status**: Ready for Production Deployment

---

## Pre-Deployment Checklist

### ✅ Security Status
- [x] All Critical/High security issues resolved (see `SECURITY-ASSESSMENT.md`)
- [x] Security headers configured
- [x] RLS policies verified
- [x] Input validation implemented
- [x] Error sanitization complete

### 📋 Required Steps

1. **Database Migrations**
2. **Environment Variables Configuration**
3. **Supabase Edge Functions Deployment**
4. **Vercel Deployment Configuration**
5. **Stripe Webhook Configuration**
6. **Post-Deployment Verification**

---

## Step 1: Database Migrations

### Link to Production Database
```bash
# Set production database password
export SUPABASE_DB_PASSWORD='your_production_db_password'

# Link to production project
supabase link --project-ref npcvbxrshuflujcnikon
```

### Check Migration Status
```bash
# List all migrations
supabase migration list

# Check which migrations need to be applied
supabase migration list --linked
```

### Apply Migrations
```bash
# Push all pending migrations to production
supabase db push

# Verify migrations applied successfully
supabase migration list --linked
```

### Critical Migrations to Verify
- ✅ `20250122000001_fix_hardcoded_jwt_token.sql` - Security fix
- ✅ `20250122000002_add_customers_table_policies.sql` - RLS policies
- ✅ All `20251021*` migrations - Security and performance fixes

---

## Step 2: Environment Variables Configuration

### Vercel Environment Variables

Navigate to: **Vercel Dashboard → Project → Settings → Environment Variables**

#### Required Client-Side Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://npcvbxrshuflujcnikon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=<your_site_key>
NODE_ENV=production
```

#### Required Server-Side Variables
```
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDFLARE_TURNSTILE_SECRET_KEY=<your_secret_key>
```

#### Recommended Variables
```
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Environment Variable Validation

The app will automatically validate environment variables on startup. Check Vercel logs if deployment fails.

---

## Step 3: Supabase Edge Functions Deployment

### Deploy All Edge Functions
```bash
# Deploy spot price updater (runs every 10 minutes)
supabase functions deploy update-spot-price

# Deploy ATH updater (runs daily at midnight UTC)
supabase functions deploy update-btc-ath

# Deploy Fear & Greed updater (runs daily at 1 AM UTC)
supabase functions deploy update-fear-greed
```

### Configure Edge Function Environment Variables

In **Supabase Dashboard → Edge Functions → Settings → Secrets**:

```
SUPABASE_URL=https://npcvbxrshuflujcnikon.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### Verify Function Status
```bash
# List deployed functions
supabase functions list

# Test a function manually
curl -X POST \
  'https://npcvbxrshuflujcnikon.supabase.co/functions/v1/update-spot-price' \
  -H 'Authorization: Bearer <your_anon_key>'
```

---

## Step 4: Vercel Deployment Configuration

### Deployment Settings

1. **Build Command**: `npm run build` (default)
2. **Output Directory**: `.next` (default)
3. **Install Command**: `npm install` (default)

### Domain Configuration

1. Add custom domain in Vercel Dashboard
2. Configure DNS records as instructed
3. Enable HTTPS (automatic with Vercel)

### Security Headers

Security headers are already configured in `next.config.js`:
- ✅ Content Security Policy (CSP)
- ✅ HSTS
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy

### Deployment Checklist
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Build passes without errors

---

## Step 5: Stripe Webhook Configuration

### Create Production Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL: `https://yourdomain.com/api/subscription/webhooks`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Configure Webhook Secret

1. Copy the **Signing secret** (starts with `whsec_`)
2. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### Test Webhook Locally (Optional)

```bash
# Use Stripe CLI to forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/subscription/webhooks
```

---

## Step 6: Post-Deployment Verification

### 1. Application Health Checks

#### Test Authentication Flow
```
✅ Visit: https://yourdomain.com/auth/sign-in
✅ Request magic link
✅ Verify email received
✅ Complete sign-in flow
✅ Verify redirect to dashboard
```

#### Test Dashboard
```
✅ Dashboard loads with KPIs
✅ Transaction history displays
✅ Portfolio charts render
✅ No console errors
```

### 2. Database Verification

```bash
# Connect to production database
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres.npcvbxrshuflujcnikon@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

# Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('transactions', 'customers', 'csv_uploads');

# Verify migration status
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 10;
```

### 3. Security Headers Verification

```bash
# Check security headers
curl -I https://yourdomain.com | grep -iE "(content-security-policy|x-frame-options|strict-transport-security)"

# Should see:
# content-security-policy: default-src 'self'; ...
# x-frame-options: DENY
# strict-transport-security: max-age=31536000; includeSubDomains
```

### 4. Edge Functions Verification

```bash
# Check if spot price is updating
# Should see recent entries in spot_price table
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres.npcvbxrshuflujcnikon@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -c "SELECT date, price_usd FROM spot_price ORDER BY date DESC LIMIT 5;"
```

### 5. Stripe Integration Test

```
✅ Visit: https://yourdomain.com/dashboard/subscription
✅ Initiate checkout flow (test mode first)
✅ Verify redirect to Stripe
✅ Complete test purchase
✅ Verify webhook received
✅ Check subscription status in dashboard
```

---

## Rollback Plan

### If Deployment Fails

1. **Database Rollback** (if needed):
   ```bash
   # List migration history
   supabase migration list --linked
   
   # Manual rollback (if necessary)
   # Review migration files and create reverse migration
   ```

2. **Vercel Rollback**:
   - Go to Vercel Dashboard → Deployments
   - Find previous successful deployment
   - Click "..." → "Promote to Production"

3. **Edge Functions Rollback**:
   ```bash
   # Redeploy previous version
   supabase functions deploy <function-name> --version <previous-version>
   ```

---

## Monitoring & Maintenance

### Regular Checks

- **Daily**: Monitor error logs in Vercel and Supabase
- **Weekly**: Review Edge Function execution logs
- **Monthly**: Audit security headers and RLS policies
- **Quarterly**: Review and update dependencies

### Key Metrics to Monitor

- Application uptime (Vercel Analytics)
- Database query performance (Supabase Dashboard)
- Edge Function execution success rate
- Error rates and types
- User authentication success rate

---

## Support Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/npcvbxrshuflujcnikon
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Security Assessment**: See `SECURITY-ASSESSMENT.md`

---

## Quick Reference Commands

```bash
# Link to production
supabase link --project-ref npcvbxrshuflujcnikon

# Push migrations
supabase db push

# Deploy edge functions
supabase functions deploy update-spot-price
supabase functions deploy update-btc-ath
supabase functions deploy update-fear-greed

# Check migration status
supabase migration list --linked

# Test database connection
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  "postgresql://postgres.npcvbxrshuflujcnikon@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -c "SELECT 1;"
```

---

## Next Steps After Deployment

1. ✅ Verify all checklist items completed
2. ✅ Monitor error logs for 24-48 hours
3. ✅ Test critical user flows
4. ✅ Set up alerts for critical errors
5. ✅ Document any production-specific configurations
6. ✅ Plan for scaling (if needed)

**Status**: Ready to proceed with Step 1 (Database Migrations)
