# Architecture

WealthyMinds is a Next.js 16 application backed by PostgreSQL and a Python
analytics microservice. The design separates three concerns: **presentation**
(React Server/Client Components), **application/BFF** (route handlers that own
auth, validation, persistence, and external-service orchestration), and
**quantitative computation** (a stateless FastAPI service).

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (React 19, Tailwind v4, Framer Motion, React Query)  │
└───────────────┬──────────────────────────────────────────────┘
                │  same-origin fetch
┌───────────────▼──────────────────────────────────────────────┐
│  Next.js 16 App Router                                        │
│                                                              │
│  proxy.ts ──── auth gate for /dashboard, /onboarding         │
│                                                              │
│  app/api/*  ── BFF route handlers                            │
│    • auth (NextAuth v5: Google + Credentials)               │
│    • portfolio / goals / journal / reports / user  ── Prisma │
│    • market / ai            ── Gemini (cached, rate-limited) │
│    • analytics/[...path]    ── proxy → FastAPI (allowlisted) │
│    • health                 ── DB + analytics probes        │
└──────┬───────────────────────────────────┬──────────────────┘
       │                                   │
┌──────▼─────────┐                 ┌───────▼───────────────────┐
│ PostgreSQL     │                 │ FastAPI analytics (:8000) │
│ (Prisma 7 +    │                 │  app/core/quant.py        │
│  adapter-pg)   │                 │  risk · projection ·      │
└────────────────┘                 │  behavioral · allocation  │
                                   │  (stateless, unit-tested) │
                                   └───────────────────────────┘
```

## Frontend

- **App Router** with a server-component shell (`app/layout.tsx`) providing
  fonts (`next/font`), metadata/OG, and the provider tree.
- **Providers** (`components/providers.tsx`): React Query, next-themes,
  NextAuth `SessionProvider`, Framer `MotionConfig reducedMotion="user"`, and the
  global `ToastViewport` + `CommandPalette`.
- **Data fetching**: React Query for all user data (portfolio, goals, journal,
  reports, analytics). Queries are keyed and invalidated on mutation.
- **State**: React Query owns server state; a single Zustand store (`ui-store`)
  owns UI state (sidebar, command palette). No client-side duplication of
  server data.
- **Design system** (`components/ui`): a token-driven set of primitives — Card,
  Button, MetricCard, Dialog, Tooltip, Tabs, Toast, CommandPalette, ThemeToggle,
  AnimatedNumber, Skeletons, EmptyState, Badge. Tokens are OKLCH CSS variables in
  `globals.css` with full light/dark support and a `prefers-reduced-motion`
  fallback.
- **Motion** (`lib/motion.ts`): shared spring/stagger presets; heavy visuals
  (the R3F ambient scene) are dynamically imported and gated on reduced-motion.

## Backend-for-Frontend

Route handlers are the trust boundary. Each one: authenticates via `auth()`,
validates and bounds every input, scopes all queries by `userId`, and returns
the standard envelope. Shared helpers live in `lib/api/` (`respond`,
`rate-limit`) and `app/api/_lib/crud.ts` (envelope, ownership, portfolio
recomputation). External calls funnel through `lib/gemini.ts` (single client,
header auth, timeouts, retries) — no copy-pasted fetch blocks.

## Financial engine

All math is centralized and tested in two places, deliberately mirrored:

- **`services/analytics/app/core/quant.py`** — the authoritative engine: CAGR,
  XIRR, volatility, Sharpe, Sortino, max drawdown, beta/alpha, HHI, SIP/step-up
  FV, inflation adjustment, and the Monte Carlo simulator. 34 unit tests.
- **`src/lib/finance.ts`** — a strictly-typed TypeScript counterpart used for
  instant client-side calculators (goal, tax, SIP, projection) with identical
  conventions: effective (geometric) monthly rates and annuity-due SIP.

Sharing one convention across both ends eliminated the pre-existing bug where
different calculators used nominal vs. effective rates and ordinary- vs.
annuity-due formulas.

## Data model (Prisma)

`User` (with `passwordHash`, `riskProfile`, `onboardingComplete`) →
`Portfolio` → `Holding` → `Transaction`; plus `SIP`, `Goal`, `JournalEntry`,
`AIInsight`, `AnalyticsSnapshot`, `BehavioralMetric`, `Report`,
`UserPreferences`, and the NextAuth `Account`/`Session` tables. Sessions use the
JWT strategy; the adapter persists users and OAuth accounts.

## Security posture

- Auth on every non-public route; ownership checks return `404` not `403`.
- Security headers (HSTS, CSP, `X-Frame-Options`, `Permissions-Policy`) via
  `next.config.ts`.
- Secrets server-side only; Gemini key in a request header, never a URL.
- Per-user rate limiting on cost-bearing routes; timeouts on all external calls.
- No internal error messages leaked to clients.
- Startup env validation in production.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for operational hardening (multi-instance
rate limiting, nonce-based CSP, real market data).
