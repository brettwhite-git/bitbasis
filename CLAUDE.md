# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BitBasis is a privacy-first Bitcoin portfolio tracker and cost basis calculator. Built with Next.js 16 (App Router), React 19, Supabase (PostgreSQL + SSR auth), and Stripe for subscriptions. Deployed on Vercel.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (includes TypeScript check)
npm run lint         # ESLint (eslint .)
npm start            # Start production server
```

No test framework is configured. Use `npm run build` as the primary verification step.

**Local Supabase**: `supabase start` then populate market data with `supabase db execute --file scripts/populate_local_data.sql`

**Stripe webhooks locally**: `stripe listen --forward-to localhost:3000/api/subscription/webhooks` (copy `whsec_*` to `.env.local`)

## Architecture

### Auth (Supabase SSR)
- `lib/supabase/server.ts` — server client via `createServerClient` with cookies from `next/headers`
- `lib/supabase/client.ts` — browser client via `createBrowserClient`
- `lib/supabase/middleware.ts` — auto-refreshes session on each request
- `lib/auth/server-auth.ts` — `requireAuth()`, `requireUser()`, `getServerSession()`
- `providers/supabase-auth-provider.tsx` — client-side auth context (magic link, no passwords)
- Row Level Security (RLS) enforces data isolation at the database level

### Database
- `types/supabase.ts` — auto-generated types (`supabase gen types typescript --project-id npcvbxrshuflujcnikon`)
- Core tables: `transactions`, `subscriptions`, `customers`, `btc_monthly_close`, `ath`, `fear_greed_index`
- Migrations in `supabase/migrations/`

### API Routes (`app/api/`)
- `transaction-history/` — CRUD for transactions, `add-unified/` for bulk insert
- `subscription/` — Stripe checkout, portal, cancel, webhooks
- `account/` — delete, summary
- Security: error sanitization (SEC-010), URL validation (SEC-009), rate limiting, Turnstile CAPTCHA

### Core Business Logic (`lib/core/portfolio/`)
- `cost-basis.ts` — FIFO, LIFO, HIFO cost basis calculations
- `metrics.ts` — portfolio metrics (unrealized gains, holdings breakdown)
- `performance.ts` — time-weighted returns
- `tax.ts` — short-term (<1yr, 37%) / long-term (>1yr, 20%) classification

### Hooks (`lib/hooks/`)
Custom hooks for data fetching with Supabase: `use-transactions`, `use-portfolio-metrics`, `use-cost-basis-calculation`, `use-bitcoin-price`, `use-subscription`, etc.

## Code Conventions

- **Components**: feature-based grouping in `components/` (not type-based). Target <300 lines, max 500.
- **Barrel exports**: `index.ts` files for clean imports (`import { X } from '@/components/transactions'`)
- **Path alias**: `@/*` maps to project root
- **Styling**: Tailwind CSS 3 + Radix UI primitives in `components/ui/`. Dark mode via class. Bitcoin orange (`#F7931A`) as accent.
- **Validation**: Zod schemas for runtime validation (`types/add-transaction.ts`)
- **Forms**: React Hook Form + Zod resolvers. Use `useWatch` (not `watch()`) for React 19 compatibility.
- **Charts**: Three chart libraries coexist — Chart.js, ApexCharts, Recharts. Chart.js tooltip callbacks use `parsed.y: number | null`.

## Environment Variables

**Client**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`

**Server**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLOUDFLARE_TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`

Validation in `lib/env-validation.ts`.

## Gotchas

- `.npmrc` has `legacy-peer-deps=true` — needed for React 19 compatibility with some packages
- `next lint` was removed in Next.js 16 — lint script uses `eslint .` directly
- ESLint config uses native flat config (not FlatCompat) to avoid circular reference errors
- Supabase types are auto-generated — don't edit `types/supabase.ts` manually
- `supabase/functions/` and `scripts/` are excluded from ESLint (Deno runtime / utility scripts)
- Cursor PRD docs in `.cursor/rules/prd-consolidated/` — comprehensive feature specs and architecture docs
