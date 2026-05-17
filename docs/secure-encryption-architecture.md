# BitBasis — Secure Client/Server Encryption Architecture

Status: **Design proposal, not yet implemented.**
Branch: `claude/secure-encryption-architecture-T98U2`
Audience: BitBasis engineering + security review.

This document describes how to turn BitBasis from a "privacy-first by policy" product into a "privacy-first by cryptography" product, modeled on the okara.ai pattern: **the server holds opaque ciphertext, the client holds the key, and onchain lookups are proxied with signed responses**. No code change ships with this document; it is the contract that the implementation slices will be reviewed against.

---

## 1. Goals and non‑goals

### Goals

1. **Confidentiality from BitBasis itself.** A full Supabase database dump, a rogue operator, or a leaked service‑role key must not be sufficient to reveal a user's addresses, txids, address labels, comments, or — at the higher tier — amounts and cost basis.
2. **Search without disclosure.** Users can search/filter their own history on the server using blind indices; the server learns query *patterns* but not query *values*.
3. **Onchain data without correlation.** Address/txid lookups against third‑party providers (mempool.space, blockstream.info, Coinpaprika, etc.) must not expose either:
   - the end‑user's IP → address mapping (no direct client calls to providers), nor
   - an internal user‑id → address mapping the provider can subpoena.
4. **Integrity of onchain responses.** A future‑compromised proxy must not be able to inject fake balances, transactions, or prices without client‑side detection.
5. **No regression** of current functionality: magic‑link auth, FIFO/LIFO/HIFO cost basis, CSV import, portfolio metrics, Stripe billing.

### Non‑goals

- Hiding *metadata* such as "user X exists" or "user X performed N inserts in the last hour." This is access‑pattern leakage; closing it requires ORAM or PIR and is out of scope.
- Defending against a malicious *client device* (browser‑level keylogger, malicious extension with `cookies` permission on the BitBasis origin). The key lives in browser memory; a compromised browser process can read it. Mitigated, not eliminated, by CSP/SRI hardening (§7).
- Anonymising *exchange‑origin* data. The CSV itself was produced by an exchange that already knows the user; we cannot retroactively unlink that.

### Explicit threat model

| # | Adversary | Capability | Must defend? |
|---|---|---|---|
| T1 | Database dump / backup theft | Read all rows of all tables | **Yes** |
| T2 | Rogue Supabase / BitBasis operator | Read DB + read application server memory at rest | **Yes** for stored data |
| T3 | Compromised application server | Read live request bodies, mint API calls | Partial — limits new data leaked from that moment forward; cannot decrypt at‑rest data without the user's passphrase |
| T4 | Compromised onchain provider | See queries routed through the proxy | **Yes** — proxy must be the only IP visible; signing protects integrity |
| T5 | Passive network observer | TLS metadata | Already mitigated by HTTPS |
| T6 | Cross‑site script injection on bitbasis.io | Run JS in the browser origin | Mitigated by CSP + SRI; not eliminated |
| T7 | Lost passphrase / device | — | Recoverable only via the explicit recovery path the user opted into; otherwise data is unrecoverable by design |

---

## 2. Current architecture — facts as observed

References are file:line locations in the repo at the branch point.

- Browser uses `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_ANON_KEY` and talks to PostgREST directly: `lib/supabase/client.ts:1`, `lib/supabase/supabase.ts:92`.
- Authentication is passwordless magic‑link OTP with Cloudflare Turnstile: `providers/supabase-auth-provider.tsx:113`, `components/auth/sign-up-form.tsx:60`, `app/auth/callback/route.ts:41`.
- A small set of Next.js API routes wraps authenticated writes and adds Zod validation + rate limiting:
  - `app/api/transaction-history/route.ts:4` (list / bulk delete)
  - `app/api/transaction-history/add-unified/route.ts:28` (bulk insert)
  - `app/api/transaction-history/[id]/route.ts:30` (patch / delete one)
