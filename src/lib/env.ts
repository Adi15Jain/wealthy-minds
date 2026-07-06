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

// ── Required-in-production validation ────────────────────────
// Fail fast at boot in production; warn (once, at module load) in dev so
// local DX is preserved with degraded features.
const REQUIRED_IN_PROD: Array<{ key: string; degrades: string }> = [
    { key: "AUTH_SECRET", degrades: "sessions cannot be signed — auth is disabled/insecure" },
    { key: "DATABASE_URL", degrades: "database access (accounts, portfolios) is unavailable" },
];

for (const { key, degrades } of REQUIRED_IN_PROD) {
    if (!process.env[key]) {
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                `Missing required environment variable in production: ${key}`,
            );
        }
        console.warn(`[env] ${key} is not set — ${degrades}.`);
    }
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
    // Providers are tried in AI_PROVIDER_ORDER; the first configured one that
    // succeeds wins, with automatic fallback on rate-limit/quota/timeout.
    AI_PROVIDER_ORDER: getOptionalEnvVar(
        "AI_PROVIDER_ORDER",
        "groq,gemini,openrouter",
    ),

    // Groq — free, fast (Llama 3.3 70B). Key: https://console.groq.com/keys
    GROQ_API_KEY: getOptionalEnvVar("GROQ_API_KEY"),
    GROQ_MODEL: getOptionalEnvVar("GROQ_MODEL", "llama-3.3-70b-versatile"),

    // OpenRouter — free models via one key. https://openrouter.ai/keys
    OPENROUTER_API_KEY: getOptionalEnvVar("OPENROUTER_API_KEY"),
    OPENROUTER_MODEL: getOptionalEnvVar(
        "OPENROUTER_MODEL",
        "meta-llama/llama-3.3-70b-instruct:free",
    ),

    // Google Gemini (AI Studio). gemini-2.0-flash has no free-tier quota on
    // newer keys; the free tier also caps daily requests.
    GOOGLE_AI_API_KEY: getOptionalEnvVar("GOOGLE_AI_API_KEY"),
    GEMINI_MODEL: getOptionalEnvVar("GEMINI_MODEL", "gemini-2.5-flash"),

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
