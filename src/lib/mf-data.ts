/**
 * Real mutual-fund metrics from the public AMFI NAV history (mfapi.in).
 *
 * Groww search returns the AMFI scheme code for each fund; mfapi.in exposes the
 * full daily NAV history for that code with no auth. We compute CAGR, annualized
 * volatility, and max drawdown from the actual series — so the numbers are real,
 * not model-estimated. Gemini (when configured) then adds only the qualitative
 * narrative on top of these hard numbers.
 */

const MFAPI_BASE = "https://api.mfapi.in/mf";
// Generous: the NAV history is large (thousands of points) and Next's
// instrumented fetch is slower than a raw request.
const MFAPI_TIMEOUT_MS = 15_000;
const TRADING_DAYS = 252;

interface MfApiNavPoint {
    date: string; // DD-MM-YYYY
    nav: string;
}

interface MfApiResponse {
    meta?: {
        scheme_name?: string;
        scheme_category?: string;
        fund_house?: string;
    };
    data?: MfApiNavPoint[];
    status?: string;
}

export interface MfMetrics {
    schemeName: string;
    category: string;
    fundHouse: string;
    latestNav: number;
    inceptionDate: string;
    cagr1y: number | null;
    cagr3y: number | null;
    cagr5y: number | null;
    volatilityPercent: number;
    volatilityLabel: "Low" | "Medium" | "High";
    maxDrawdownPercent: number;
    consistency: number;
    riskLabel: "Conservative" | "Moderate" | "Aggressive";
}

/** A numeric AMFI scheme code, e.g. "122639". */
export function isSchemeCode(value: string | null | undefined): value is string {
    return !!value && /^\d{4,7}$/.test(value.trim());
}

function parseNavDate(ddmmyyyy: string): number {
    const [d, m, y] = ddmmyyyy.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
}

/** NAV closest to `targetMs`, searching a sorted-ascending series. */
function navNearest(
    series: { t: number; nav: number }[],
    targetMs: number,
): number | null {
    if (series.length === 0 || targetMs < series[0].t) return null;
    let lo = 0;
    let hi = series.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (series[mid].t < targetMs) lo = mid + 1;
        else hi = mid;
    }
    // lo is the first point at/after target; pick whichever is closer.
    const after = series[lo];
    const before = series[lo - 1] ?? after;
    return Math.abs(after.t - targetMs) < Math.abs(before.t - targetMs)
        ? after.nav
        : before.nav;
}

function cagrBetween(
    series: { t: number; nav: number }[],
    latest: { t: number; nav: number },
    years: number,
): number | null {
    const target = latest.t - years * 365.25 * 24 * 3600 * 1000;
    const past = navNearest(series, target);
    if (!past || past <= 0) return null;
    return ((latest.nav / past) ** (1 / years) - 1) * 100;
}

function annualizedVolatilityPercent(
    series: { t: number; nav: number }[],
): number {
    // Sample one NAV per ~week to damp daily noise, then annualize.
    const step = Math.max(1, Math.floor(series.length / 520)); // ~10y of weekly
    const sampled: number[] = [];
    for (let i = series.length - 1; i >= 0; i -= step) sampled.unshift(series[i].nav);
    if (sampled.length < 3) return 0;
    const rets: number[] = [];
    for (let i = 1; i < sampled.length; i++) {
        if (sampled[i - 1] > 0) rets.push(sampled[i] / sampled[i - 1] - 1);
    }
    if (rets.length < 2) return 0;
    const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
    const variance =
        rets.reduce((s, r) => s + (r - mean) ** 2, 0) / (rets.length - 1);
    const periodsPerYear = TRADING_DAYS / step;
    return Math.sqrt(variance) * Math.sqrt(periodsPerYear) * 100;
}

function maxDrawdownPercent(series: { t: number; nav: number }[]): number {
    let peak = -Infinity;
    let maxDd = 0;
    for (const p of series) {
        if (p.nav > peak) peak = p.nav;
        if (peak > 0) {
            const dd = p.nav / peak - 1;
            if (dd < maxDd) maxDd = dd;
        }
    }
    return maxDd * 100;
}

export async function fetchMfMetrics(
    schemeCode: string,
): Promise<MfMetrics | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MFAPI_TIMEOUT_MS);
    try {
        // Note: don't pass `next: { revalidate }` alongside `signal` — Next.js
        // rejects that combination. HTTP caching is applied by the calling route.
        const res = await fetch(`${MFAPI_BASE}/${encodeURIComponent(schemeCode)}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });
        if (!res.ok) {
            console.error(`[mf-data] mfapi ${schemeCode} HTTP ${res.status}`);
            return null;
        }
        const json = (await res.json()) as MfApiResponse;
        if (!json.data || json.data.length < 30) {
            console.error(`[mf-data] ${schemeCode} insufficient data:`, json.data?.length);
            return null;
        }

        // mfapi returns newest-first; build a sorted-ascending numeric series.
        const series = json.data
            .map((p) => ({ t: parseNavDate(p.date), nav: Number(p.nav) }))
            .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.nav) && p.nav > 0)
            .sort((a, b) => a.t - b.t);
        if (series.length < 30) return null;

        const latest = series[series.length - 1];
        const cagr1y = cagrBetween(series, latest, 1);
        const cagr3y = cagrBetween(series, latest, 3);
        const cagr5y = cagrBetween(series, latest, 5);
        const volatilityPercent = annualizedVolatilityPercent(series);
        const maxDd = maxDrawdownPercent(series);

        const volatilityLabel: MfMetrics["volatilityLabel"] =
            volatilityPercent < 10 ? "Low" : volatilityPercent < 20 ? "Medium" : "High";
        const riskLabel: MfMetrics["riskLabel"] =
            volatilityPercent < 10
                ? "Conservative"
                : volatilityPercent < 20
                  ? "Moderate"
                  : "Aggressive";

        // Risk-adjusted stability, scaled to 40–99: excess return over a ~6.5%
        // risk-free rate per unit of volatility.
        const ref = cagr3y ?? cagr1y ?? 0;
        const pseudoSharpe = volatilityPercent > 0 ? (ref - 6.5) / volatilityPercent : 0;
        const consistency = Math.max(
            40,
            Math.min(99, Math.round(60 + pseudoSharpe * 30)),
        );

        return {
            schemeName: json.meta?.scheme_name ?? "",
            category: json.meta?.scheme_category ?? "Mutual Fund",
            fundHouse: json.meta?.fund_house ?? "",
            latestNav: latest.nav,
            inceptionDate: json.data[json.data.length - 1]?.date ?? "",
            cagr1y: cagr1y === null ? null : Number(cagr1y.toFixed(2)),
            cagr3y: cagr3y === null ? null : Number(cagr3y.toFixed(2)),
            cagr5y: cagr5y === null ? null : Number(cagr5y.toFixed(2)),
            volatilityPercent: Number(volatilityPercent.toFixed(2)),
            volatilityLabel,
            maxDrawdownPercent: Number(maxDd.toFixed(2)),
            consistency,
            riskLabel,
        };
    } catch (err) {
        console.error(
            `[mf-data] ${schemeCode} error:`,
            err instanceof Error ? err.message : err,
        );
        return null;
    } finally {
        clearTimeout(timer);
    }
}
