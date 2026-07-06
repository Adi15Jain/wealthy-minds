"""
Behavioral analytics endpoints.

Scores investing psychology from actual transaction and SIP history:
discipline (SIP consistency), patience (holding period / churn),
loss aversion (hold-losers vs hold-winners asymmetry), and
diversification awareness (HHI-based).
"""

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.quant import herfindahl_index

router = APIRouter()


class TransactionInput(BaseModel):
    type: str = Field(max_length=20)  # BUY | SELL | SIP | DIVIDEND | ...
    amount: float = Field(gt=0, le=1e12)
    date: date
    # Return of the position at the time of a SELL, as a decimal.
    return_at_txn: Optional[float] = Field(default=None, ge=-1, le=100)


class SIPInput(BaseModel):
    amount: float = Field(gt=0, le=1e9)
    months_active: int = Field(ge=0, le=600)
    months_paid: int = Field(ge=0, le=600)
    status: str = Field(default="ACTIVE", max_length=20)


class HoldingWeight(BaseModel):
    value: float = Field(gt=0, le=1e12)
    asset_class: str = Field(default="equity", max_length=40)


class BehavioralComputeRequest(BaseModel):
    transactions: List[TransactionInput] = Field(default_factory=list, max_length=5000)
    sips: List[SIPInput] = Field(default_factory=list, max_length=200)
    holdings: List[HoldingWeight] = Field(default_factory=list, max_length=500)
    period: str = Field(default="", max_length=20)


def _metric(mid: str, name: str, score: float, trend: str, observations: List[str], period: str) -> dict:
    return {
        "id": mid,
        "metric": name,
        "score": round(max(0.0, min(100.0, score)), 1),
        "trend": trend,
        "observations": observations,
        "period": period,
    }


def _discipline(sips: List[SIPInput]) -> tuple[float, List[str]]:
    """SIP consistency: fraction of scheduled instalments actually paid."""
    if not sips:
        return 50.0, ["No active SIPs yet — start one to build consistency"]
    scheduled = sum(s.months_active for s in sips)
    paid = sum(min(s.months_paid, s.months_active) for s in sips)
    if scheduled == 0:
        return 60.0, ["SIPs registered but no instalments due yet"]
    ratio = paid / scheduled
    obs = [f"{paid} of {scheduled} scheduled SIP instalments executed"]
    active = sum(1 for s in sips if s.status == "ACTIVE")
    if active:
        obs.append(f"{active} active SIP{'s' if active != 1 else ''} running")
    return ratio * 100, obs


def _patience(transactions: List[TransactionInput]) -> tuple[float, List[str]]:
    """Churn: sell counts relative to total activity over the window."""
    if not transactions:
        return 50.0, ["No transactions recorded yet"]
    sells = [t for t in transactions if t.type.upper() == "SELL"]
    churn = len(sells) / len(transactions)
    score = (1 - churn) * 100
    obs = [f"{len(sells)} sells across {len(transactions)} transactions"]
    if churn < 0.1:
        obs.append("Low churn — strong buy-and-hold behaviour")
    elif churn > 0.35:
        obs.append("High churn — frequent selling erodes compounding")
    return score, obs


def _loss_aversion(transactions: List[TransactionInput]) -> tuple[float, List[str]]:
    """Disposition effect: selling winners while clinging to losers.

    Higher score = LESS loss-averse (healthier). With no sell data the
    score is neutral.
    """
    sells = [
        t for t in transactions
        if t.type.upper() == "SELL" and t.return_at_txn is not None
    ]
    if len(sells) < 3:
        return 50.0, ["Not enough sell history to assess the disposition effect"]
    winners = sum(1 for t in sells if (t.return_at_txn or 0) > 0)
    winner_ratio = winners / len(sells)
    # Selling ~55-70% winners is normal; ~100% winners with losers never
    # realized signals the disposition effect.
    score = 100 - max(0.0, winner_ratio - 0.6) * 250
    obs = [f"{winners} of {len(sells)} sells locked in gains"]
    if winner_ratio > 0.85:
        obs.append("Losing positions are rarely exited — set predefined exit criteria")
    return score, obs


def _diversification(holdings: List[HoldingWeight]) -> tuple[float, List[str]]:
    if not holdings:
        return 50.0, ["No holdings recorded yet"]
    values = [h.value for h in holdings]
    hhi = herfindahl_index(values)
    # HHI 1/n (perfectly spread) -> 100; HHI 1 (single holding) -> 0.
    n = len(values)
    floor = 1.0 / n
    score = (1 - (hhi - floor) / (1 - floor)) * 100 if n > 1 else 20.0
    classes = {h.asset_class.lower() for h in holdings}
    obs = [f"{n} holdings across {len(classes)} asset class{'es' if len(classes) != 1 else ''}"]
    if hhi > 0.25:
        obs.append("Concentration is high — consider spreading top positions")
    return score, obs


@router.post("/compute")
async def compute_behavioral_metrics(request: BehavioralComputeRequest) -> List[dict]:
    """Compute behavioral scores from real user activity."""
    period = request.period or f"{date.today().year}-Q{(date.today().month - 1) // 3 + 1}"

    discipline, d_obs = _discipline(request.sips)
    patience, p_obs = _patience(request.transactions)
    loss_av, l_obs = _loss_aversion(request.transactions)
    diver, v_obs = _diversification(request.holdings)

    def trend(score: float) -> str:
        return "improving" if score >= 70 else "stable" if score >= 45 else "declining"

    return [
        _metric("inv-discipline", "Investment Discipline", discipline, trend(discipline), d_obs, period),
        _metric("loss-aversion", "Loss Aversion Control", loss_av, trend(loss_av), l_obs, period),
        _metric("patience", "Patience Score", patience, trend(patience), p_obs, period),
        _metric("diversification", "Diversification Awareness", diver, trend(diver), v_obs, period),
    ]


@router.get("/{user_id}")
async def get_behavioral_metrics(user_id: str) -> List[dict]:
    """Back-compat: neutral baseline scores when no history is supplied."""
    if not user_id or len(user_id) > 64:
        raise HTTPException(status_code=422, detail="invalid user_id")
    return await compute_behavioral_metrics(BehavioralComputeRequest())
