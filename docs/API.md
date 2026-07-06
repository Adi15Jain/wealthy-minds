# WealthyMinds API Reference

Two API surfaces exist:

1. **Next.js BFF** (`/api/*`) — authenticated, user-scoped endpoints backed by
   PostgreSQL/Prisma, plus proxies to Gemini and the analytics service.
2. **Analytics microservice** (`http://localhost:8000/api/v1/*`) — a stateless
   FastAPI service for quantitative computation. It is not exposed publicly; the
   BFF proxies to it under `/api/analytics/*`.

## Conventions (BFF)

All persistence and market/AI routes use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

Error codes: `UNAUTHORIZED` (401), `VALIDATION_ERROR` (400), `NOT_FOUND` (404),
`RATE_LIMITED` (429, includes `retryAfterSeconds`), `INTERNAL` (500),
`UPSTREAM`/`TIMEOUT` (502/504 for external dependencies).

Every route except `/api/health` and the auth handlers requires a valid session
(NextAuth JWT cookie). Ownership is enforced on every `[id]` route — a resource
belonging to another user returns `404`, never `403` (no existence leak).
Internal exception messages are never returned to clients.

---

## Authentication

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ name, email, password }` | Creates a credentials user (bcrypt, 12 rounds). `409 EXISTS` if already registered; upgrades a Google-only account by adding a password. |
| `POST` | `/api/auth/forgot-password` | `{ email }` | Always returns generic success (no account enumeration). Email delivery requires SMTP wiring. |
| `GET/POST` | `/api/auth/[...nextauth]` | — | NextAuth handlers (Google OAuth + Credentials). |

## User

| Method | Path | Body → Result |
| --- | --- | --- |
| `POST` | `/api/user/onboarding` | `{ name?, focus, riskProfile, sipReminders, goalMilestones, aiInsightNotifs }` → sets `onboardingComplete`, risk profile, and preferences. |
| `GET` | `/api/user/risk-profile` | → `{ riskProfile: RiskProfile \| null }` |
| `PUT` | `/api/user/risk-profile` | `{ riskProfile }` → saved profile |
| `GET` | `/api/user/preferences` | → `UserPreferences` (lazily created) |
| `PATCH` | `/api/user/preferences` | subset of six notification booleans + `theme` + `currency` |

## Portfolio & Holdings

| Method | Path | Body → Result |
| --- | --- | --- |
| `GET` | `/api/portfolio` | → `{ portfolios: (Portfolio & { holdings })[], summary }`. `summary` = `{ totalValue, totalInvested, totalReturns, returnPercentage, holdingsCount, assetAllocation[] }`. A default portfolio is created on first call. |
| `POST` | `/api/portfolio` | `{ name, description? }` → new portfolio |
| `POST` | `/api/portfolio/holdings` | `{ portfolioId?, name, ticker, type, assetClass, quantity, avgBuyPrice, currentPrice?, sector? }` → holding. Recomputes portfolio totals + allocations and logs a BUY transaction, transactionally. |
| `PATCH` | `/api/portfolio/holdings/[id]` | `{ quantity?, avgBuyPrice?, currentPrice?, sector? }` → holding (recomputed) |
| `DELETE` | `/api/portfolio/holdings/[id]` | → `{ id, deleted: true }` |

## Goals · Journal · Reports

| Method | Path | Notes |
| --- | --- | --- |
| `GET/POST` | `/api/goals` | Progress and status (`ON_TRACK`/`BEHIND`/`AHEAD`/`COMPLETED`) are derived from contribution pace vs. deadline on every read and persisted. |
| `PATCH/DELETE` | `/api/goals/[id]` | Partial update / delete |
| `GET/POST` | `/api/journal` | Entries with mood + tags |
| `PATCH/DELETE` | `/api/journal/[id]` | |
| `GET/POST` | `/api/reports` | `POST` snapshots the user's live portfolio/goals/SIPs into the report's JSON `data`. |
| `GET/DELETE` | `/api/reports/[id]` | Single report with data / delete |

## Market & AI (proxied, cached, rate-limited)

All are session-gated, per-user rate-limited, and cache upstream responses at the
edge. Market "data" is Gemini-generated and approximate — not a live quote feed.

| Method | Path | Rate | Cache |
| --- | --- | --- | --- |
| `GET` | `/api/market/search?q=` | 30/min | 60s |
| `GET` | `/api/market/indices` | 10/min | 300s |
| `GET` | `/api/market/trending` | 10/min | 3600s |
| `GET` | `/api/market/details?name=&type=` | 10/min | 600s |
| `POST` | `/api/market/analyze` | 10/min | — |
| `GET` | `/api/market/funds-by-category?category=` | 10/min | 3600s |
| `POST` | `/api/ai/insights` | 10/min | — |

The Gemini API key is sent via the `x-goog-api-key` header (never the URL). All
external calls have timeouts (Gemini 15s, Groww 10s). When the key is absent,
`ai/insights` returns honest general guidance with `source: "fallback"` and no
fabricated figures.

## Analytics proxy

`/api/analytics/[...path]` forwards `GET`/`POST` to the FastAPI service. Only the
prefixes `risk`, `projection`, `behavioral`, `allocation`, `health` are allowed;
segments are validated (`^[a-zA-Z0-9_-]+$`, no `..`); the client `Authorization`
header is stripped; 10s timeout; non-JSON upstream → `503`.

## Health

`GET /api/health` (public, uncached) checks Postgres (`SELECT 1`) and the
analytics service, returning
`{ status: "healthy"|"degraded", checks: { database, analytics } }`. Returns
`503` only when the database is down.

---

## Analytics microservice (`/api/v1`)

Stateless. All formulas live in `app/core/quant.py` and are unit-tested
(`tests/test_quant.py`).

### `POST /projection` — deterministic three-scenario projection
`{ current_value, monthly_investment, years, risk_profile }` →
`[{ year, optimistic, expected, conservative, sip_contribution, lumpsum_growth }]`.
Uses effective (geometric) monthly rates and annuity-due SIP contributions.

### `POST /projection/monte-carlo` — Monte Carlo engine
`{ initial_investment, monthly_sip, years, risk_profile, expected_cagr?,
annual_volatility?, annual_step_up?, inflation_rate?, target_amount?,
simulations? }` (default **10,000** paths, monthly steps, GBM).
Returns terminal-wealth `expected_value`, `median`, `best_case`, `worst_case`,
`percentiles` (p10–p90), `probability_of_target`, `probability_of_loss`,
`median_real_value` (inflation-adjusted), `median_max_drawdown`, plus `yearly`
bands, `sample_paths`, and a `distribution` histogram.

### `POST /risk/compute`
`{ holdings: [{ name, value, asset_class, sector? }], returns?, benchmark_returns?,
risk_free_rate? }` → volatility, Sharpe, Sortino, max drawdown, beta, alpha, HHI
concentration, allocation vs. target, sector exposure. Uses the real return
series when ≥12 observations are supplied (`data_source: "computed"`), otherwise
estimates from asset-class assumptions (`data_source: "estimated"`).

### `POST /behavioral/compute`
`{ transactions, sips, holdings }` → discipline (SIP consistency), patience
(churn), loss-aversion control (disposition effect), and diversification (HHI)
scores. Empty inputs yield honest neutral baselines.

### `POST /allocation/compute`
`{ current: { assetClass: value }, risk_profile }` → current vs. model-portfolio
weights, a reasoning narrative, and concrete rebalancing actions derived from the
actual drift (ignoring drifts under 3 percentage points).

Legacy `GET /{id}` variants exist on risk/behavioral/allocation for callers
without holdings data; they return estimates flagged accordingly.
