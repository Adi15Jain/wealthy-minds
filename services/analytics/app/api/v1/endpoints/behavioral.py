"""
Behavioral analytics endpoints.
Tracks investing psychology, decision patterns, and discipline scores.
"""

from fastapi import APIRouter
from typing import List

router = APIRouter()


@router.get("/{user_id}")
async def get_behavioral_metrics(user_id: str):
    """
    Compute behavioral analytics for a user.
    
    TODO: Implement actual computation using:
    - Transaction history patterns
    - Holding period analysis
    - SIP consistency tracking
    - Decision timing analysis
    - Emotional correlation with market events
    """
    return [
        {
            "id": "inv-discipline",
            "metric": "Investment Discipline",
            "score": 92,
            "trend": "improving",
            "observations": [
                "Consistent SIP execution for 18 months",
                "No panic selling during market corrections",
            ],
            "period": "2026-Q2",
        },
        {
            "id": "loss-aversion",
            "metric": "Loss Aversion",
            "score": 35,
            "trend": "stable",
            "observations": [
                "Holding losing positions 2x longer than winners",
                "Consider setting predefined exit criteria",
            ],
            "period": "2026-Q2",
        },
        {
            "id": "patience",
            "metric": "Patience Score",
            "score": 88,
            "trend": "improving",
            "observations": [
                "Average holding period increased to 3.2 years",
                "Minimal churning in last 6 months",
            ],
            "period": "2026-Q2",
        },
        {
            "id": "diversification",
            "metric": "Diversification Awareness",
            "score": 71,
            "trend": "stable",
            "observations": [
                "Good cross-asset diversification",
                "Sector concentration in IT remains high",
            ],
            "period": "2026-Q2",
        },
    ]
