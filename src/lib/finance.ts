/**
 * WealthyMinds financial mathematics — the single source of truth for all
 * compounding, SIP, and projection math used across the dashboard.
 *
 * Conventions:
 * - All rates are decimals: `0.12` means 12% per annum.
 * - SIP future values use the ANNUITY-DUE convention (contribution at the
 *   start of each month, so every instalment earns that month's growth).
 * - Monthly compounding uses the EFFECTIVE monthly rate derived from the
 *   annual rate — `(1 + r)^(1/12) - 1` — not the naive `r / 12`, so that
 *   twelve months of compounding reproduce the annual CAGR exactly.
 */

import { clamp } from "@/lib/utils";

/**
 * Effective monthly rate equivalent to a given annual rate.
 * `(1 + annualRate)^(1/12) - 1`, so compounding 12 months yields `annualRate`.
 */
export function effectiveMonthlyRate(annualRate: number): number {
    return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Future value of a fixed monthly SIP (annuity-due).
 *
 * FV = monthly * (((1 + r)^n - 1) / r) * (1 + r), where r is the effective
 * monthly rate and n the number of months. Falls back to simple accumulation
 * when the rate is zero.
 */
export function sipFutureValue(
    monthly: number,
    annualRate: number,
    months: number,
): number {
    const r = effectiveMonthlyRate(annualRate);
    if (r === 0) return monthly * months;
    return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/**
 * Future value of a step-up SIP where the monthly contribution rises by
 * `annualStepUp` at the start of each year.
 *
 * Computed year by year: each year's 12 annuity-due instalments are grown to
 * that year's end via {@link sipFutureValue}, then compounded at the annual
 * rate for the remaining years to the horizon.
 */
export function stepUpSipFutureValue(
    monthly: number,
    annualRate: number,
    years: number,
    annualStepUp: number,
): number {
    let futureValue = 0;
    let currentMonthly = monthly;
    const wholeYears = Math.floor(years);

    for (let year = 0; year < wholeYears; year++) {
        const yearEndValue = sipFutureValue(currentMonthly, annualRate, 12);
        const remainingYears = wholeYears - year - 1;
        futureValue += yearEndValue * Math.pow(1 + annualRate, remainingYears);
        currentMonthly *= 1 + annualStepUp;
    }

    return futureValue;
}

/**
 * Monthly SIP required to reach `targetCorpus` in `years` at `annualRate`.
 * Exact inverse of {@link sipFutureValue} (annuity-due convention).
 */
export function requiredMonthlySip(
    targetCorpus: number,
    annualRate: number,
    years: number,
): number {
    const months = Math.round(years * 12);
    if (months <= 0 || !Number.isFinite(targetCorpus)) return NaN;
    const fvOfOneRupee = sipFutureValue(1, annualRate, months);
    if (!Number.isFinite(fvOfOneRupee) || fvOfOneRupee <= 0) return NaN;
    return targetCorpus / fvOfOneRupee;
}

/**
 * Starting monthly SIP (with yearly step-up) required to reach `targetCorpus`.
 * Solved via binary search over {@link stepUpSipFutureValue}. Returns NaN when
 * the inputs cannot produce a solution.
 */
export function requiredStepUpSip(
    targetCorpus: number,
    annualRate: number,
    years: number,
    annualStepUp: number,
): number {
    if (
        !Number.isFinite(targetCorpus) ||
        targetCorpus <= 0 ||
        years < 1 ||
        !Number.isFinite(annualRate) ||
        !Number.isFinite(annualStepUp)
    ) {
        return NaN;
    }

    // A monthly SIP equal to the full target always overshoots, so it is a
    // safe upper bound for the search.
    let low = 0;
    let high = targetCorpus;
    if (stepUpSipFutureValue(high, annualRate, years, annualStepUp) < targetCorpus) {
        return NaN;
    }

    for (let iteration = 0; iteration < 100; iteration++) {
        const mid = (low + high) / 2;
        const fv = stepUpSipFutureValue(mid, annualRate, years, annualStepUp);
        if (!Number.isFinite(fv)) return NaN;
        if (fv < targetCorpus) {
            low = mid;
        } else {
            high = mid;
        }
    }

    const result = (low + high) / 2;
    return Number.isFinite(result) ? result : NaN;
}

/** Future value of a lumpsum: `pv * (1 + annualRate)^years`. */
export function lumpsumFutureValue(
    pv: number,
    annualRate: number,
    years: number,
): number {
    return pv * Math.pow(1 + annualRate, years);
}

/** Compound annual growth rate between a beginning and ending value. */
export function cagr(begin: number, end: number, years: number): number {
    if (begin <= 0 || end < 0 || years <= 0) return NaN;
    return Math.pow(end / begin, 1 / years) - 1;
}

/** Absolute (total) return between two values, e.g. 0.5 for +50%. */
export function absoluteReturn(begin: number, end: number): number {
    if (begin === 0) return NaN;
    return (end - begin) / begin;
}

/** Annualized return implied by a total return over `years`. */
export function annualizedReturn(totalReturn: number, years: number): number {
    if (years <= 0 || totalReturn <= -1) return NaN;
    return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/** Real (inflation-adjusted) rate via the Fisher equation: (1+n)/(1+i) - 1. */
export function realRate(nominal: number, inflation: number): number {
    return (1 + nominal) / (1 + inflation) - 1;
}

/** Present-day purchasing power of a nominal amount received `years` ahead. */
export function inflationAdjusted(
    nominal: number,
    inflation: number,
    years: number,
): number {
    return nominal / Math.pow(1 + inflation, years);
}

/**
 * Standard normal cumulative distribution function Φ(z).
 * Abramowitz & Stegun formula 26.2.17 (max abs error < 7.5e-8).
 */
export function normCdf(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
    const poly =
        t *
        (0.31938153 +
            t *
                (-0.356563782 +
                    t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const p = 1 - density * poly;
    return z >= 0 ? p : 1 - p;
}

/** Deterministic lognormal projection band for a SIP + lumpsum portfolio. */
export interface ProjectionBand {
    /** Median (50th percentile) balance from pure compounding. */
    expected: number;
    /** 90th percentile balance (z = +1.28). */
    optimistic: number;
    /** 10th percentile balance (z = -1.28). */
    conservative: number;
}

/**
 * Deterministic lognormal band used by the wealth-projection simulator.
 *
 * The expected (median) balance compounds `pv` and the monthly SIP at the
 * effective monthly rate. Optimistic/conservative scenarios scale the median
 * by `exp(±1.28·σ√t − σ²t/2)` — the 90th/10th percentile multipliers of a
 * geometric Brownian motion with annual volatility σ over t years, including
 * the variance drag on the drift.
 *
 * @param pv          Lumpsum invested today (pass 0 for a pure SIP).
 * @param monthlySip  Monthly contribution (annuity-due).
 * @param annualCagr  Expected annual growth rate (decimal).
 * @param annualVol   Annual volatility σ (decimal).
 * @param years       Horizon in years (may be fractional, e.g. month / 12).
 */
export function lognormalBand(
    pv: number,
    monthlySip: number,
    annualCagr: number,
    annualVol: number,
    years: number,
): ProjectionBand {
    const months = Math.round(years * 12);
    const expected =
        lumpsumFutureValue(pv, annualCagr, years) +
        sipFutureValue(monthlySip, annualCagr, months);

    const sigmaSqrtT = annualVol * Math.sqrt(years);
    const varianceDrag = (annualVol * annualVol * years) / 2;

    return {
        expected,
        optimistic: expected * Math.exp(1.28 * sigmaSqrtT - varianceDrag),
        conservative: expected * Math.exp(-1.28 * sigmaSqrtT - varianceDrag),
    };
}

/**
 * Fraction of the total projected gains (expected − invested) that accrue in
 * the final `finalYears` of the timeline.
 *
 * @param chartData  Projection samples, assumed evenly spaced from the start
 *                   to the end of the horizon (each point carrying cumulative
 *                   invested capital and expected balance).
 * @param finalYears Size of the trailing window, in years.
 * @param totalYears Full horizon covered by `chartData`, in years.
 * @returns Fraction in [0, 1], or NaN when it cannot be computed
 *          (fewer than 2 points, non-positive horizon, or no gains).
 */
export function sipShareOfReturnsInFinalYears(
    chartData: { invested: number; expected: number }[],
    finalYears: number,
    totalYears: number,
): number {
    if (chartData.length < 2 || totalYears <= 0 || finalYears <= 0) return NaN;

    const last = chartData[chartData.length - 1];
    const totalGain = last.expected - last.invested;
    if (!Number.isFinite(totalGain) || totalGain <= 0) return NaN;

    const window = Math.min(finalYears, totalYears);
    const cutoffIndex = Math.max(
        0,
        Math.round((chartData.length - 1) * (1 - window / totalYears)),
    );
    const cutoff = chartData[cutoffIndex];
    const gainAtCutoff = cutoff.expected - cutoff.invested;

    return clamp((totalGain - gainAtCutoff) / totalGain, 0, 1);
}
