# Deployment Guide

WealthyMinds has two deployable units: the **Next.js app** (web + BFF) and the
**FastAPI analytics service**. They share a PostgreSQL database (only the web app
connects to it; the analytics service is stateless).

## Environment variables

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | web | Postgres connection string. Validated at startup in production. |
| `AUTH_SECRET` | ✅ | web | `openssl rand -base64 32`. Required in production. |
| `NEXTAUTH_URL` | prod | web | Canonical app URL for OAuth callbacks. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | web | Enables Google sign-in. |
| `GOOGLE_AI_API_KEY` | optional | web | Gemini. Without it, AI features return honest fallbacks. |
| `GROWW_API_KEY` | optional | web | Market-search enrichment. |
| `ANALYTICS_SERVICE_URL` | ✅ | web | e.g. `http://analytics:8000`. |
| `NEXT_PUBLIC_APP_URL` | recommended | web | Used for `metadataBase`, sitemap, OG. |

In production the app **throws at startup** if `AUTH_SECRET` or `DATABASE_URL`
is missing. In development it warns and degrades gracefully.

## Option A — Docker Compose (full stack)

```bash
cp .env.example .env      # fill in AUTH_SECRET at minimum
docker compose up --build
```

Brings up Postgres, the analytics service (`:8000`), and the web app (`:3000`)
with health checks and a persistent `pgdata` volume. Apply the schema once:

```bash
docker compose exec web npx prisma db push
```

## Option B — Managed platforms

**Web → Vercel**
- Import the repo; framework auto-detected (Next.js).
- Set all `web` env vars. Point `ANALYTICS_SERVICE_URL` at the deployed service.
- Build runs `prisma generate` via `postinstall`/build; `prisma db push` (or a
  migration step) must be run against the production DB.

**Analytics → Render / Fly / Railway / any container host**
- Build from `services/analytics/Dockerfile` (non-root, `python:3.12-slim`).
- Exposes `:8000`; health check at `/health`.
- Restrict `ALLOWED_ORIGINS` to the web app's origin.

**Database → Neon / Supabase / RDS**
- Any Postgres 14+. The project is developed against Neon (pooled connection).

## Schema management

```bash
npx prisma db push        # sync schema (dev / first deploy)
npx prisma generate       # regenerate the client
```

For production, prefer versioned migrations (`prisma migrate deploy`) once the
schema stabilizes.

## Post-deploy checklist

- [ ] `GET /api/health` returns `healthy` (DB + analytics both up).
- [ ] Google OAuth redirect URI registered for the production origin.
- [ ] `AUTH_SECRET` set and unique per environment.
- [ ] Analytics `ALLOWED_ORIGINS` locked to the web origin.
- [ ] Security headers present (`curl -I` shows HSTS, CSP, `X-Frame-Options`).
- [ ] Rate limiting: the in-memory limiter is per-instance. For multi-instance
      deployments, swap `src/lib/api/rate-limit.ts` for a Redis-backed limiter.
- [ ] Review the CSP `connect-src` if you add external hosts.

## Known operational notes

- **Rate limiting & response caching** assume a single web instance. Scale-out
  requires shared stores (Redis for limits; a CDN/edge cache respects the
  `s-maxage` headers already emitted).
- **Market data** is Gemini-generated and approximate. For production-grade
  quotes, integrate a licensed market-data provider behind the same routes.
- **Password reset email** requires an SMTP/Resend/SES integration (the endpoint
  and UI exist; delivery is stubbed).
