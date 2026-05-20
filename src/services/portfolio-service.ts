/**
 * Portfolio service — handles all portfolio-related API calls.
 */
import { apiClient } from "./api-client";
import { API_ROUTES } from "@/lib/constants";
import type { Portfolio, Holding } from "@/types";

export const portfolioService = {
  getAll: () =>
    apiClient.get<Portfolio[]>(API_ROUTES.PORTFOLIO),

  getById: (id: string) =>
    apiClient.get<Portfolio>(`${API_ROUTES.PORTFOLIO}/${id}`),

  getHoldings: (portfolioId: string) =>
    apiClient.get<Holding[]>(`${API_ROUTES.PORTFOLIO}/${portfolioId}/holdings`),

  create: (data: Partial<Portfolio>) =>
    apiClient.post<Portfolio>(API_ROUTES.PORTFOLIO, data),

  update: (id: string, data: Partial<Portfolio>) =>
    apiClient.put<Portfolio>(`${API_ROUTES.PORTFOLIO}/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`${API_ROUTES.PORTFOLIO}/${id}`),

  sync: (id: string) =>
    apiClient.post<Portfolio>(`${API_ROUTES.PORTFOLIO}/${id}/sync`),
};
