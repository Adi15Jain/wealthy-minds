/**
 * Environment configuration with runtime validation.
 * Ensures all required environment variables are present and typed.
 */

function getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key] ?? fallback;
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
}

function getOptionalEnvVar(key: string, fallback = ""): string {
    return process.env[key] ?? fallback;
}

export const env = {
    // ── App ──────────────────────────────────────────────
    NODE_ENV: getEnvVar("NODE_ENV", "development"),
    APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),

    // ── Database ─────────────────────────────────────────
    DATABASE_URL: getOptionalEnvVar("DATABASE_URL"),

    // ── Auth ─────────────────────────────────────────────
    AUTH_SECRET: getOptionalEnvVar("AUTH_SECRET"),
    GOOGLE_CLIENT_ID: getOptionalEnvVar("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: getOptionalEnvVar("GOOGLE_CLIENT_SECRET"),

    // ── AI ───────────────────────────────────────────────
    GOOGLE_AI_API_KEY: getOptionalEnvVar("GOOGLE_AI_API_KEY"),

    // ── Analytics Service ────────────────────────────────
    ANALYTICS_SERVICE_URL: getOptionalEnvVar(
        "ANALYTICS_SERVICE_URL",
        "http://localhost:8000",
    ),

    // ── Market Data ──────────────────────────────────────
    GROWW_API_KEY: getOptionalEnvVar("GROWW_API_KEY"),
    GROWW_API_SECRET: getOptionalEnvVar("GROWW_API_SECRET"),

    // ── Feature Flags ────────────────────────────────────
    ENABLE_AI_INSIGHTS:
        getOptionalEnvVar("NEXT_PUBLIC_ENABLE_AI_INSIGHTS", "true") === "true",
    ENABLE_3D_VISUALS:
        getOptionalEnvVar("NEXT_PUBLIC_ENABLE_3D_VISUALS", "true") === "true",
    ENABLE_ANALYTICS:
        getOptionalEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", "true") === "true",
} as const;
