"""
Quantitative finance core.

All formulas used by the analytics endpoints live here so they can be
unit-tested in isolation. Conventions:

- Rates are decimals (0.12 == 12%) unless a function says otherwise.
- Return series are simple periodic returns (0.01 == +1% for the period).
- Annualization assumes the caller passes ``periods_per_year`` matching
  the series frequency (12 for monthly, 252 for daily).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date
from typing import Optional, Sequence

import numpy as np

TRADING_DAYS = 252
MONTHS = 12


# ---------------------------------------------------------------------------
# Returns
# ---------------------------------------------------------------------------

def absolute_return(begin_value: float, end_value: float) -> float:
    """Total simple return over the whole holding period."""
    if begin_value <= 0:
        raise ValueError("begin_value must be positive")
    return end_value / begin_value - 1


def cagr(begin_value: float, end_value: float, years: float) -> float:
    """Compound annual growth rate."""
    if begin_value <= 0 or end_value <= 0:
        raise ValueError("values must be positive")
    if years <= 0:
        raise ValueError("years must be positive")
    return (end_value / begin_value) ** (1 / years) - 1


def annualized_return(total_return: float, years: float) -> float:
    """Convert a total holding-period return into a CAGR."""
    if years <= 0:
        raise ValueError("years must be positive")
    if total_return <= -1:
        raise ValueError("total_return must be > -100%")
    return (1 + total_return) ** (1 / years) - 1


def effective_monthly_rate(annual_rate: float) -> float:
    """Monthly rate that compounds to the given effective annual rate.

    Using ``annual / 12`` overstates growth (12% nominal -> 12.68%
    effective); this is the correct geometric conversion.
    """
    if annual_rate <= -1:
        raise ValueError("annual_rate must be > -100%")
    return (1 + annual_rate) ** (1 / MONTHS) - 1


def returns_from_prices(prices: Sequence[float]) -> np.ndarray:
    """Simple periodic returns from a price/NAV series."""
    arr = np.asarray(prices, dtype=float)
    if arr.ndim != 1 or arr.size < 2:
        raise ValueError("need at least two prices")
    if np.any(arr <= 0):
        raise ValueError("prices must be positive")
    return arr[1:] / arr[:-1] - 1


def rolling_returns(
    prices: Sequence[float], window: int, periods_per_year: int = MONTHS
) -> np.ndarray:
    """Annualized rolling returns over ``window`` periods."""
    arr = np.asarray(prices, dtype=float)
    if window < 1 or arr.size <= window:
        raise ValueError("window must be >= 1 and shorter than the series")
    total = arr[window:] / arr[:-window]
    years = window / periods_per_year
    return total ** (1 / years) - 1


# ---------------------------------------------------------------------------
# XIRR / IRR
# ---------------------------------------------------------------------------

def xirr(cashflows: Sequence[tuple[date, float]], guess: float = 0.1) -> float:
    """Internal rate of return for irregularly spaced cashflows.

    Outflows (investments) are negative, inflows positive. Uses Newton's
    method with a bisection fallback; raises ValueError if no sign change
    exists or the solver fails to converge.
    """
    if len(cashflows) < 2:
        raise ValueError("need at least two cashflows")
    amounts = np.array([cf[1] for cf in cashflows], dtype=float)
    if not (np.any(amounts > 0) and np.any(amounts < 0)):
        raise ValueError("cashflows must contain both inflows and outflows")

    t0 = cashflows[0][0]
    years = np.array([(cf[0] - t0).days / 365.0 for cf in cashflows])

    def npv(rate: float) -> float:
        return float(np.sum(amounts / (1 + rate) ** years))

    def npv_prime(rate: float) -> float:
        return float(np.sum(-years * amounts / (1 + rate) ** (years + 1)))

    rate = guess
    for _ in range(100):
        f = npv(rate)
        if abs(f) < 1e-9:
            return rate
        d = npv_prime(rate)
        if d == 0:
            break
        step = f / d
        next_rate = rate - step
        if next_rate <= -0.999999:
            next_rate = (rate - 0.999999) / 2
        if abs(next_rate - rate) < 1e-10:
            return next_rate
        rate = next_rate

    # Bisection fallback over a wide bracket.
    lo, hi = -0.999999, 100.0
    f_lo, f_hi = npv(lo), npv(hi)
    if f_lo * f_hi > 0:
        raise ValueError("XIRR did not converge")
    for _ in range(200):
        mid = (lo + hi) / 2
        f_mid = npv(mid)
        if abs(f_mid) < 1e-9:
            return mid
        if f_lo * f_mid < 0:
            hi, f_hi = mid, f_mid
        else:
            lo, f_lo = mid, f_mid
    return (lo + hi) / 2


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------

def annualized_volatility(
    returns: Sequence[float], periods_per_year: int = MONTHS
) -> float:
    """Annualized standard deviation of periodic returns (ddof=1)."""
    arr = np.asarray(returns, dtype=float)
    if arr.size < 2:
        raise ValueError("need at least two returns")
    return float(np.std(arr, ddof=1) * math.sqrt(periods_per_year))


def sharpe_ratio(
    returns: Sequence[float],
    risk_free_rate: float = 0.065,
    periods_per_year: int = MONTHS,
) -> float:
    """Annualized Sharpe ratio using excess returns over the risk-free rate.

    ``risk_free_rate`` is annual; it is converted to the series frequency
    before computing the excess-return mean.
    """
    arr = np.asarray(returns, dtype=float)
    if arr.size < 2:
        raise ValueError("need at least two returns")
    rf_periodic = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    excess = arr - rf_periodic
    sd = np.std(excess, ddof=1)
    if sd == 0:
        return 0.0
    return float(np.mean(excess) / sd * math.sqrt(periods_per_year))


def sortino_ratio(
    returns: Sequence[float],
    risk_free_rate: float = 0.065,
    periods_per_year: int = MONTHS,
) -> float:
    """Annualized Sortino ratio: excess return over downside deviation.

    Downside deviation uses the full sample size (not just negative
    observations), per the standard Sortino definition.
    """
    arr = np.asarray(returns, dtype=float)
    if arr.size < 2:
        raise ValueError("need at least two returns")
    rf_periodic = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    excess = arr - rf_periodic
    downside = np.minimum(excess, 0.0)
    dd = math.sqrt(float(np.mean(downside**2)))
    if dd == 0:
        return 0.0
    return float(np.mean(excess) / dd * math.sqrt(periods_per_year))


def max_drawdown(prices: Sequence[float]) -> float:
    """Maximum peak-to-trough decline of a price/value series.

    Returned as a negative decimal (-0.25 == a 25% drawdown).
    """
    arr = np.asarray(prices, dtype=float)
    if arr.size < 2:
        raise ValueError("need at least two prices")
    peaks = np.maximum.accumulate(arr)
    drawdowns = arr / peaks - 1
    return float(np.min(drawdowns))


def beta_alpha(
    returns: Sequence[float],
    benchmark_returns: Sequence[float],
    risk_free_rate: float = 0.065,
    periods_per_year: int = MONTHS,
) -> tuple[float, float]:
    """CAPM beta and annualized Jensen's alpha vs a benchmark.

    beta = cov(r_p, r_b) / var(r_b); alpha is the annualized intercept of
    excess portfolio returns over what CAPM predicts.
    """
    rp = np.asarray(returns, dtype=float)
    rb = np.asarray(benchmark_returns, dtype=float)
    if rp.size != rb.size or rp.size < 2:
        raise ValueError("series must be equal length with >= 2 points")
    var_b = np.var(rb, ddof=1)
    if var_b == 0:
        raise ValueError("benchmark has zero variance")
    beta = float(np.cov(rp, rb, ddof=1)[0, 1] / var_b)
    rf_periodic = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    alpha_periodic = float(
        np.mean(rp - rf_periodic) - beta * np.mean(rb - rf_periodic)
    )
    alpha_annual = (1 + alpha_periodic) ** periods_per_year - 1
    return beta, alpha_annual


def herfindahl_index(weights: Sequence[float]) -> float:
    """Herfindahl-Hirschman concentration index of portfolio weights.

    Weights are normalized first; result is in (0, 1], higher = more
    concentrated (1 == single holding).
    """
    arr = np.asarray(weights, dtype=float)
    if arr.size == 0 or np.any(arr < 0):
        raise ValueError("weights must be non-negative and non-empty")
    total = arr.sum()
    if total == 0:
        raise ValueError("weights sum to zero")
    w = arr / total
    return float(np.sum(w**2))


# ---------------------------------------------------------------------------
# SIP mathematics
# ---------------------------------------------------------------------------

def sip_future_value(
    monthly_investment: float, annual_rate: float, months: int
) -> float:
    """Future value of a fixed monthly SIP (annuity-due: invest at month
    start), using the effective monthly rate."""
    if months < 0:
        raise ValueError("months must be >= 0")
    r = effective_monthly_rate(annual_rate)
    if r == 0:
        return monthly_investment * months
    return monthly_investment * (((1 + r) ** months - 1) / r) * (1 + r)


def step_up_sip_future_value(
    monthly_investment: float,
    annual_rate: float,
    years: int,
    annual_step_up: float = 0.0,
) -> float:
    """Future value of a SIP whose monthly amount rises by
    ``annual_step_up`` at the start of every new year."""
    if years < 0:
        raise ValueError("years must be >= 0")
    r = effective_monthly_rate(annual_rate)
    total = 0.0
    sip = monthly_investment
    for year in range(years):
        # FV of this year's 12 contributions, then grown to the horizon.
        fv_year = (
            sip * (((1 + r) ** MONTHS - 1) / r) * (1 + r)
            if r != 0
            else sip * MONTHS
        )
        remaining_months = (years - year - 1) * MONTHS
        total += fv_year * (1 + r) ** remaining_months
        sip *= 1 + annual_step_up
    return total


def sip_total_invested(
    monthly_investment: float, years: int, annual_step_up: float = 0.0
) -> float:
    """Total principal contributed over the SIP's life."""
    total = 0.0
    sip = monthly_investment
    for _ in range(years):
        total += sip * MONTHS
        sip *= 1 + annual_step_up
    return total


