/**
 * Analytics service — interfaces with the Python FastAPI analytics microservice.
 */
import { apiClient } from "./api-client";
import { API_ROUTES } from "@/lib/constants";
import type { RiskMetrics, WealthProjection, BehavioralMetric } from "@/types";

export const analyticsService = {
    getRiskMetrics: (portfolioId: string) =>
        apiClient.get<RiskMetrics>(
            `${API_ROUTES.ANALYTICS}/risk/${portfolioId}`,
        ),

    getWealthProjection: (params: {
        currentValue: number;
        monthlyInvestment: number;
        years: number;
        riskProfile: string;
    }) =>
        apiClient.post<WealthProjection[]>(
            `${API_ROUTES.ANALYTICS}/projection`,
            params,
        ),

    getBehavioralMetrics: (userId: string) =>
        apiClient.get<BehavioralMetric[]>(
            `${API_ROUTES.ANALYTICS}/behavioral/${userId}`,
        ),

    getAllocationSuggestion: (portfolioId: string) =>
        apiClient.get<{
            current: Record<string, number>;
            suggested: Record<string, number>;
            reasoning: string;
        }>(`${API_ROUTES.ANALYTICS}/allocation/${portfolioId}`),
};
