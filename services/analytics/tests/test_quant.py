"""Unit tests for the quantitative core (app/core/quant.py)."""

import math
from datetime import date

import numpy as np
import pytest

from app.core.quant import (
    absolute_return,
    annualized_return,
    annualized_volatility,
    beta_alpha,
    cagr,
    effective_monthly_rate,
    herfindahl_index,
    inflation_adjusted,
    lumpsum_future_value,
    max_drawdown,
    monte_carlo_projection,
    real_rate,
    returns_from_prices,
    rolling_returns,
    sharpe_ratio,
    sip_future_value,
    sip_total_invested,
    sortino_ratio,
    step_up_sip_future_value,
    xirr,
)


class TestReturns:
    def test_absolute_return(self):
        assert absolute_return(100, 150) == pytest.approx(0.5)

    def test_cagr_doubling_in_six_years(self):
        # Rule of 72 sanity: doubling in 6 years ~ 12.25% CAGR
        assert cagr(100, 200, 6) == pytest.approx(0.1225, abs=1e-3)

    def test_cagr_matches_annualized_return(self):
        assert cagr(100, 180, 4) == pytest.approx(annualized_return(0.8, 4))

    def test_effective_monthly_rate_compounds_to_annual(self):
        r = effective_monthly_rate(0.12)
        assert (1 + r) ** 12 == pytest.approx(1.12)
        # And it must be lower than the naive nominal/12.
        assert r < 0.12 / 12

    def test_returns_from_prices(self):
        np.testing.assert_allclose(
            returns_from_prices([100, 110, 99]), [0.10, -0.10]
        )

    def test_rolling_returns_flat_growth(self):
        prices = [100 * 1.01**i for i in range(25)]
        rr = rolling_returns(prices, window=12, periods_per_year=12)
        assert rr[0] == pytest.approx(1.01**12 - 1, rel=1e-9)


class TestXIRR:
    def test_single_year_lumpsum(self):
        flows = [(date(2020, 1, 1), -1000), (date(2021, 1, 1), 1100)]
        assert xirr(flows) == pytest.approx(0.10, abs=1e-3)

    def test_monthly_sip_xirr_positive(self):
        flows = [(date(2020, m, 1), -1000) for m in range(1, 13)]
        flows.append((date(2021, 1, 1), 13000))
        result = xirr(flows)
        assert 0.10 < result < 0.35

    def test_requires_sign_change(self):
        with pytest.raises(ValueError):
            xirr([(date(2020, 1, 1), -100), (date(2021, 1, 1), -100)])


class TestRiskMetrics:
    def test_volatility_annualization(self):
        rng = np.random.default_rng(7)
        monthly = rng.normal(0.01, 0.04, size=600)
        vol = annualized_volatility(monthly, periods_per_year=12)
        assert vol == pytest.approx(0.04 * math.sqrt(12), rel=0.1)

    def test_sharpe_zero_for_risk_free_returns(self):
        rf_monthly = (1 + 0.065) ** (1 / 12) - 1
        returns = [rf_monthly] * 24
        assert sharpe_ratio(returns, risk_free_rate=0.065) == 0.0

    def test_sortino_exceeds_sharpe_for_skewed_series(self):
        rng = np.random.default_rng(3)
        returns = rng.normal(0.012, 0.03, size=240)
        assert sortino_ratio(returns) > sharpe_ratio(returns)

    def test_max_drawdown_known_series(self):
        # Peak 120 -> trough 84 is a 30% drawdown.
        prices = [100, 120, 96, 84, 110, 130]
        assert max_drawdown(prices) == pytest.approx(-0.30)

    def test_max_drawdown_monotonic_series_is_zero(self):
        assert max_drawdown([1, 2, 3, 4]) == 0.0

    def test_beta_of_leveraged_benchmark(self):
        rng = np.random.default_rng(11)
        bench = rng.normal(0.008, 0.04, size=360)
        portfolio = 1.5 * bench
        beta, _ = beta_alpha(portfolio, bench)
        assert beta == pytest.approx(1.5, rel=1e-6)

    def test_alpha_of_constant_outperformance(self):
        rng = np.random.default_rng(13)
        bench = rng.normal(0.008, 0.04, size=360)
        monthly_alpha = 0.002
        portfolio = bench + monthly_alpha
        beta, alpha = beta_alpha(portfolio, bench)
        assert beta == pytest.approx(1.0, rel=1e-6)
        assert alpha == pytest.approx((1 + monthly_alpha) ** 12 - 1, rel=1e-6)

    def test_hhi_bounds(self):
        assert herfindahl_index([100]) == 1.0
        assert herfindahl_index([25, 25, 25, 25]) == pytest.approx(0.25)


