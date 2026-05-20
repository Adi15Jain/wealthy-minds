/**
 * Market service — handles market data fetching and caching.
 */
import { apiClient } from "./api-client";
import { API_ROUTES } from "@/lib/constants";
import type { MarketIndex, MarketDataPoint } from "@/types";

export const marketService = {
    getIndices: () =>
        apiClient.get<MarketIndex[]>(`${API_ROUTES.MARKET}/indices`),

    getQuote: (ticker: string) =>
        apiClient.get<MarketDataPoint>(`${API_ROUTES.MARKET}/quote/${ticker}`),

    getHistorical: (
        ticker: string,
        params?: { period?: string; interval?: string },
    ) =>
        apiClient.get<MarketDataPoint[]>(
            `${API_ROUTES.MARKET}/historical/${ticker}`,
            { params },
        ),

    search: (query: string) =>
        apiClient.get<Array<{ ticker: string; name: string; type: string }>>(
            `${API_ROUTES.MARKET}/search`,
            { params: { q: query } },
        ),
};