- Sensitive fields stored **plaintext** on the `transactions` table: `from_address`, `to_address`, `transaction_hash`, `from_address_name`, `to_address_name`, `comment`, `sent_amount`, `received_amount`, `sent_cost_basis`, `received_cost_basis`, `fee_*`, `realized_return`. Source of truth: `add-unified/route.ts:133`.
- Filtering/search is fully client‑side, after fetching every row: `components/transactions/table/transaction-filters.tsx:36`.
- The only third‑party data fetch today is a Coinpaprika spot price poll from a Supabase Edge Function with the service‑role key: `supabase/functions/update-spot-price/index.ts:1`. There is no onchain integration yet.
- README and landing copy currently advertise "encrypted storage" — this is **only** TLS in flight and Supabase's at‑rest disk encryption. The application has no key the operator does not also hold.

**Net assessment:** the security posture today is "good for a generic SaaS" — RLS, magic‑link, rate limits, CSP via Next defaults — but it is *not* the privacy posture the README promises. T1 and T2 are not currently defended.

---

## 3. Target architecture — overview

Three orthogonal layers. They compose; none of them needs the others to ship, but the full benefit is only realised once all three are in place.

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser                                                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Encryption worker (WebCrypto + Argon2id WASM)              │   │
│  │  - holds DEK in memory only (non-extractable CryptoKey)    │   │
│  │  - encrypts/decrypts sensitive fields                       │   │
│  │  - computes HMAC blind indices for search                   │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                │                              │
                │ ciphertext + blind indices    │ signed onchain queries
                ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ BitBasis server (Next.js on Vercel)                              │
