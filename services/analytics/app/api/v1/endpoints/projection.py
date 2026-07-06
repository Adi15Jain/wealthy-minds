"""
Wealth projection endpoints.

Deterministic compound-growth scenarios plus a full Monte Carlo engine
(geometric Brownian motion, monthly steps, SIP + step-up + inflation).
"""

from dataclasses import asdict
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.quant import monte_carlo_projection, sip_future_value

router = APIRouter()

# Long-run Indian market assumptions per risk profile: effective annual
# return (CAGR) for the three deterministic scenarios, and the annualized
# volatility used by the Monte Carlo engine.
RETURN_RATES = {
    "conservative": {"optimistic": 0.10, "expected": 0.08, "conservative": 0.06},
    "moderate": {"optimistic": 0.12, "expected": 0.10, "conservative": 0.07},
    "balanced": {"optimistic": 0.14, "expected": 0.12, "conservative": 0.08},
    "growth": {"optimistic": 0.16, "expected": 0.14, "conservative": 0.09},
    "aggressive": {"optimistic": 0.18, "expected": 0.15, "conservative": 0.10},
}

VOLATILITY_BY_PROFILE = {
    "conservative": 0.06,
    "moderate": 0.09,
    "balanced": 0.12,
    "growth": 0.15,
    "aggressive": 0.19,
}


class ProjectionRequest(BaseModel):
    current_value: float = Field(ge=0, le=1e12)
    monthly_investment: float = Field(ge=0, le=1e9)
    years: int = Field(ge=1, le=60)
    risk_profile: str = Field(default="balanced")


class ProjectionPoint(BaseModel):
    year: int
    optimistic: float
    expected: float
    conservative: float
    sip_contribution: float
    lumpsum_growth: float


@router.post("", response_model=List[ProjectionPoint])
async def generate_projection(request: ProjectionRequest) -> List[ProjectionPoint]:
    """Deterministic three-scenario projection.

    Each scenario compounds at its effective annual rate (converted to a
    true geometric monthly rate) with annuity-due SIP contributions.
    """
    profile = request.risk_profile.lower()
    if profile not in RETURN_RATES:
        raise HTTPException(
            status_code=422,
            detail=f"risk_profile must be one of {sorted(RETURN_RATES)}",
        )
    rates = RETURN_RATES[profile]

    projections: List[ProjectionPoint] = []
    for year in range(1, request.years + 1):
        months = year * 12
        values = {}
        for scenario, annual_rate in rates.items():
            lumpsum = request.current_value * (1 + annual_rate) ** year
            sip_fv = sip_future_value(request.monthly_investment, annual_rate, months)
            values[scenario] = round(lumpsum + sip_fv, 2)

        projections.append(
            ProjectionPoint(
                year=year,
                optimistic=values["optimistic"],
                expected=values["expected"],
                conservative=values["conservative"],
                sip_contribution=round(request.monthly_investment * months, 2),
                lumpsum_growth=round(
                    request.current_value * ((1 + rates["expected"]) ** year - 1), 2
                ),
            )
        )

    return projections


class MonteCarloRequest(BaseModel):
    initial_investment: float = Field(default=0, ge=0, le=1e12)
    monthly_sip: float = Field(default=0, ge=0, le=1e9)
    years: int = Field(ge=1, le=60)
    risk_profile: str = Field(default="balanced")
    expected_cagr: Optional[float] = Field(default=None, ge=-0.5, le=1.0)
    annual_volatility: Optional[float] = Field(default=None, ge=0, le=1.0)
    annual_step_up: float = Field(default=0.0, ge=0, le=0.5)
    inflation_rate: float = Field(default=0.05, ge=0, le=0.25)
    target_amount: Optional[float] = Field(default=None, gt=0, le=1e13)
    simulations: int = Field(default=10_000, ge=1_000, le=50_000)
    seed: Optional[int] = Field(default=None, ge=0)


@router.post("/monte-carlo")
async def run_monte_carlo(request: MonteCarloRequest) -> dict:
    """Full Monte Carlo simulation of the wealth trajectory.

    ``expected_cagr`` / ``annual_volatility`` override the risk-profile
    defaults when provided (e.g. when the caller has fund-specific
    historical estimates).
    """
    profile = request.risk_profile.lower()
    if profile not in RETURN_RATES:
        raise HTTPException(
            status_code=422,
            detail=f"risk_profile must be one of {sorted(RETURN_RATES)}",
        )
    if request.initial_investment == 0 and request.monthly_sip == 0:
        raise HTTPException(
            status_code=422,
            detail="Provide an initial_investment and/or a monthly_sip",
        )

    cagr = (
        request.expected_cagr
        if request.expected_cagr is not None
        else RETURN_RATES[profile]["expected"]
    )
    vol = (
        request.annual_volatility
        if request.annual_volatility is not None
        else VOLATILITY_BY_PROFILE[profile]
    )

    result = monte_carlo_projection(
        initial_investment=request.initial_investment,
        monthly_sip=request.monthly_sip,
        years=request.years,
        expected_cagr=cagr,
        annual_volatility=vol,
        annual_step_up=request.annual_step_up,
        inflation_rate=request.inflation_rate,
        target_amount=request.target_amount,
        simulations=request.simulations,
        seed=request.seed,
    )
    payload = asdict(result)
    payload["assumptions"] = {
        "expected_cagr": cagr,
        "annual_volatility": vol,
        "inflation_rate": request.inflation_rate,
        "risk_profile": profile,
        "model": "GBM, monthly steps, annuity-due contributions",
    }
    return payload
