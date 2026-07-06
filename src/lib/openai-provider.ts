import { AiError } from "@/lib/ai-errors";
import type { AiCallOptions } from "@/lib/gemini";

/**
 * Generic OpenAI-compatible chat provider — covers Groq, OpenRouter, Together,
 * local Ollama, and anything else exposing `/chat/completions`. Each concrete
 * provider is just a base URL + key + model.
 */

export interface OpenAiCompatibleConfig {
    name: string;
    baseUrl: string; // e.g. https://api.groq.com/openai/v1
    apiKey: string;
    model: string;
    /** Extra headers (OpenRouter likes HTTP-Referer / X-Title). */
    extraHeaders?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 15_000;

interface ChatCompletionResponse {
    choices?: Array<{ message?: { content?: string } }>;
}

export async function openAiCompatibleGenerate(
    config: OpenAiCompatibleConfig,
    prompt: string,
    opts: AiCallOptions = {},
): Promise<string> {
    if (!config.apiKey) {
        throw new AiError(config.name, "NO_KEY", `${config.name} API key is not configured`);
    }

    const messages: Array<{ role: string; content: string }> = [];
    for (const message of opts.history ?? []) {
        messages.push({
            role: message.role === "user" ? "user" : "assistant",
            content: message.text,
        });
    }
    messages.push({ role: "user", content: prompt });

    const body: Record<string, unknown> = {
        model: config.model,
        messages,
        temperature: 0.4,
    };
    // OpenAI-compatible JSON mode. Providers require the word "json" in the
    // prompt; ours already ask for JSON explicitly.
    if (opts.json) body.response_format = { type: "json_object" };

    const controller = new AbortController();
    const timer = setTimeout(
        () => controller.abort(),
        opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    let response: Response;
    try {
        response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
                ...config.extraHeaders,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch {
        if (controller.signal.aborted) {
            throw new AiError(config.name, "TIMEOUT", `${config.name} timed out`);
        }
        throw new AiError(config.name, "UPSTREAM", `${config.name} failed to connect`);
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        const code = response.status === 429 ? "RATE_LIMIT" : "UPSTREAM";
        throw new AiError(
            config.name,
            code,
            `${config.name} responded with status ${response.status}`,
        );
    }

    let data: ChatCompletionResponse;
    try {
        data = (await response.json()) as ChatCompletionResponse;
    } catch {
        throw new AiError(config.name, "UPSTREAM", `${config.name} returned non-JSON`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
        throw new AiError(config.name, "UPSTREAM", `${config.name} returned an empty response`);
    }
    return text;
}