│  - auth via Supabase magic-link (unchanged)                       │
│  - never sees plaintext of encrypted columns                      │
│  - serves blind-index lookups against PostgREST                   │
│  - /api/onchain/* signs responses with ed25519                    │
└──────────────────────────────────────────────────────────────────┘
                │                              │
                ▼                              ▼
        Supabase Postgres              Third-party providers
        (ciphertext + indices)         (mempool, blockstream, …)
```

### Layer A — Client‑side encryption with user‑held key

- Per‑user **Data Encryption Key (DEK)**: 256‑bit, generated by WebCrypto on first setup, used for AES‑256‑GCM on individual fields.
- **Key Encryption Key (KEK)**: derived from a user passphrase via **Argon2id** (decision: §4) with per‑user salt and tunable cost params.
- **Wrapped DEK**: `wrapped_dek = AES-KW(KEK, DEK)` stored server‑side in a new `user_keys` row. The server holds the wrapped key and the KDF parameters but never the KEK or DEK.

### Layer B — Searchable encryption via deterministic blind indices

- Per‑field index key `idx_key_<field> = HKDF(DEK, info="blind-index:<field>")`.
- For each row, the client stores `field_idx = HMAC-SHA256(idx_key_<field>, normalize(value))` next to the ciphertext.
- Equality search: client HMACs the search term with the same key, the server returns matching rows. The server learns the *index value* (which is opaque) and the access pattern.

### Layer C — Signed onchain proxy

- Single server route `app/api/onchain/[provider]/[op]/route.ts`.
- Server holds API keys, performs upstream calls, **signs responses with an ed25519 key** the client pins.
- Aggressive cache by `H(query)`. Optional response re‑encryption back to the user.

The remainder of this document specifies each layer in enough detail to implement, plus the migration plan.

---

## 4. Key management — decisions and rationale

### 4.1 Why a user passphrase + Argon2id

Decision chosen during planning: **user‑held passphrase + Argon2id KDF**, no server‑side key escrow.

Rationale:

- T2 (rogue operator) is the single most important threat for a self‑custody‑adjacent product. If the operator could ever derive the KEK, the whole architecture is theatre. Passphrase‑derived KEKs eliminate this class of compromise.
- Argon2id is currently the only widely‑accepted memory‑hard, side‑channel‑resistant KDF (preferred by OWASP and the PHC competition). Memory‑hardness raises GPU/ASIC cracking cost; the `id` variant blends data‑independent and data‑dependent rounds to defend against side channels.
- We accept the UX cost: users will be prompted for a passphrase on every fresh session. Recovery is handled explicitly (see §4.5), not via server escrow.

### 4.2 Parameters

| Parameter | Value | Notes |
|---|---|---|
| Argon2 variant | `id` | OWASP recommended |
| Memory cost (`m`) | 64 MiB | Browser tab can afford it; revisit yearly |
| Time cost (`t`) | 3 iterations | ~0.5–1.5s on typical laptop in WASM |
| Parallelism (`p`) | 1 | Browsers don't expose threads we can rely on |
| Salt | 16 bytes random per user | Stored alongside `wrapped_dek` |
| KEK length | 256 bits | |
| DEK length | 256 bits | |
| Field cipher | AES‑256‑GCM | 96‑bit random IV per encryption; 128‑bit tag |
| AAD | `"<table>:<column>:<row_id>"` | Binds ciphertext to its location to defeat cut‑and‑paste attacks |
| Wrap algorithm | AES‑KW (RFC 3394) | Deterministic, authenticated key wrap |
| Blind index | HMAC‑SHA256 | Per‑field key from HKDF(DEK) |

### 4.3 The DEK lifecycle in the browser

1. **Setup**: WebCrypto `crypto.subtle.generateKey({name: "AES-GCM", length: 256}, true, ["encrypt","decrypt"])`. The DEK is *temporarily* extractable so we can wrap it; immediately after wrapping, we re‑import it as **non‑extractable** for runtime use, and forget the raw bytes.
2. **Storage in browser**: held as a non‑extractable `CryptoKey` in a module‑scoped variable inside a dedicated Web Worker. **Not** in `localStorage`, **not** in `sessionStorage`, **not** in IndexedDB. A page reload requires the passphrase again; this is intentional.
3. **Unwrap on sign‑in**: after Supabase magic‑link completes and `wrapped_dek` is fetched, prompt for passphrase → Argon2id in a worker → `crypto.subtle.unwrapKey(...)` → resulting `CryptoKey` is non‑extractable.
4. **Cross‑tab**: encryption worker is in a SharedWorker so multiple tabs in the same origin share the unwrapped DEK without prompting again. SharedWorker access is origin‑scoped; not cross‑site.
5. **Sign‑out**: terminate the SharedWorker and call `supabase.auth.signOut()`. The non‑extractable CryptoKey is garbage‑collected with the worker context.

### 4.4 Server‑side key handling

- `user_keys` is a new table:
  ```
  user_keys
  ─────────
  user_id          uuid PK, references auth.users(id) on delete cascade
  wrapped_dek      bytea
  kdf_salt         bytea
  kdf_algorithm    text     -- 'argon2id' (forward-compat)
  kdf_memory_kib   integer
  kdf_iterations   integer
  kdf_parallelism  integer
  dek_version      integer  -- bump on rotation
  created_at       timestamptz
  rotated_at       timestamptz
  ```
- RLS policy: `user_id = auth.uid()` for select/update; insert allowed once per user.
- **The server never sees the unwrapped DEK and the column types are bytea / integer / text — no plaintext keys ever transit the wire.** The wrapped DEK is opaque to the server.

### 4.5 Passphrase loss — recovery

Default recovery: a one‑time **BIP39‑style 12‑word recovery phrase** generated at setup and shown once. It wraps the same DEK independently via a second `wrapped_dek_recovery` column (also AES‑KW, KEK derived from the mnemonic via PBKDF2‑SHA512 to match BIP39 conventions, or a second Argon2id with the mnemonic concatenated as input). Users who lose their passphrase enter the recovery phrase to re‑wrap the DEK with a new passphrase.

Users who lose *both* the passphrase and the recovery phrase lose access to the encrypted data — this is the cost of T2 protection. The product surfaces a "downgrade to non‑encrypted mode" path: the user re‑imports their CSVs from scratch under a new DEK. This must be communicated prominently in the setup screen.

### 4.6 Key rotation

- Bump `dek_version`, generate new DEK on the client, re‑encrypt sensitive columns and re‑compute blind indices client‑side, write back in a transaction. This is a paginated, resumable migration the client drives.
- The wrapped key can be rotated independently (e.g. when a user changes their passphrase) by simply re‑wrapping the same DEK under the new KEK; no row rewrite needed.

---

## 5. Schema changes

### 5.1 New tables

```sql
create table user_keys (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  wrapped_dek      bytea not null,
  wrapped_dek_recovery bytea,
  kdf_salt         bytea not null,
  kdf_algorithm    text  not null default 'argon2id',
  kdf_memory_kib   integer not null,
  kdf_iterations   integer not null,
  kdf_parallelism  integer not null,
  dek_version      integer not null default 1,
  created_at       timestamptz not null default now(),
  rotated_at       timestamptz
);

alter table user_keys enable row level security;

create policy user_keys_self_read on user_keys
  for select using (auth.uid() = user_id);
create policy user_keys_self_insert on user_keys
  for insert with check (auth.uid() = user_id);
create policy user_keys_self_update on user_keys
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 5.2 Modified `transactions` table — phased

We add ciphertext columns next to the existing plaintext columns. During migration both exist; after cutover the plaintext columns drop. This keeps each migration backwards‑compatible with running app instances.

Phase 1 — additive:

```sql
alter table transactions
  add column from_address_ct          bytea,
  add column from_address_iv          bytea,
  add column from_address_idx         bytea,   -- HMAC blind index
  add column to_address_ct            bytea,
  add column to_address_iv            bytea,
  add column to_address_idx           bytea,
  add column transaction_hash_ct      bytea,
  add column transaction_hash_iv      bytea,
  add column transaction_hash_idx     bytea,
  add column from_address_name_ct    bytea,
  add column from_address_name_iv    bytea,
  add column to_address_name_ct      bytea,
  add column to_address_name_iv      bytea,
  add column comment_ct              bytea,
  add column comment_iv              bytea,
  add column dek_version             integer not null default 1;

create index on transactions (user_id, from_address_idx);
create index on transactions (user_id, to_address_idx);
create index on transactions (user_id, transaction_hash_idx);
```

Phase 2 — backfill (client‑driven; see §8).

Phase 3 — cutover: API route handlers stop writing the plaintext columns and start enforcing ciphertext+iv presence.

Phase 4 — drop:

```sql
alter table transactions
  drop column from_address,
  drop column to_address,
  drop column transaction_hash,
  drop column from_address_name,
  drop column to_address_name,
  drop column comment;
```

### 5.3 What we do **not** encrypt in v1

- `date` (only the day‑bucket is queryable; raw timestamp is needed for FIFO ordering and would need order‑preserving encryption — out of scope).
- `type` (low cardinality — 5 enum values; encrypting offers near‑zero entropy hiding and breaks server‑side aggregates).
- `asset` (only `BTC` today).
- `user_id`, `csv_upload_id`, foreign keys.

### 5.4 Amounts — deferred

`sent_amount`, `received_amount`, `*_cost_basis`, `realized_return` remain plaintext in v1. They are the most sensitive fields, but also the only ones server‑side aggregates need today (`spot_price` joins, subscription limit checks). Encrypting them requires:

- Moving the limit check off the row count to a client‑attested counter, or accepting a sentinel "count only" view.
- Moving any future server‑side analytics to client‑driven aggregation.

This is a separate, larger workstream. We document the deferral so it is intentional, not forgotten.

---

## 6. Search via blind indices

### 6.1 Construction

```
master_dek    : 256-bit symmetric, in browser only
idx_key_addr  = HKDF-SHA256(master_dek, salt="", info="blind-index:address")
idx_key_hash  = HKDF-SHA256(master_dek, salt="", info="blind-index:txhash")
…
field_idx     = HMAC-SHA256(idx_key_<field>, normalize(value))
```

`normalize()` is field‑specific and applied identically on insert and on query:

- Addresses: lowercase, strip whitespace, strip `bitcoin:` URI prefix, validate base58/bech32 — reject otherwise.
- Transaction hashes: lowercase hex, strip `0x` if present, must be 64 hex chars.
- Address names / comments: NFKC unicode normalize, casefold, collapse whitespace. (Note: blind indices on free‑text fields are mostly useful for exact‑match labels like "Coinbase" or "cold storage"; substring search is not supported in v1.)

### 6.2 Query path

```ts
// client
const idx = await hmac(idxKeyAddr, normalizeAddress(input));

// request
GET /api/transaction-history/search?from_address_idx=<hex>
```

Server‑side handler:
- Authenticate user.
- Reject any plaintext search field (`from_address`, etc.) at the API boundary.
- `select * from transactions where user_id = $1 and from_address_idx = $2`.
- Return ciphertext rows.

Client decrypts row by row, throws away non‑matches if `normalize()` was lossy.

### 6.3 What the server learns

- Which blind index value is hot.
- How many rows match it (cardinality).
- When the user is searching (timing).

It does **not** learn the plaintext input, the underlying address, or what other addresses the user has. Cross‑user correlation is also blocked because each user has a different `idx_key_<field>` derived from their unique DEK.

### 6.4 What we explicitly give up

- Server‑side substring/regex search.
- Sortable encrypted indices (would require OPE/ORE, which leak ordering by construction — not worth it for transactions).
- Range queries on encrypted fields. Date range queries continue to work because `date` itself is not encrypted.

---

## 7. Sign‑up and onboarding flow

### 7.1 Before this change (today)

1. User visits `/auth/sign-up`, enters email + Turnstile.
2. Supabase OTP email sent.
3. User clicks magic link → `/auth/callback?code=…`.
4. `app/auth/callback/route.ts:41` exchanges code for session, writes `terms_acceptance`.
5. Redirect to `/dashboard`.

### 7.2 After

1. Steps 1–4 unchanged.
2. **New: `/auth/callback` checks for `user_keys` row.**
   - Missing → redirect to `/auth/setup-encryption`.
   - Present → redirect to `/dashboard`. Dashboard then triggers an unlock prompt if DEK is not already in the SharedWorker.
3. `/auth/setup-encryption` (new client page):
   - Explains the model in one paragraph: "Your data is encrypted in the browser with a key only you control. We can't recover it for you. Save your recovery phrase."
   - User chooses passphrase (zxcvbn strength meter; minimum score 3).
   - Client generates: salt (16 bytes), DEK (256 bits), recovery phrase (BIP39 12 words).
   - Argon2id runs in a Web Worker; UI shows progress.
   - DEK wrapped twice: under KEK from passphrase, and under KEK from recovery phrase.
   - POST to `POST /api/keys/setup` with body:
     ```json
     {
       "wrapped_dek": "<base64>",
       "wrapped_dek_recovery": "<base64>",
       "kdf_salt": "<base64>",
       "kdf_algorithm": "argon2id",
       "kdf_memory_kib": 65536,
       "kdf_iterations": 3,
       "kdf_parallelism": 1
     }
     ```
   - Server inserts (rejects if a row already exists for this user).
   - Recovery phrase shown; user must type any 3 random words back to confirm they wrote it down.
   - Redirect to `/dashboard`.
4. `/auth/unlock` (new): shown when a session exists but the SharedWorker has no DEK (fresh tab, after reload, after browser restart). Passphrase input, runs Argon2id, calls `unwrapKey`, stores non‑extractable key in worker.

### 7.3 Subsequent sign‑in

1. Magic‑link auth (unchanged).
2. `app/auth/callback` redirects to `/dashboard` (if `user_keys` exists).
3. Dashboard mount checks the SharedWorker → no DEK → render unlock modal.
4. User enters passphrase → Argon2id → unwrap → DEK in memory → modal closes.

### 7.4 CSP and frame hardening

Encryption only matters if the page that holds the key is itself uncompromised. Required `next.config.js` headers:

- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'sha256-…' https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self';`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: same-origin`
- `Permissions-Policy: clipboard-read=(), clipboard-write=(self), interest-cohort=()`
- Subresource Integrity on any third‑party script (Turnstile already self‑contained).

---

## 8. Migration plan for existing data

Each step is independently reversible until the final drop.

1. **Ship `user_keys` and the setup screen.** Existing users with no key see a one‑time "Set up encryption" CTA on the dashboard. Until they complete it, the app works as today. No schema change to `transactions` yet.
2. **Ship ciphertext + blind‑index columns** as nullable additions. App ignores them. No behaviour change.
3. **Ship the client‑side encryption worker** behind a per‑user feature flag (column on `user_keys`, default off after setup). New transactions go through the worker and are written with both plaintext and ciphertext columns populated for a transition window.
4. **Backfill.** A dashboard‑hosted, client‑driven backfill job: paginate through the user's transactions, encrypt each row, compute blind indices, `update` in batches. Resumable via a `last_migrated_at` watermark on `user_keys`. The server cannot do this step because it does not have the DEK.
5. **Flip read path** to prefer ciphertext when present. Continue accepting plaintext for users mid‑migration.
6. **Cutover.** When `last_migrated_at` covers all rows, the worker writes only ciphertext; the API routes refuse plaintext for that user.
7. **Drop plaintext columns.** Single migration once all active users are cut over. Soft‑deleted accounts whose plaintext we cannot migrate are scrubbed: plaintext nulled, audit row written.

We will rate‑limit the backfill on the client (e.g. 200 rows per second) to avoid Supabase write spikes, and surface progress in the settings UI.

---

## 9. Server API changes

### 9.1 Routes added

| Route | Method | Purpose |
|---|---|---|
| `/api/keys/setup` | POST | First‑time `wrapped_dek` insert. Idempotent‑by‑rejection: 409 if row exists. |
| `/api/keys/rotate-passphrase` | POST | Replace `wrapped_dek` with a new wrap; same DEK. |
| `/api/keys/rotate-dek` | POST | Bump `dek_version` after a client‑side full rewrite. |
| `/api/transaction-history/search` | GET | Accepts `*_idx` blind index params, never plaintext. |
| `/api/onchain/<provider>/<op>` | GET / POST | Signed proxy (see §10). |

### 9.2 Routes modified

- `app/api/transaction-history/add-unified/route.ts`: schema accepts `*_ct`, `*_iv`, `*_idx` triplets instead of plaintext for the encrypted fields. Backwards compat for the transition window.
- `app/api/transaction-history/[id]/route.ts`: same.
- `app/api/transaction-history/route.ts` (DELETE): unchanged — works on numeric IDs.

### 9.3 Validation tightening

- Zod schemas at the boundary enforce: ciphertext < 4 KiB, IV is exactly 12 bytes, blind index is exactly 32 bytes. Anything else is a 400 — defends against the server accidentally accepting a plaintext from a stale client.
- API routes that previously wrote plaintext (`from_address`, `to_address`, etc.) **explicitly reject** those fields once a user has `user_keys` with `dek_version >= 1` and migration is complete.

---

## 10. Onchain proxy

Decision chosen during planning: **third‑party APIs via signed proxy**, with the option to swap individual providers for a self‑hosted node later without touching the client contract.

### 10.1 Goals (restated)

- Client never directly contacts mempool.space / blockstream.info / Coinpaprika / any other onchain or price API.
- Server never persists a `user_id → bitcoin_address` link.
- Responses are tamper‑evident even if the proxy is later compromised.

### 10.2 Surface

`app/api/onchain/[provider]/[op]/route.ts` — a single dynamic route. Allowed combinations are a static allow‑list in code:

| Provider | Op | Upstream |
|---|---|---|
| `mempool` | `address` | `https://mempool.space/api/address/{addr}` |
| `mempool` | `tx` | `https://mempool.space/api/tx/{txid}` |
| `blockstream` | `address` | `https://blockstream.info/api/address/{addr}` |
| `blockstream` | `tx` | `https://blockstream.info/api/tx/{txid}` |
| `coinpaprika` | `tickers` | `https://api.coinpaprika.com/v1/tickers/btc-bitcoin` |

Anything off the allow‑list is a 404 — defends against SSRF.

### 10.3 Request and response shape

Request (POST):

```json
{
  "queries": [
    { "kind": "address", "value": "bc1q…" },
    { "kind": "address", "value": "bc1q…decoy…" }
  ],
  "client_nonce": "<base64 16 bytes>"
}
```

`queries` can hold multiple entries; the client always sends 1 + k decoy entries (k‑anonymity light, distinct from the heavier batching option deferred to v2). The server has no idea which is real. Decoys are valid mainnet addresses drawn from a public corpus of high‑activity addresses to make the batch indistinguishable from a real one.

Response:

```json
{
  "results": [
    { "kind": "address", "value": "bc1q…",       "data": { … } },
    { "kind": "address", "value": "bc1q…decoy…", "data": { … } }
  ],
  "fetched_at": "2026-05-17T10:00:00Z",
  "client_nonce": "<echo of request>",
  "signature": "<ed25519 over (canonical_json(results) || fetched_at || client_nonce)>"
}
```

### 10.4 Signing

- Server holds an ed25519 signing key in a Vercel environment variable (`ONCHAIN_PROXY_SIGNING_KEY`, base64 32‑byte private key) — distinct from the Supabase service role.
- Public key is bundled in the client at build time (`ONCHAIN_PROXY_PUBLIC_KEY`). Browser verifies every response using WebCrypto `Ed25519` or a fallback like `@noble/curves`.
- A failed signature check is a hard error in the UI: "Onchain response could not be verified — refusing to display."

Key rotation: introduce a `kid` field in the response; ship the new public key in the client weeks before swapping the server key; verifier accepts both during the overlap.

### 10.5 Caching

- Cache key: `H("<provider>:<op>:<canonical_value>")` (SHA‑256 hex).
- Cache layer: Upstash Redis or Vercel KV (decision deferred; documented here so it isn't surprise scope later).
- TTL by op:
  - Address balances/utxos: 30s (mempool changes fast).
  - Tx by id: 24h (immutable once mined; we still re‑check unconfirmed txs).
  - Spot price: 30s, already polled by the Edge Function.
- Cached responses are re‑signed at serve time with a fresh `fetched_at` and the client's `client_nonce`. We do **not** serve a cached signature — only cached upstream payloads.

### 10.6 Egress isolation (optional v1.1)

To prevent the upstream provider from correlating a request to a specific BitBasis user via the proxy's IP (less of an issue, but mentioned in the threat model), route upstream traffic through an outbound proxy or a TOR SOCKS5 endpoint. Vercel Functions can be configured to egress via a static IP — sufficient when combined with shared caching, since per‑user attribution is impossible from a shared egress IP.

### 10.7 Rate limits

- 60 requests/min/user on `/api/onchain/*` (matches the spirit of existing `lib/rate-limiting.ts`).
- Per‑provider circuit breaker: if a provider 5xx's > 10% of requests in a 1‑min window, fail over to the next provider in the list. The client doesn't care which provider answered, only that the signature is valid.

---

## 11. Operational concerns

### 11.1 Backups

- Once data is ciphertext, **logical backups of the database no longer contain user data** in any usable form — a meaningful security gain.
- We must ensure `user_keys` backups are treated with the same care as the wrapped keys aren't useful without the user's passphrase, but losing `user_keys` is total data loss for that user. The wrapped DEKs should be backed up to a separate region.

### 11.2 Support

- Customer support cannot help recover a lost passphrase. This is the cost we accept. UI must be explicit at setup.
- Support can still help with: billing, account deletion, magic‑link resends. They cannot help with: "I forgot my passphrase, please decrypt my history."

### 11.3 GDPR / right to be forgotten

- Account deletion deletes `user_keys` and the row data. With the wrapped DEK gone, the ciphertext is cryptographically unrecoverable — a stronger guarantee than today's `DELETE` against an at‑rest‑encrypted disk.

### 11.4 Marketing copy

The README and landing claims will be honest **only after Layer A ships in production for all users**. Until then:

- Remove the "encrypted in our secure database using Supabase" line in `components/landing/sections/faq.tsx:20` or qualify it as at‑rest only.
- Re‑introduce stronger language ("end‑to‑end encrypted with a key only you hold") once the migration is complete and the cutover is enforced.

### 11.5 Performance budget

- Argon2id at the chosen params: 0.5–1.5s one‑time on unlock. Acceptable.
- AES‑GCM per field: microseconds; not a bottleneck.
- Blind index HMAC: microseconds.
- Backfill of 10 000 rows at 200/s: 50 seconds, visible progress bar.
- Onchain proxy: signature verify is ~1ms in noble; negligible.

---

## 12. Risks and open questions

| # | Risk | Mitigation / open question |
|---|---|---|
| R1 | Browser memory disclosure (Spectre‑class) extracts the DEK. | COOP/COEP isolation. Cannot fully eliminate. |
| R2 | Argon2 WASM bundle is large (~100 KB). | Code‑split; load only on `/auth/setup-encryption` and `/auth/unlock`. |
| R3 | Users will forget passphrases at non‑trivial rates and blame us. | Mandatory recovery phrase confirmation at setup; clear copy; option to opt out into "server‑held key" mode in v1.1 if user pain warrants it. **Open question.** |
| R4 | Blind index reveals duplicate values across a single user's rows (e.g. "received from same address twice"). | This is by design — that's what makes search work. Cross‑user correlation is blocked because each user has a different key. Acceptable. |
| R5 | Decoy addresses in the onchain proxy still cost upstream calls — third‑party rate limits / billing. | Decoy pool is cached aggressively; we pay it once per address per TTL globally, not per user. |
| R6 | If we encrypt amounts in v2, FIFO/HIFO/LIFO computation must move 100% to the client; older devices may struggle on 50k‑row accounts. | Out of scope for v1. Benchmark before committing. |
| R7 | Signed responses don't help if a malicious proxy returns a *cached* old response with a valid signature. | The `fetched_at` and `client_nonce` are part of the signature; client rejects responses older than the op's max staleness. |
| R8 | Supabase auth.users itself stores the email. If we ever want to hide email‑level metadata, this design doesn't address it. | Out of scope. Mentioned for completeness. |

---

## 13. Implementation roadmap

| Slice | Description | Depends on | Effort |
|---|---|---|---|
| 0 | This doc, reviewed and merged. | — | shipped |
| 1 | `user_keys` schema + RLS migration. | 0 | S |
| 2 | Argon2 worker + setup screen + `/api/keys/setup`. | 1 | M |
| 3 | Unlock modal + SharedWorker for DEK runtime. | 2 | S |
| 4 | Ciphertext columns + per‑field encryption helpers. | 1 | M |
| 5 | Blind index helpers + search route + UI wire‑up. | 4 | M |
| 6 | Backfill UI + watermark. | 4, 5 | M |
| 7 | Cutover: API routes reject plaintext for migrated users. | 6 | S |
| 8 | Drop plaintext columns. | 7 | S |
| 9 | Recovery phrase generation + `wrapped_dek_recovery`. | 2 | S |
| 10 | Passphrase / DEK rotation routes. | 2, 4 | S |
| 11 | `/api/onchain/*` proxy with ed25519 signing + caching. | 0 | M |
| 12 | k‑decoy padding on onchain queries from client. | 11 | S |
| 13 | CSP/COOP/COEP hardening. | 0 | S |
| 14 | Honest README / landing copy update. | 7 | S |

S = ≤ 1 day, M = 2–5 days. None of these are individually huge; the discipline is in shipping them in order and not skipping the backfill rigour in slices 6–7.

---

## 14. What this is *not*

To set expectations:

- **Not** zero‑knowledge proofs. We do not prove computations over encrypted data; we only encrypt fields and compute over their plaintext on the client.
- **Not** ORAM. Access patterns are visible to the server.
- **Not** post‑quantum. AES‑256 and SHA‑256 remain comfortably secure against currently understood quantum attacks; the wrapping primitive (AES‑KW) does too. Ed25519 signatures will need migration to a PQ scheme on a 5–10 year horizon, tracked separately.
- **Not** a defence against a Bitcoin‑level adversary that already has the user's xpub or address list out‑of‑band. That's a key‑management problem at the wallet, not at BitBasis.

---

## 15. Decision log

- **2026‑05‑17** — Initial design.
- **2026‑05‑17** — Decided on **user‑held passphrase + Argon2id** (rejected: magic‑link‑only server‑wrapped key — fails T2).
- **2026‑05‑17** — Decided on **third‑party APIs via signed proxy** for onchain (deferred: self‑hosted Bitcoin Core node, k‑anonymous batching beyond simple decoy padding).
- **2026‑05‑17** — Deferred **amount encryption** to a v2 workstream.
