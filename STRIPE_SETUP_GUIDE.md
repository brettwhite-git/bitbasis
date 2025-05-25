# Stripe & Supabase Environment Setup Guide

## Quick Setup Summary

### 1. Local Supabase Keys (Already Available)
From `supabase status`, we have:
- **Local Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`
- **Local Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

### 2. Stripe Price IDs (Already Available)
From your Stripe dashboard:
- **Pro Monthly**: `price_1RS3KAPMa0k9vRKSpRxl72ju`
- **Lifetime**: `price_1RS3KBPMa0k9vRKSk7vG0GKO`

### 3. Missing Variables You Need to Get

#### Stripe API Keys
1. Go to [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

#### Stripe Webhook Secret (Option A - Recommended)
Run this command and keep it running during development:
```bash
stripe listen --forward-to localhost:3000/api/subscription/webhooks
```
This will output a webhook secret like: `whsec_1234...`

#### Remote Supabase Service Role Key
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select project: `npcvbxrshuflujcnikon`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (click reveal to see it)

## Create Your .env.local File

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Local Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_1RS3KAPMa0k9vRKSpRxl72ju
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID=price_1RS3KBPMa0k9vRKSk7vG0GKO

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
POSTGRES_PASSWORD=postgres
SUPABASE_DB_PASSWORD=postgres
SUPABASE_PROJECT_REF=npcvbxrshuflujcnikon
```

## Testing Webhooks

### Option A: Stripe CLI (Recommended)
1. Run: `stripe listen --forward-to localhost:3000/api/subscription/webhooks`
2. Copy the webhook secret from the output
3. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`
4. Keep this command running while testing

### Option B: Manual Webhook (Alternative)
1. Use ngrok: `ngrok http 3000`
2. Go to Stripe Dashboard → Webhooks
3. Add endpoint: `https://your-ngrok-url.ngrok.io/api/subscription/webhooks`
4. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

## Testing Commands

```bash
# Start your development server
npm run dev

# In another terminal, start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/subscription/webhooks

# Test the upgrade flow in your browser
http://localhost:3000
```

## Key Differences: Local vs Production

| Component | Local | Production |
|-----------|-------|------------|
| Supabase URL | `http://127.0.0.1:54321` | `https://npcvbxrshuflujcnikon.supabase.co` |
| Service Role Key | Local Docker key | Remote project key |
| Stripe Keys | Test mode (`pk_test_`, `sk_test_`) | Live mode (`pk_live_`, `sk_live_`) |
| Webhook Secret | CLI forwarding or ngrok | Actual webhook endpoint |

## Next Steps

1. ✅ Get your Stripe API keys from dashboard
2. ✅ Get your remote Supabase service role key
3. ✅ Create `.env.local` with all variables
4. ✅ Test webhook forwarding with Stripe CLI
5. ✅ Test the upgrade flow in your app 