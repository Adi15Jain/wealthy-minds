/**
 * AI service — handles AI insight generation and retrieval.
 */
import { apiClient } from "./api-client";
import { API_ROUTES } from "@/lib/constants";
import type { AIInsight } from "@/types";

export const aiService = {
  getInsights: (params?: { limit?: number; type?: string }) =>
    apiClient.get<AIInsight[]>(API_ROUTES.AI + "/insights", { params }),

  getInsightById: (id: string) =>
    apiClient.get<AIInsight>(`${API_ROUTES.AI}/insights/${id}`),

  generatePortfolioSummary: (portfolioId: string) =>
    apiClient.post<AIInsight>(`${API_ROUTES.AI}/summary`, { portfolioId }),

  generateRiskNarrative: (portfolioId: string) =>
    apiClient.post<AIInsight>(`${API_ROUTES.AI}/risk-narrative`, { portfolioId }),

  chat: (message: string, context?: Record<string, unknown>) =>
    apiClient.post<{ response: string; sources: string[] }>(
      `${API_ROUTES.AI}/chat`,
      { message, context }
    ),

  markInsightRead: (id: string) =>
    apiClient.patch<void>(`${API_ROUTES.AI}/insights/${id}/read`),
};
