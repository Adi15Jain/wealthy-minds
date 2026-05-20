/**
 * Core domain types for the WealthyMinds platform.
 * Type-safe foundation for all data flows.
 */

// ── User & Auth ──────────────────────────────────────────────
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    onboardingComplete: boolean;
    riskProfile?: RiskProfile;
    preferences: UserPreferences;
    createdAt: string;
    updatedAt: string;
}

export interface UserPreferences {
    theme: "light" | "dark" | "system";
    currency: string;
    language: string;
    dashboardLayout: string[];
    notifications: NotificationPreferences;
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sip: boolean;
    goalMilestones: boolean;
    marketAlerts: boolean;
    aiInsights: boolean;
}

export type RiskProfile =
    | "conservative"
    | "moderate"
    | "balanced"
    | "growth"
    | "aggressive";

// ── Portfolio ────────────────────────────────────────────────
export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    holdings: Holding[];
    totalValue: number;
    totalInvested: number;
    totalReturns: number;
    returnPercentage: number;
    xirr: number;
    lastUpdated: string;
}

export interface Holding {
    id: string;
    portfolioId: string;
    name: string;
    ticker: string;
    type: InvestmentType;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    currentValue: number;
    investedValue: number;
    returns: number;
    returnPercentage: number;
    allocation: number;
    sector?: string;
    assetClass: AssetClass;
}

export type InvestmentType =
    | "mutual_fund"
    | "stock"
    | "etf"
    | "fixed_deposit"
    | "ppf"
    | "nps"
    | "gold"
    | "bond"
    | "reit";

export type AssetClass =
    | "equity"
    | "debt"
    | "gold"
    | "real_estate"
    | "cash"
    | "international"
    | "alternative";

// ── SIP ──────────────────────────────────────────────────────
export interface SIP {
    id: string;
    userId: string;
    holdingId: string;
    name: string;
    amount: number;
    frequency: "monthly" | "quarterly" | "yearly";
    startDate: string;
    nextDate: string;
    status: "active" | "paused" | "completed";
    totalInvested: number;
    currentValue: number;
}

// ── Goals ────────────────────────────────────────────────────
export interface Goal {
    id: string;
    userId: string;
    name: string;
    type: GoalType;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    monthlyContribution: number;
    progress: number;
    status: "on_track" | "behind" | "ahead" | "completed";
    linkedHoldings: string[];
    priority: "high" | "medium" | "low";
}

export type GoalType =
    | "retirement"
    | "education"
    | "house"
    | "emergency_fund"
    | "travel"
    | "vehicle"
    | "wedding"
    | "custom";

// ── Risk & Analytics ─────────────────────────────────────────
export interface RiskMetrics {
    overallRiskScore: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
    concentration: ConcentrationRisk;
    assetAllocation: AllocationBreakdown[];
    sectorExposure: SectorExposure[];
}

export interface ConcentrationRisk {
    topHoldingWeight: number;
    top5Weight: number;
    hhi: number; // Herfindahl-Hirschman Index
    level: "low" | "medium" | "high";
}

export interface AllocationBreakdown {
    assetClass: AssetClass;
    currentWeight: number;
    targetWeight: number;
    deviation: number;
    value: number;
}

export interface SectorExposure {
    sector: string;
    weight: number;
    value: number;
}

// ── AI Insights ──────────────────────────────────────────────
export interface AIInsight {
    id: string;
    userId: string;
    type: InsightType;
    title: string;
    summary: string;
    detail: string;
    severity: "info" | "warning" | "action" | "positive";
    category: string;
    confidence: number;
    createdAt: string;
    isRead: boolean;
    actionable: boolean;
    metadata?: Record<string, unknown>;
}

export type InsightType =
    | "portfolio_summary"
    | "behavioral_observation"
    | "risk_narrative"
    | "recommendation"
    | "optimization"
    | "market_context"
    | "goal_update";

// ── Journal ──────────────────────────────────────────────────
export interface JournalEntry {
    id: string;
    userId: string;
    title: string;
    content: string;
    mood: "confident" | "anxious" | "neutral" | "excited" | "fearful";
    tags: string[];
    linkedDecisions: string[];
    createdAt: string;
    updatedAt: string;
}

// ── Wealth Projection ────────────────────────────────────────
export interface WealthProjection {
    year: number;
    optimistic: number;
    expected: number;
    conservative: number;
    sipContribution: number;
    lumpsumGrowth: number;
}

// ── Behavioral Analytics ─────────────────────────────────────
export interface BehavioralMetric {
    id: string;
    userId: string;
    metric: string;
    score: number;
    trend: "improving" | "declining" | "stable";
    observations: string[];
    period: string;
}

// ── API Response Types ───────────────────────────────────────
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    timestamp: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// ── Dashboard Widget ─────────────────────────────────────────
export interface DashboardWidget {
    id: string;
    type: WidgetType;
    title: string;
    size: "sm" | "md" | "lg" | "xl";
    position: { x: number; y: number };
    config?: Record<string, unknown>;
}

export type WidgetType =
    | "portfolio_value"
    | "returns_chart"
    | "allocation_pie"
    | "sip_tracker"
    | "goal_progress"
    | "ai_insight"
    | "risk_score"
    | "net_worth"
    | "recent_activity"
    | "market_pulse";

// ── Market Data ──────────────────────────────────────────────
export interface MarketIndex {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
}

export interface MarketDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
