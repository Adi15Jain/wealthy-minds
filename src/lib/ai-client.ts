import { env } from "@/lib/env";
import { AiError } from "@/lib/ai-errors";
import { geminiGenerate, hasGeminiKey, type AiCallOptions } from "@/lib/gemini";
import { openAiCompatibleGenerate } from "@/lib/openai-provider";

/**
 * Multi-provider AI client with automatic fallback.
 *
 * Every AI call in the app goes through here. Providers are tried in the order
 * given by AI_PROVIDER_ORDER (default: groq, gemini, openrouter); the first
 * configured provider that returns a usable result wins. If a provider is
 * unconfigured, rate-limited, times out, or returns unparseable JSON, we move
 * to the next — so hitting one free tier's limit doesn't take the app down.
 *
 * Groq (Llama 3.3 70B) is a free, fast, accurate default; Gemini and OpenRouter
 * are drop-in alternates. All are OpenAI-compatible except Gemini.
 */

export type { AiCallOptions };

interface Provider {
    name: string;
    isConfigured: () => boolean;
    generate: (prompt: string, opts: AiCallOptions) => Promise<string>;
}

const PROVIDERS: Record<string, Provider> = {
    groq: {
        name: "groq",
        isConfigured: () => env.GROQ_API_KEY.length > 0,
        generate: (prompt, opts) =>
            openAiCompatibleGenerate(
                {
                    name: "groq",
                    baseUrl: "https://api.groq.com/openai/v1",
                    apiKey: env.GROQ_API_KEY,
                    model: env.GROQ_MODEL,
                },
                prompt,
                opts,
            ),
    },
    openrouter: {
        name: "openrouter",
        isConfigured: () => env.OPENROUTER_API_KEY.length > 0,
        generate: (prompt, opts) =>
            openAiCompatibleGenerate(
                {
                    name: "openrouter",
                    baseUrl: "https://openrouter.ai/api/v1",
                    apiKey: env.OPENROUTER_API_KEY,
                    model: env.OPENROUTER_MODEL,
                    extraHeaders: { "X-Title": "WealthyMinds" },
                },
                prompt,
                opts,
            ),
    },
    gemini: {
        name: "gemini",
        isConfigured: hasGeminiKey,
        generate: geminiGenerate,
    },
};

function configuredProviders(): Provider[] {
    const order = env.AI_PROVIDER_ORDER.split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s in PROVIDERS);
    const seen = new Set<string>();
    const providers: Provider[] = [];
    for (const name of order) {
        if (seen.has(name)) continue;
        seen.add(name);
        const p = PROVIDERS[name];
        if (p.isConfigured()) providers.push(p);
    }
    return providers;
}

/** True if at least one AI provider is configured. */
export function hasAiProvider(): boolean {
    return configuredProviders().length > 0;
}

/** Names of the providers that will be attempted, in order. */
export function activeProviders(): string[] {
    return configuredProviders().map((p) => p.name);
}

async function runWithFallback<T>(
    task: (provider: Provider) => Promise<T>,
): Promise<T> {
    const providers = configuredProviders();
    if (providers.length === 0) {
        throw new AiError("none", "NO_KEY", "No AI provider is configured");
    }
    let lastError: unknown;
    for (const provider of providers) {
        try {
            return await task(provider);
        } catch (error) {
            lastError = error;
            const reason =
                error instanceof AiError ? `${error.code}` : "unknown error";
            console.error(`[ai] ${provider.name} failed (${reason}); trying next`);
        }
    }
    throw lastError;
}

/** Generate free-form text, with provider fallback. */
export function generateText(
    prompt: string,
    opts: AiCallOptions = {},
): Promise<string> {
    return runWithFallback((provider) => provider.generate(prompt, opts));
}

function stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    return match?.[1] ?? trimmed;
}

/**
 * Generate and parse a JSON response, with provider fallback. A provider whose
 * output won't parse is treated like any other failure — the next provider is
 * tried before giving up.
 */
export function generateJson<T>(
    prompt: string,
    opts: Omit<AiCallOptions, "json"> = {},
): Promise<T> {
    return runWithFallback(async (provider) => {
        const text = await provider.generate(prompt, { ...opts, json: true });
        try {
            return JSON.parse(stripMarkdownFences(text)) as T;
        } catch {
            throw new AiError(provider.name, "PARSE", `${provider.name} returned malformed JSON`);
        }
    });
}

/**
 * Coerce a parsed JSON value into an array. OpenAI-compatible JSON mode (Groq,
 * OpenRouter) can only return an *object*, so a requested list comes back
 * wrapped, e.g. `{"funds": [...]}`. Gemini can return a bare `[...]`. This
 * accepts both: a bare array, or the first array-valued property of an object.
 */
function coerceArray<T>(parsed: unknown): T[] | null {
    if (Array.isArray(parsed)) return parsed as T[];
    if (parsed && typeof parsed === "object") {
        const arrayValue = Object.values(parsed as Record<string, unknown>).find(
            (v) => Array.isArray(v),
        );
        if (arrayValue) return arrayValue as T[];
    }
    return null;
}

/**
 * Like generateJson, but always yields an array — transparently unwrapping the
 * object envelope that OpenAI-compatible JSON mode adds around lists. Use this
 * for any route that expects a JSON array from the model.
 */
export function generateJsonArray<T>(
    prompt: string,
    opts: Omit<AiCallOptions, "json"> = {},
): Promise<T[]> {
    return runWithFallback(async (provider) => {
        const text = await provider.generate(prompt, { ...opts, json: true });
        let parsed: unknown;
        try {
            parsed = JSON.parse(stripMarkdownFences(text));
        } catch {
            throw new AiError(provider.name, "PARSE", `${provider.name} returned malformed JSON`);
        }
        const array = coerceArray<T>(parsed);
        if (!array) {
            throw new AiError(provider.name, "PARSE", `${provider.name} did not return a JSON array`);
        }
        return array;
    });
}
