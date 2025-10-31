# Stripe Local Development Setup

## ⚠️ CRITICAL: Why Subscriptions Don't Appear in Local Dev

**If subscriptions aren't showing up in your database after checkout, this is almost always because:**

1. **Stripe CLI is not running** - Without it, webhooks never reach your local server
2. **Webhook secret mismatch** - Your `.env.local` must use the secret from `stripe listen`
3. **Dev server not restarted** - Environment variables only load on startup

**Quick Diagnosis:**
```bash
./scripts/check-subscription-status.sh
```

This script will tell you exactly what's wrong.

---

## Prerequisites

1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login to Stripe CLI**: `stripe login`

## Setup Webhooks for Local Development

**⚠️ REQUIRED for subscriptions to work in local dev!**

### Step 1: Start Stripe CLI Webhook Forwarding

In a **separate terminal**, run:

```bash
stripe listen --forward-to localhost:3000/api/subscription/webhooks
```

This will:
- Forward Stripe webhook events to your local development server
- Generate a **webhook signing secret** that you'll need to update

### Step 2: Update Your Webhook Secret

After starting `stripe listen`, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Copy this secret** and update your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Use the secret from Stripe CLI
```

**Important**: This webhook secret is **different** from your production webhook secret. Make sure you're using the CLI-generated one for local development.

### Step 3: Restart Your Dev Server

After updating `.env.local`, restart your Next.js dev server:

```bash
npm run dev
```

### Step 4: Test the Webhook Endpoint

You can test if webhooks are working:

```bash
# In another terminal, trigger a test event
stripe trigger checkout.session.completed

# Or trigger a subscription event
stripe trigger customer.subscription.created
```

Check your dev server console for webhook logs (you should see `🔔 WEBHOOK RECEIVED - START`).

## Common Issues

### Issue: "Missing Stripe signature or webhook secret"

**Solution**: Make sure:
1. Stripe CLI is running (`stripe listen`)
2. `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from `stripe listen`
3. You've restarted the dev server after updating `.env.local`

### Issue: "Invalid signature"

**Solution**: The webhook secret doesn't match. Get the latest secret from your `stripe listen` terminal and update `.env.local`.

### Issue: Webhooks not being received

**Checklist**:
- ✅ Stripe CLI is running (`stripe listen`)
- ✅ Dev server is running on `localhost:3000`
- ✅ Forward URL is correct: `localhost:3000/api/subscription/webhooks`
- ✅ `STRIPE_WEBHOOK_SECRET` is set in `.env.local`
- ✅ Dev server was restarted after updating `.env.local`

### Issue: Subscriptions Not Appearing After Checkout

**Symptoms**: You complete checkout successfully, but no subscription appears in your database.

**Diagnosis Steps**:
1. Run the diagnostic script:
   ```bash
   ./scripts/check-subscription-status.sh
   ```

2. Check your dev server logs for webhook messages:
   - Look for `🔔 WEBHOOK RECEIVED - START`
   - Look for `✅ Webhook signature verified successfully`
   - Look for `🎯 Processing relevant event: checkout.session.completed`

3. Check Stripe CLI terminal:
   - Should show events being forwarded
   - Should show success/error responses

**Common Causes**:
- ❌ Stripe CLI not running (most common)
- ❌ Wrong webhook secret in `.env.local`
- ❌ Dev server not restarted after updating `.env.local`
- ❌ Webhook endpoint returning 400/500 (check server logs)

**Solution**:
1. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscription/webhooks`
2. Copy the webhook secret from CLI output
3. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`
4. Restart dev server
5. Complete checkout again
6. Watch both terminals for webhook logs

**Test Webhook Manually**:
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed

# Check your dev server console - you should see:
# 🔔 WEBHOOK RECEIVED - START
# ✅ Webhook signature verified successfully
# 🎯 Processing relevant event: checkout.session.completed
```

### Issue: Checkout Session Creation Failing (500 Error)

This is separate from webhooks. Check:

1. **Environment Variables**:
   ```bash
   # Required for checkout creation
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_...
   ```

2. **Price IDs Valid**: Verify your price IDs exist in Stripe Dashboard → Products → Prices

3. **Check Server Logs**: Look for detailed error messages in your dev server console. The checkout endpoint has extensive logging.

## Testing Checkout Flow Locally

### Test Card Numbers (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

### Testing Steps

1. Start Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscription/webhooks`
2. Update `STRIPE_WEBHOOK_SECRET` in `.env.local` with CLI secret
3. Restart dev server: `npm run dev`
4. Navigate to subscription page and click "Upgrade"
5. Complete checkout with test card
6. Verify webhook logs appear in both terminals (Stripe CLI and dev server)

## Production vs Development

| Environment | Webhook Secret Source | Webhook Endpoint |
|------------|----------------------|------------------|
| **Local Dev** | Stripe CLI (`stripe listen`) | `localhost:3000/api/subscription/webhooks` |
| **Production** | Stripe Dashboard → Webhooks → Signing Secret | `https://yourdomain.com/api/subscription/webhooks` |

**Important**: Never use production webhook secrets in local development or vice versa.

## Debugging

### Check Webhook Endpoint Status

Visit: `http://localhost:3000/api/test-webhook`

This will verify your endpoint is accessible.

### View Stripe CLI Logs

The `stripe listen` terminal shows:
- All webhook events being forwarded
- Any forwarding errors
- The webhook signing secret

### View Server Logs

Your Next.js dev server console will show:
- `🔔 WEBHOOK RECEIVED - START` when webhooks are received
- Detailed event processing logs
- Any errors during webhook handling

## Quick Reference

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/subscription/webhooks

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated

# View recent events
stripe events list

# View specific event
stripe events retrieve evt_xxxxx
```

