"""
Allocation intelligence endpoints.

Compares a portfolio's current asset mix against a risk-profile model
portfolio and derives concrete rebalancing actions from the actual gaps.
"""

from typing import Dict, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

# Model portfolios per risk profile (weights sum to 1.0).
MODEL_PORTFOLIOS: Dict[str, Dict[str, float]] = {
    "conservative": {"equity": 0.30, "debt": 0.50, "gold": 0.10, "cash": 0.10},
    "moderate": {"equity": 0.45, "debt": 0.35, "gold": 0.10, "cash": 0.10},
    "balanced": {"equity": 0.55, "debt": 0.25, "gold": 0.10, "international": 0.05, "cash": 0.05},
    "growth": {"equity": 0.65, "debt": 0.15, "gold": 0.05, "international": 0.10, "cash": 0.05},
    "aggressive": {"equity": 0.75, "debt": 0.05, "gold": 0.05, "international": 0.13, "cash": 0.02},
}

ASSET_LABELS = {
    "equity": "Equity Funds",
    "debt": "Debt Funds",
    "gold": "Gold",
    "real_estate": "Real Estate / REITs",
    "cash": "Cash",
    "international": "International Equity",
    "alternative": "Alternatives",
}

REBALANCE_THRESHOLD = 0.03  # ignore drifts under 3 percentage points


class AllocationComputeRequest(BaseModel):
    # Current allocation as {asset_class: value or weight}. Values are
    # normalized internally, so rupee amounts or percentages both work.
    current: Dict[str, float] = Field(min_length=1, max_length=10)
    risk_profile: str = Field(default="balanced", max_length=20)


def _normalize(current: Dict[str, float]) -> Dict[str, float]:
    cleaned = {k.lower(): v for k, v in current.items() if v > 0}
    total = sum(cleaned.values())
    if total <= 0:
        raise HTTPException(status_code=422, detail="allocation values must be positive")
    return {k: v / total for k, v in cleaned.items()}


def _reasoning(profile: str, actions: List[dict]) -> str:
    if not actions:
        return (
            f"Your allocation is already within 3% of the {profile} model "
            "portfolio on every asset class. No rebalancing needed — review "
            "again after significant market moves or new investments."
        )
    moves = []
    for a in actions[:3]:
        verb = {"reduce": "trimming", "increase": "raising", "add": "adding"}[a["action"]]
        moves.append(f"{verb} {a['asset']} from {a['from_pct']}% to {a['to_pct']}%")
    return (
        f"Relative to the {profile} model portfolio, the largest drifts are "
        f"addressed by {'; '.join(moves)}. Rebalancing back to target keeps "
        "risk aligned with your profile and systematically sells high / buys low."
    )


@router.post("/compute")
async def compute_allocation(request: AllocationComputeRequest) -> dict:
    """Derive rebalancing guidance from the caller's actual allocation."""
    profile = request.risk_profile.lower()
    if profile not in MODEL_PORTFOLIOS:
        raise HTTPException(
            status_code=422,
            detail=f"risk_profile must be one of {sorted(MODEL_PORTFOLIOS)}",
        )
    current = _normalize(request.current)
    target = MODEL_PORTFOLIOS[profile]

    actions: List[dict] = []
    for asset in sorted(set(current) | set(target)):
        cur = current.get(asset, 0.0)
        tgt = target.get(asset, 0.0)
        drift = tgt - cur
        if abs(drift) < REBALANCE_THRESHOLD:
            continue
        actions.append(
            {
                "action": "add" if cur == 0 else ("increase" if drift > 0 else "reduce"),
                "asset": ASSET_LABELS.get(asset, asset.title()),
                "from_pct": round(cur * 100, 1),
                "to_pct": round(tgt * 100, 1),
                "drift_pct": round(drift * 100, 1),
            }
        )
    actions.sort(key=lambda a: -abs(a["drift_pct"]))

    return {
        "current": {k: round(v * 100, 1) for k, v in current.items()},
        "suggested": {k: round(v * 100, 1) for k, v in target.items()},
        "risk_profile": profile,
        "reasoning": _reasoning(profile, actions),
        "actions": actions,
        "rebalance_needed": bool(actions),
    }


@router.get("/{portfolio_id}")
async def get_allocation_suggestion(portfolio_id: str) -> dict:
    """Back-compat: guidance for a typical drifted balanced portfolio."""
    if not portfolio_id or len(portfolio_id) > 64:
        raise HTTPException(status_code=422, detail="invalid portfolio_id")
    return await compute_allocation(
        AllocationComputeRequest(
            current={"equity": 65, "debt": 20, "gold": 10, "cash": 5},
            risk_profile="balanced",
        )
    )
