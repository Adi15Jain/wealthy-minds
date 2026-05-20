/**
 * Portfolio state slice — manages portfolio data.
 */
import { create } from "zustand";
import type { Portfolio, Holding } from "@/types";

interface PortfolioState {
    portfolios: Portfolio[];
    activePortfolio: Portfolio | null;
    holdings: Holding[];
    isLoading: boolean;
    error: string | null;

    // Actions
    setPortfolios: (portfolios: Portfolio[]) => void;
    setActivePortfolio: (portfolio: Portfolio) => void;
    setHoldings: (holdings: Holding[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState>()((set) => ({
    portfolios: [],
    activePortfolio: null,
    holdings: [],
    isLoading: false,
    error: null,

    setPortfolios: (portfolios) => set({ portfolios }),
    setActivePortfolio: (activePortfolio) => set({ activePortfolio }),
    setHoldings: (holdings) => set({ holdings }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
