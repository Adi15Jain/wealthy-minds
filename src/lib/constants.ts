/**
 * Application-wide constants.
 * Centralized configuration for the WealthyMinds platform.
 */

export const APP_NAME = "WealthyMinds";
export const APP_DESCRIPTION =
    "An intelligent operating system for personal wealth. AI-powered portfolio cognition, behavioral intelligence, and long-term wealth creation.";
export const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Navigation Routes ────────────────────────────────────────
export const ROUTES = {
    // Public
    HOME: "/",
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        FORGOT_PASSWORD: "/auth/forgot-password",
    },
    ONBOARDING: "/onboarding",

    // Dashboard (Protected)
    DASHBOARD: "/dashboard",
    SIP_TRACKING: "/dashboard/sip-tracking", // Used as SIP Analyzer
    AI_INSIGHTS: "/dashboard/ai-insights", // Used as AI Chat Teller
    WEALTH_PROJECTION: "/dashboard/wealth-projection", // Used as SIP Projections
    SETTINGS: "/dashboard/settings",
    PROFILE: "/dashboard/profile",
} as const;

// ── API Endpoints ────────────────────────────────────────────
export const API_ROUTES = {
    AUTH: "/api/auth",
    PORTFOLIO: "/api/portfolio",
    MARKET: "/api/market",
    AI: "/api/ai",
    ANALYTICS: "/api/analytics",
    INSIGHTS: "/api/insights",
    REPORTS: "/api/reports",
    USER: "/api/user",
    GOALS: "/api/goals",
    JOURNAL: "/api/journal",
} as const;

// ── Design Tokens ────────────────────────────────────────────
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

export const ANIMATION_DURATION = {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    cinematic: 0.8,
} as const;

// ── Chart Colors — Premium muted palette ─────────────────────
export const CHART_COLORS = {
    primary: "hsl(217, 71%, 53%)",
    secondary: "hsl(271, 51%, 54%)",
    tertiary: "hsl(168, 50%, 47%)",
    quaternary: "hsl(37, 90%, 58%)",
    quinary: "hsl(340, 60%, 55%)",
    muted: "hsl(215, 20%, 65%)",
    positive: "hsl(152, 55%, 48%)",
    negative: "hsl(0, 55%, 55%)",
    neutral: "hsl(215, 15%, 55%)",
} as const;

// ── Finance Constants ────────────────────────────────────────
export const ASSET_CLASSES = [
    "Equity",
    "Debt",
    "Gold",
    "Real Estate",
    "Cash",
    "International",
    "Alternative",
] as const;

export const RISK_LEVELS = [
    "Conservative",
    "Moderate",
    "Balanced",
    "Growth",
    "Aggressive",
] as const;

export const GOAL_TYPES = [
    "Retirement",
    "Education",
    "House",
    "Emergency Fund",
    "Travel",
    "Vehicle",
    "Wedding",
    "Custom",
] as const;

export const INVESTMENT_TYPES = [
    "Mutual Fund",
    "Stock",
    "ETF",
    "Fixed Deposit",
    "PPF",
    "NPS",
    "Gold",
    "Bond",
    "REIT",
] as const;
