"""
Risk analytics endpoints.

Computes portfolio risk from holdings and (when available) historical
return series: volatility, Sharpe, Sortino, max drawdown, beta/alpha,
and HHI concentration. When no series is supplied the metrics are
estimated from asset-class assumptions and flagged ``data_source:
"estimated"``.
"""

import math
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.quant import (
    annualized_volatility,
    beta_alpha,
    herfindahl_index,
    max_drawdown,
    sharpe_ratio,
    sortino_ratio,
)

router = APIRouter()

RISK_FREE_RATE = 0.065  # ~10Y G-Sec yield

# Long-run asset-class assumptions (annual return, annual volatility)
# used only for the estimation path.
ASSET_CLASS_ASSUMPTIONS = {
    "equity": (0.12, 0.18),
    "debt": (0.07, 0.03),
    "gold": (0.08, 0.14),
    "real_estate": (0.09, 0.12),
    "cash": (0.04, 0.005),
    "international": (0.11, 0.16),
    "alternative": (0.10, 0.20),
}

# Cross-asset diversification: a fully spread portfolio doesn't carry the
# weighted sum of standalone volatilities. Approximates average pairwise
# correlation ~0.45 across asset classes.
DIVERSIFICATION_FACTOR = 0.80

TARGET_WEIGHTS_BALANCED = {"equity": 0.60, "debt": 0.25, "gold": 0.10, "cash": 0.05}


class HoldingInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    value: float = Field(gt=0, le=1e12)
    asset_class: str = Field(default="equity", max_length=40)
    sector: Optional[str] = Field(default=None, max_length=80)


class RiskComputeRequest(BaseModel):
    holdings: List[HoldingInput] = Field(min_length=1, max_length=500)
    # Optional monthly return series (decimals) for the portfolio and a
    # benchmark (e.g. NIFTY 50). When present, statistics are computed
    # from data instead of estimated.
    returns: Optional[List[float]] = Field(default=None, max_length=1200)
    benchmark_returns: Optional[List[float]] = Field(default=None, max_length=1200)
    risk_free_rate: float = Field(default=RISK_FREE_RATE, ge=0, le=0.2)


def _concentration(values: List[float]) -> dict:
    weights = sorted((v / sum(values) for v in values), reverse=True)
    hhi = herfindahl_index(values)
    level = "high" if hhi > 0.18 else "medium" if hhi > 0.10 else "low"
    return {
        "top_holding_weight": round(weights[0] * 100, 2),
        "top_5_weight": round(sum(weights[:5]) * 100, 2),
        "hhi": round(hhi, 4),
        "level": level,
    }


def _estimate_portfolio_stats(holdings: List[HoldingInput]) -> tuple[float, float]:
    """Weighted expected return and diversification-adjusted volatility
    from asset-class assumptions."""
    total = sum(h.value for h in holdings)
    exp_ret = 0.0
    vol = 0.0
    for h in holdings:
        ret, sigma = ASSET_CLASS_ASSUMPTIONS.get(
            h.asset_class.lower(), ASSET_CLASS_ASSUMPTIONS["equity"]
        )
        w = h.value / total
        exp_ret += w * ret
        vol += w * sigma
    return exp_ret, vol * DIVERSIFICATION_FACTOR


def _risk_score(volatility: float, hhi: float, equity_weight: float) -> float:
    """0-100 composite: volatility (60%), concentration (25%), equity
    exposure (15%). Higher = riskier."""
    vol_component = min(volatility / 0.25, 1.0) * 60
    conc_component = min(hhi / 0.30, 1.0) * 25
    equity_component = equity_weight * 15
    return round(vol_component + conc_component + equity_component, 1)


def _build_response(req: RiskComputeRequest) -> dict:
    total = sum(h.value for h in req.holdings)
    values = [h.value for h in req.holdings]

    by_class: dict[str, float] = {}
    by_sector: dict[str, float] = {}
    for h in req.holdings:
        by_class[h.asset_class.lower()] = by_class.get(h.asset_class.lower(), 0) + h.value
        if h.sector:
            by_sector[h.sector] = by_sector.get(h.sector, 0) + h.value

    equity_weight = by_class.get("equity", 0) / total

    if req.returns and len(req.returns) >= 12:
        data_source = "computed"
        vol = annualized_volatility(req.returns)
        sharpe = sharpe_ratio(req.returns, req.risk_free_rate)
        sortino = sortino_ratio(req.returns, req.risk_free_rate)
        nav = [100.0]
        for r in req.returns:
            nav.append(nav[-1] * (1 + r))
        mdd = max_drawdown(nav)
        if req.benchmark_returns and len(req.benchmark_returns) == len(req.returns):
            beta, alpha = beta_alpha(
                req.returns, req.benchmark_returns, req.risk_free_rate
            )
        else:
            beta, alpha = round(equity_weight * 1.05, 2), 0.0
    else:
        data_source = "estimated"
        exp_ret, vol = _estimate_portfolio_stats(req.holdings)
        excess = exp_ret - req.risk_free_rate
        sharpe = excess / vol if vol > 0 else 0.0
        sortino = sharpe * 1.35  # downside vol runs ~70-75% of total vol
        # Lognormal approximation: typical worst annual drawdown ~1.9 sigma.
        mdd = -min(1.9 * vol, 0.60)
        beta = equity_weight * 1.05
        alpha = 0.0

    hhi = herfindahl_index(values)
    allocation = [
        {
            "asset_class": cls,
            "weight": round(v / total * 100, 2),
            "target_weight": round(TARGET_WEIGHTS_BALANCED.get(cls, 0) * 100, 2),
        }
        for cls, v in sorted(by_class.items(), key=lambda kv: -kv[1])
    ]
    sectors = [
        {"sector": s, "weight": round(v / total * 100, 2)}
        for s, v in sorted(by_sector.items(), key=lambda kv: -kv[1])[:8]
    ]

    return {
        "overall_risk_score": _risk_score(vol, hhi, equity_weight),
        "volatility": round(vol * 100, 2),
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "max_drawdown": round(mdd * 100, 2),
        "beta": round(beta, 2),
        "alpha": round(alpha * 100, 2),
        "concentration": _concentration(values),
        "asset_allocation": allocation,
        "sector_exposure": sectors,
        "data_source": data_source,
        "risk_free_rate": req.risk_free_rate,
    }


@router.post("/compute")
async def compute_risk_metrics(request: RiskComputeRequest) -> dict:
    """Compute risk metrics from actual holdings (and return series when
    available)."""
    try:
        return _build_response(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{portfolio_id}")
async def get_risk_metrics(portfolio_id: str) -> dict:
    """Back-compat estimate for callers without holdings data.

    Returns metrics for a model balanced portfolio, flagged as estimated.
    """
    if not portfolio_id or len(portfolio_id) > 64:
        raise HTTPException(status_code=422, detail="invalid portfolio_id")
    model = RiskComputeRequest(
        holdings=[
            HoldingInput(name="Equity", value=60, asset_class="equity", sector="Diversified"),
            HoldingInput(name="Debt", value=25, asset_class="debt"),
            HoldingInput(name="Gold", value=10, asset_class="gold"),
            HoldingInput(name="Cash", value=5, asset_class="cash"),
        ]
    )
    return _build_response(model)
