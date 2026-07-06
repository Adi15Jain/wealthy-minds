import { env } from "@/lib/env";
import { AiError } from "@/lib/ai-errors";

/**
 * Google Gemini provider (native generateContent format).
 *
 * One of several providers behind the orchestrator in `src/lib/ai-client.ts`.
 * The API key travels in the x-goog-api-key header (never the URL); calls have
 * an AbortController timeout and retry once on 429/5xx. "Thinking" is disabled —
 * these are extraction/advisory tasks that don't need it, and it ~halves latency.
 */

export interface AiCallOptions {
    history?: { role: string; text: string }[];
    json?: boolean;
    timeoutMs?: number;
}

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`;
const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_BACKOFF_MS = 500;

interface GeminiApiResponse {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export function hasGeminiKey(): boolean {
    return env.GOOGLE_AI_API_KEY.length > 0;
}

async function fetchOnce(body: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(GEMINI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": env.GOOGLE_AI_API_KEY,
            },
            body,
            signal: controller.signal,
        });
    } catch {
        if (controller.signal.aborted) {
            throw new AiError("gemini", "TIMEOUT", `Gemini timed out after ${timeoutMs}ms`);
        }
        throw new AiError("gemini", "UPSTREAM", "Gemini failed to connect");
    } finally {
        clearTimeout(timer);
    }
}

/** Generate raw text from Gemini. Throws AiError on any failure. */
export async function geminiGenerate(
    prompt: string,
    opts: AiCallOptions = {},
): Promise<string> {
    if (!hasGeminiKey()) {
        throw new AiError("gemini", "NO_KEY", "Gemini API key is not configured");
    }

    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const message of opts.history ?? []) {
        contents.push({
            role: message.role === "user" ? "user" : "model",
            parts: [{ text: message.text }],
        });
    }
    contents.push({ role: "user", parts: [{ text: prompt }] });

    const generationConfig: Record<string, unknown> = {
        thinkingConfig: { thinkingBudget: 0 },
    };
    if (opts.json) generationConfig.responseMimeType = "application/json";
    const body = JSON.stringify({ contents, generationConfig });

    let response = await fetchOnce(body, timeoutMs);
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
        response = await fetchOnce(body, timeoutMs);
    }
    if (!response.ok) {
        const code = response.status === 429 ? "RATE_LIMIT" : "UPSTREAM";
        throw new AiError("gemini", code, `Gemini responded with status ${response.status}`);
    }

    let data: GeminiApiResponse;
    try {
        data = (await response.json()) as GeminiApiResponse;
    } catch {
        throw new AiError("gemini", "UPSTREAM", "Gemini returned a non-JSON response");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AiError("gemini", "UPSTREAM", "Gemini returned an empty response");
    return text;
}