def lumpsum_future_value(present_value: float, annual_rate: float, years: float) -> float:
    """Compound growth of a one-time investment at an effective annual rate."""
    return present_value * (1 + annual_rate) ** years


def inflation_adjusted(nominal_value: float, inflation_rate: float, years: float) -> float:
    """Present-day purchasing power of a future nominal amount."""
    if inflation_rate <= -1:
        raise ValueError("inflation_rate must be > -100%")
    return nominal_value / (1 + inflation_rate) ** years


def real_rate(nominal_rate: float, inflation_rate: float) -> float:
    """Fisher-equation real return: (1+n)/(1+i) - 1."""
    return (1 + nominal_rate) / (1 + inflation_rate) - 1


# ---------------------------------------------------------------------------
# Monte Carlo engine
# ---------------------------------------------------------------------------

@dataclass
class MonteCarloResult:
    """Distribution statistics of terminal wealth plus per-year bands."""

    simulations: int
    years: int
    total_invested: float
    expected_value: float
    median: float
    best_case: float
    worst_case: float
    percentiles: dict[str, float]
    probability_of_target: Optional[float]
    probability_of_loss: float
    median_real_value: float
    median_max_drawdown: float
    yearly: list[dict] = field(default_factory=list)
    sample_paths: list[list[float]] = field(default_factory=list)
    distribution: list[dict] = field(default_factory=list)


