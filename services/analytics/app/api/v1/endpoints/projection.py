"""
Wealth projection endpoints.
Monte Carlo simulations and compound growth modeling.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import math

router = APIRouter()


class ProjectionRequest(BaseModel):
    current_value: float
    monthly_investment: float
    years: int
    risk_profile: str  # conservative, moderate, balanced, growth, aggressive


class ProjectionPoint(BaseModel):
    year: int
    optimistic: float
    expected: float
    conservative: float
    sip_contribution: float
    lumpsum_growth: float


RETURN_RATES = {
    "conservative": {"optimistic": 0.10, "expected": 0.08, "conservative": 0.06},
    "moderate": {"optimistic": 0.12, "expected": 0.10, "conservative": 0.07},
    "balanced": {"optimistic": 0.14, "expected": 0.12, "conservative": 0.08},
    "growth": {"optimistic": 0.16, "expected": 0.14, "conservative": 0.09},
    "aggressive": {"optimistic": 0.18, "expected": 0.15, "conservative": 0.10},
}


@router.post("")
async def generate_projection(request: ProjectionRequest):
    """
    Generate wealth projection with optimistic, expected, and conservative scenarios.
    
    Uses compound interest formula with monthly SIP contributions.
    Future: Add Monte Carlo simulation for probability distributions.
    """
    rates = RETURN_RATES.get(request.risk_profile, RETURN_RATES["balanced"])
    projections: List[dict] = []
    
    for year in range(1, request.years + 1):
        result = {}
        for scenario, annual_rate in rates.items():
            monthly_rate = annual_rate / 12
            months = year * 12
            
            # Lumpsum growth
            lumpsum = request.current_value * ((1 + monthly_rate) ** months)
            
            # SIP future value
            if monthly_rate > 0:
                sip_fv = request.monthly_investment * (
                    ((1 + monthly_rate) ** months - 1) / monthly_rate
                ) * (1 + monthly_rate)
            else:
                sip_fv = request.monthly_investment * months
            
            result[scenario] = round(lumpsum + sip_fv, 2)
        
        projections.append({
            "year": year,
            "optimistic": result["optimistic"],
            "expected": result["expected"],
            "conservative": result["conservative"],
            "sip_contribution": request.monthly_investment * year * 12,
            "lumpsum_growth": round(
                request.current_value * ((1 + rates["expected"] / 12) ** (year * 12)) - request.current_value,
                2,
            ),
        })
    
    return projections
