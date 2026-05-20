/**
 * Insights state slice — manages AI insights and notifications.
 */
import { create } from "zustand";
import type { AIInsight } from "@/types";

interface InsightsState {
    insights: AIInsight[];
    unreadCount: number;
    isLoading: boolean;
    selectedInsight: AIInsight | null;

    // Actions
    setInsights: (insights: AIInsight[]) => void;
    addInsight: (insight: AIInsight) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    setSelectedInsight: (insight: AIInsight | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useInsightsStore = create<InsightsState>()((set) => ({
    insights: [],
    unreadCount: 0,
    isLoading: false,
    selectedInsight: null,

    setInsights: (insights) =>
        set({
            insights,
            unreadCount: insights.filter((i) => !i.isRead).length,
        }),

    addInsight: (insight) =>
        set((state) => ({
            insights: [insight, ...state.insights],
            unreadCount: state.unreadCount + (insight.isRead ? 0 : 1),
        })),

    markAsRead: (id) =>
        set((state) => ({
            insights: state.insights.map((i) =>
                i.id === id ? { ...i, isRead: true } : i,
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),

    markAllAsRead: () =>
        set((state) => ({
            insights: state.insights.map((i) => ({ ...i, isRead: true })),
            unreadCount: 0,
        })),

    setSelectedInsight: (selectedInsight) => set({ selectedInsight }),
    setLoading: (isLoading) => set({ isLoading }),
}));