class TestSIP:
    def test_sip_fv_zero_rate(self):
        assert sip_future_value(1000, 0.0, 24) == 24000

    def test_sip_fv_closed_form(self):
        r = effective_monthly_rate(0.12)
        expected = 5000 * (((1 + r) ** 120 - 1) / r) * (1 + r)
        assert sip_future_value(5000, 0.12, 120) == pytest.approx(expected)

    def test_sip_fv_exceeds_principal_at_positive_rate(self):
        assert sip_future_value(1000, 0.10, 120) > 120_000

    def test_step_up_zero_equals_flat_sip(self):
        flat = sip_future_value(2000, 0.12, 60)
        stepped = step_up_sip_future_value(2000, 0.12, 5, annual_step_up=0.0)
        assert stepped == pytest.approx(flat, rel=1e-9)

    def test_step_up_increases_fv(self):
        base = step_up_sip_future_value(2000, 0.12, 10, 0.0)
        stepped = step_up_sip_future_value(2000, 0.12, 10, 0.10)
        assert stepped > base * 1.2

    def test_sip_total_invested_with_step_up(self):
        # 1000/mo year one, 1100/mo year two.
        assert sip_total_invested(1000, 2, 0.10) == pytest.approx(12000 + 13200)

    def test_lumpsum_fv(self):
        assert lumpsum_future_value(1_00_000, 0.12, 10) == pytest.approx(
            1_00_000 * 1.12**10
        )


class TestInflation:
    def test_inflation_adjusted(self):
        assert inflation_adjusted(200, 0.05, 0) == 200
        assert inflation_adjusted(100 * 1.05**10, 0.05, 10) == pytest.approx(100)

    def test_real_rate_fisher(self):
        assert real_rate(0.12, 0.05) == pytest.approx(1.12 / 1.05 - 1)


class TestMonteCarlo:
    def test_zero_volatility_matches_deterministic(self):
        res = monte_carlo_projection(
            initial_investment=100_000,
            monthly_sip=0,
            years=10,
            expected_cagr=0.12,
            annual_volatility=0.0,
            simulations=500,
            seed=1,
        )
        assert res.median == pytest.approx(100_000 * 1.12**10, rel=1e-6)
        assert res.percentiles["p10"] == pytest.approx(res.percentiles["p90"])

    def test_median_near_expected_cagr_with_volatility(self):
        res = monte_carlo_projection(
            initial_investment=1_000_000,
            monthly_sip=0,
            years=15,
            expected_cagr=0.12,
            annual_volatility=0.15,
            simulations=20_000,
            seed=42,
        )
        deterministic = 1_000_000 * 1.12**15
        # Median of GBM = exp(mu - sigma^2/2): below the mean, near CAGR path.
        assert res.median == pytest.approx(
            deterministic * math.exp(-0.5 * 0.15**2 * 15), rel=0.05
        )
        assert res.expected_value == pytest.approx(deterministic, rel=0.05)

    def test_percentiles_ordered(self):
        res = monte_carlo_projection(
            initial_investment=0,
            monthly_sip=10_000,
            years=20,
            expected_cagr=0.12,
            annual_volatility=0.15,
            simulations=2_000,
            seed=7,
        )
        p = res.percentiles
        assert p["p10"] < p["p25"] < p["p50"] < p["p75"] < p["p90"]
        assert res.worst_case < p["p10"]
        assert res.best_case > p["p90"]

    def test_total_invested_with_step_up(self):
        res = monte_carlo_projection(
            initial_investment=50_000,
            monthly_sip=1_000,
            years=2,
            expected_cagr=0.10,
            annual_volatility=0.10,
            annual_step_up=0.10,
            simulations=500,
            seed=3,
        )
        assert res.total_invested == pytest.approx(50_000 + 12_000 + 13_200)

    def test_yearly_bands_and_paths_shape(self):
        res = monte_carlo_projection(
            initial_investment=10_000,
            monthly_sip=5_000,
            years=5,
            expected_cagr=0.12,
            annual_volatility=0.12,
            simulations=1_000,
            seed=9,
        )
        assert len(res.yearly) == 5
        assert all(len(path) == 6 for path in res.sample_paths)  # year 0..5
        assert sum(b["count"] for b in res.distribution) == 1_000

    def test_target_probability_bounds(self):
        res = monte_carlo_projection(
            initial_investment=100_000,
            monthly_sip=10_000,
            years=10,
            expected_cagr=0.12,
            annual_volatility=0.15,
            target_amount=1,  # trivially reachable
            simulations=500,
            seed=5,
        )
        assert res.probability_of_target == 1.0

    def test_seed_reproducibility(self):
        kwargs = dict(
            initial_investment=100_000, monthly_sip=2_000, years=8,
            expected_cagr=0.11, annual_volatility=0.14,
            simulations=1_000, seed=123,
        )
        a = monte_carlo_projection(**kwargs)
        b = monte_carlo_projection(**kwargs)
        assert a.median == b.median
        assert a.percentiles == b.percentiles

    def test_rejects_invalid_input(self):
        with pytest.raises(ValueError):
            monte_carlo_projection(0, 0, 10, 0.12, 0.15, simulations=1_000)
        with pytest.raises(ValueError):
            monte_carlo_projection(1000, 0, 0, 0.12, 0.15, simulations=1_000)
