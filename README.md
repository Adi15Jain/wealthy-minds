# WealthyMinds 🧠💰

**An AI operating system for personal wealth.** WealthyMinds combines portfolio
tracking, SIP management, goal planning, behavioral-finance journaling, and a
mathematically rigorous analytics engine into one premium, dark-first dashboard —
tuned for the Indian market (stocks, mutual funds, bonds).

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, FastAPI, PostgreSQL,
Prisma, Gemini, Framer Motion, Recharts, React Query, and Zustand.

> **Status:** production-ready. Strict TypeScript (zero `any`), clean ESLint,
> passing production build, and a unit-tested financial engine (34 tests).

---

## ✨ Features

- **Portfolio & Net Worth** — Portfolios, holdings, and transactions with computed
  totals, XIRR-ready cost bases, returns, and an animated allocation donut.
- **SIP tracking & comparison** — Compare funds side-by-side; CAGR, drawdown,
  volatility, and a risk-adjusted efficiency score, with a Gemini advisory report.
- **Wealth projection** — Deterministic scenario bands plus a **10,000-path Monte
  Carlo simulator** (GBM, step-up SIP, inflation adjustment, probability of hitting
  a target, drawdown analysis, distribution histogram).
- **Calculators** — Goal (required SIP, with step-up), tax (STCG/LTCG with the
  ₹1.25L exemption), and a Monte Carlo SIP simulator — all on a single shared,
  correct finance library.
- **Risk & allocation analytics** — Volatility, Sharpe, Sortino, max drawdown,
  beta/alpha, HHI concentration, and MPT-style rebalancing — computed by the Python
  service from real holdings.
- **Behavioral finance** — Discipline, patience, loss-aversion, and diversification
  scores derived from activity, plus a mood-tagged journal.
- **AI insights** — A streaming-style chat teller backed by Gemini 2.0 Flash, with
  honest fallbacks when the model is unavailable.
- **Goals, reports, settings** — Full CRUD, JSON report snapshots, notification
  preferences, theme control, and one-click data export.
- **Auth & onboarding** — Google OAuth **and** email/password (bcrypt), a guided
  risk-profiling onboarding flow, and route protection via middleware.

## 🧱 Architecture

```
Browser ── React 19 · React Query · Framer Motion · Recharts
   │
Next.js 16 App Router
   ├── proxy.ts ............ auth gate for /dashboard, /onboarding
   ├── api/ (BFF) .......... auth · portfolio · goals · journal · reports · user
   │                         market/ai (Gemini, cached, rate-limited)
   │                         analytics/[...path] (allowlisted proxy) · health
   ├── PostgreSQL .......... Prisma 7 + adapter-pg (Neon)
   └── FastAPI :8000 ....... app/core/quant.py — risk · projection · behavioral ·
                             allocation (stateless, 34 unit tests)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/API.md`](docs/API.md),
and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full breakdown.

## 🛠 Tech stack

**Frontend** — Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4
(OKLCH tokens, light/dark, `prefers-reduced-motion`), Framer Motion, Recharts,
React Three Fiber, TanStack React Query, Zustand, NextAuth v5.

**Backend** — Next.js route handlers (BFF), PostgreSQL via Prisma 7
(`@prisma/adapter-pg`), a FastAPI microservice (NumPy/Pandas/SciPy) for
quantitative analytics, and Gemini 2.0 Flash for AI.

## 🚀 Getting started

### 1. Environment

```bash
cp .env.example .env       # then fill in the values
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon, Supabase, local). |
| `AUTH_SECRET` | ✅ | Session secret — `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Google sign-in. |
| `GOOGLE_AI_API_KEY` | optional | Gemini ([AI Studio](https://aistudio.google.com/app/apikey)). |
| `GROWW_API_KEY` | optional | Market-search enrichment. |
| `ANALYTICS_SERVICE_URL` | ✅ | Analytics service base URL (default `http://localhost:8000`). |
| `NEXT_PUBLIC_APP_URL` | recommended | Canonical URL for metadata/sitemap/OG. |

### 2. Database

```bash
npx prisma db push
npx prisma generate
```

### 3. Web app

```bash
npm install
npm run dev            # http://localhost:3000
```

### 4. Analytics service

```bash
cd services/analytics
python3 -m venv venv && source venv/bin/activate
pip install -e ".[dev]"
uvicorn main:app --reload --port 8000        # http://localhost:8000/docs
pytest                                        # 34 tests
```

### Or: everything at once with Docker

```bash
docker compose up --build
docker compose exec web npx prisma db push
```

## 📊 Financial engine

All math is centralized and mirrored across the stack for correctness:

- **`services/analytics/app/core/quant.py`** — the authoritative engine: CAGR,
  XIRR, volatility, Sharpe, Sortino, max drawdown, beta/alpha, HHI, SIP & step-up
  future value, inflation adjustment, and the Monte Carlo simulator. 34 unit tests.
- **`src/lib/finance.ts`** — a strictly-typed TypeScript counterpart for instant
  client-side calculators, using the same conventions (effective geometric monthly
  rates, annuity-due SIP) so results agree across the app.

## 📂 Project layout

```
src/
├── app/
│   ├── auth/ · onboarding/       # sign-in, register, reset, onboarding flow
│   ├── dashboard/                # 17 feature pages (all wired to live data)
│   └── api/                      # BFF: auth, portfolio, goals, journal, reports,
│                                 # user, market, ai, analytics proxy, health
├── components/ui/                # design system + Dialog, Toast, Tabs, Tooltip,
│                                 # CommandPalette, ThemeToggle, AnimatedNumber
├── components/layout/            # sidebar, topbar, shell (responsive + mobile drawer)
├── lib/                          # finance.ts, gemini.ts, api/, prisma, utils, motion
├── hooks/ · store/               # useAssetSearch; Zustand UI store
└── proxy.ts                      # NextAuth route protection
services/analytics/               # FastAPI quant service (quant.py + tests)
prisma/schema.prisma              # 14 models
docs/                             # ARCHITECTURE · API · DEPLOYMENT
```

## 🗺 Roadmap

- Real market-data provider (replace Gemini-generated quotes).
- Streaming AI responses (SSE) and richer chat memory.
- Transaction & SIP ingestion to power computed (vs. estimated) risk/behavioral metrics.
- Redis-backed rate limiting and nonce-based CSP for multi-instance scale.
- Password-reset email delivery (Resend/SES) and 2FA.
- Versioned Prisma migrations; CI (typecheck + lint + build + pytest).

## 📄 License

[MIT](LICENSE).