def monte_carlo_projection(
    initial_investment: float,
    monthly_sip: float,
    years: int,
    expected_cagr: float,
    annual_volatility: float,
    annual_step_up: float = 0.0,
    inflation_rate: float = 0.05,
    target_amount: Optional[float] = None,
    simulations: int = 10_000,
    sample_path_count: int = 50,
    seed: Optional[int] = None,
) -> MonteCarloResult:
    """Simulate wealth paths under geometric Brownian motion.

    Monthly log-returns are drawn from N((mu - sigma^2/2) * dt, sigma^2 * dt)
    with dt = 1/12, where mu = ln(1 + expected_cagr) so the *median* path
    compounds at the expected CAGR net of volatility drag being applied
    symmetrically in log space. SIP contributions are made at the start of
    each month and step up annually.
    """
    if years < 1 or years > 60:
        raise ValueError("years must be between 1 and 60")
    if simulations < 100 or simulations > 100_000:
        raise ValueError("simulations must be between 100 and 100000")
    if initial_investment < 0 or monthly_sip < 0:
        raise ValueError("amounts must be non-negative")
    if initial_investment == 0 and monthly_sip == 0:
        raise ValueError("provide an initial investment and/or a monthly SIP")
    if annual_volatility < 0:
        raise ValueError("volatility must be non-negative")

    rng = np.random.default_rng(seed)
    months = years * MONTHS
    dt = 1.0 / MONTHS
    mu = math.log1p(expected_cagr)
    drift = (mu - 0.5 * annual_volatility**2) * dt
    diffusion = annual_volatility * math.sqrt(dt)

    growth = np.exp(
        rng.normal(drift, diffusion, size=(simulations, months))
        if annual_volatility > 0
        else np.full((simulations, months), drift)
    )

    values = np.empty((simulations, months + 1))
    values[:, 0] = initial_investment
    contributions = np.empty(months)
    sip = monthly_sip
    for m in range(months):
        if m > 0 and m % MONTHS == 0:
            sip *= 1 + annual_step_up
        contributions[m] = sip
    for m in range(months):
        # Annuity-due: contribute at month start, then the market moves.
        values[:, m + 1] = (values[:, m] + contributions[m]) * growth[:, m]

    invested_by_month = initial_investment + np.cumsum(contributions)
    total_invested = float(invested_by_month[-1])
    final = values[:, -1]

    pct_levels = [10, 25, 50, 75, 90]
    final_pcts = np.percentile(final, pct_levels)

    yearly = []
    for year in range(1, years + 1):
        col = values[:, year * MONTHS]
        p10, p25, p50, p75, p90 = np.percentile(col, pct_levels)
        yearly.append(
            {
                "year": year,
                "invested": round(float(invested_by_month[year * MONTHS - 1]), 2),
                "p10": round(float(p10), 2),
                "p25": round(float(p25), 2),
                "p50": round(float(p50), 2),
                "p75": round(float(p75), 2),
                "p90": round(float(p90), 2),
                "mean": round(float(np.mean(col)), 2),
            }
        )

    # Max drawdown of each path's yearly values, reported at the median.
    # The year-0 column is zero when there is no initial investment, so
    # guard the division against zero peaks.
    yearly_values = values[:, ::MONTHS]
    peaks = np.maximum.accumulate(yearly_values, axis=1)
    ratios = np.divide(
        yearly_values, peaks, out=np.ones_like(yearly_values), where=peaks > 0
    )
    path_mdd = np.min(ratios - 1, axis=1)

    # Terminal-wealth histogram for the distribution chart.
    hist, edges = np.histogram(final, bins=30)
    distribution = [
        {
            "from": round(float(edges[i]), 2),
            "to": round(float(edges[i + 1]), 2),
            "count": int(hist[i]),
            "probability": round(float(hist[i]) / simulations, 4),
        }
        for i in range(len(hist))
    ]

    # A few full paths (yearly resolution) for spaghetti charts, spread
    # across the outcome distribution rather than random picks.
    order = np.argsort(final)
    idx = order[np.linspace(0, simulations - 1, min(sample_path_count, simulations)).astype(int)]
    sample_paths = [[round(float(v), 2) for v in values[i, ::MONTHS]] for i in idx]

    return MonteCarloResult(
        simulations=simulations,
        years=years,
        total_invested=round(total_invested, 2),
        expected_value=round(float(np.mean(final)), 2),
        median=round(float(final_pcts[2]), 2),
        best_case=round(float(np.percentile(final, 99)), 2),
        worst_case=round(float(np.percentile(final, 1)), 2),
        percentiles={
            "p10": round(float(final_pcts[0]), 2),
            "p25": round(float(final_pcts[1]), 2),
            "p50": round(float(final_pcts[2]), 2),
            "p75": round(float(final_pcts[3]), 2),
            "p90": round(float(final_pcts[4]), 2),
        },
        probability_of_target=(
            round(float(np.mean(final >= target_amount)), 4)
            if target_amount
            else None
        ),
        probability_of_loss=round(float(np.mean(final < total_invested)), 4),
        median_real_value=round(
            inflation_adjusted(float(final_pcts[2]), inflation_rate, years), 2
        ),
        median_max_drawdown=round(float(np.median(path_mdd)), 4),
        yearly=yearly,
        sample_paths=sample_paths,
        distribution=distribution,
    )
