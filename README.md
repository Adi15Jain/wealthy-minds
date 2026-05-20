# WealthyMinds 🧠💰

WealthyMinds is a premium, AI-powered **Wealth Intelligence Teller** designed for long-term wealth creation. Rather than managing portfolios or tracking net worth, it acts as an **intelligent advisory oracle**—analyzing stocks, mutual funds, and bonds based on historical data, running Monte Carlo projections, and delivering side-by-side comparative investment intelligence.

---

## 🎨 Premium Core Features

1. **Sleek Command Center Dashboard**: A central natural-language search & query bar, suggested teller prompts, featured real Indian market profiles (Nifty Index, Parag Parikh Flexi Cap, HDFC Midcap, Sovereign GOI Bonds, Reliance, TCS), and a persistent local-storage-backed watch list.
2. **SIP Comparative Analyzer**: Search and compare up to 3 shares or mutual funds side-by-side. Compiles historical CAGR, risk metrics (drawdowns, volatility, Sharpe consistency), renders line chart trajectories, and calls Gemini to generate comparative advisory reports.
3. **Monte Carlo SIP Simulator**: A mathematically rigorous calculator that forecasts optimistic (90th percentile), expected (50th percentile), and conservative (10th percentile) wealth horizons using compound variance mathematics.
4. **AI Chat Teller Hub**: A full-screen conversational interface utilizing natural-language search queries directly from the dashboard to answer questions on shares, funds, or bonds.

---

## 🛠 Tech Stack

**Frontend & Core:**
- **Framework:** Next.js 16 (App Router / React 19)
- **Styling:** Tailwind CSS v4, custom glassmorphism, dynamic motion cards
- **Charts & Animation:** Recharts, Framer Motion, React Three Fiber (R3F)
- **AI Integration:** Google AI Studio (Gemini 2.0 Flash)
- **State Management:** Zustand & local React state persistent overlays

**Backend & Data:**
- **Database:** PostgreSQL via Prisma (adapter-pg)
- **Analytics Microservice:** Python 3.11+ & FastAPI (Scientific computing via Pandas, NumPy, SciPy)

---

## 🚀 Getting Started

WealthyMinds features a Next.js BFF proxy to forward API endpoints. If the Python backend service is offline, the frontend's robust fallback layer computes compound variance math and outputs local teller insights seamlessly.

### 1. Environment Variables

Create a `.env` file in the root directory. You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

#### Key Configurations:
- **`DATABASE_URL`**: A PostgreSQL connection string (e.g., from Supabase or Neon.tech).
- **`AUTH_SECRET`**: Session encryption token (generate via `openssl rand -base64 32`).
- **`GOOGLE_AI_API_KEY`**: Obtain a key for free from [Google AI Studio](https://aistudio.google.com/app/apikey) to power live conversational responses.
- **`GROWW_API_KEY`**: Live asset pricing and market performance credentials.
- **`ANALYTICS_SERVICE_URL`**: Base URL for the Python microservice (defaults to `http://localhost:8000`).

### 2. Database Setup

Initialize the database schema:

```bash
npx prisma db push
npx prisma generate
```

### 3. Start the Next.js Server

Install dependencies and boot the developer instance:

```bash
npm install
npm run dev
```

The frontend will run at [http://localhost:3000](http://localhost:3000).

### 4. Run the Python Analytics Microservice (Optional)

Navigate to the analytics directory to run scientific calculators on port `8000`:

```bash
cd services/analytics
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
uvicorn main:app --reload --port 8000
```

---

## 📂 Architecture

- **`src/app/`**: Next.js App Router (Pages, BFF proxies, custom AI router middleware).
- **`src/components/`**: Modular UI design system (primitives, metrics, line charts, conversational message feeds).
- **`src/lib/`**: Helpers, framer transitions, and environment checkers.
- **`services/analytics/`**: Python service handling specialized scientific portfolio calculations.
