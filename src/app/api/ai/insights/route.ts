import { NextRequest, NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateText, hasAiProvider } from "@/lib/ai-client";

const MAX_PROMPT_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;

const SYSTEM_INSTRUCTION = `You are WealthyMinds AI — an intelligent, premium financial "Teller" focused on long-term wealth creation and disciplined investing for Indian and global investors.

Core principles you MUST follow:
- You are a Teller, not a portfolio manager. You give analytical insights, historical context, and predictive projections based on asset performance.
- Prioritize long-term wealth creation over short-term trading. Strongly advocate for Systematic Investment Plans (SIPs).
- Provide balanced, mathematically structured financial guidance. Avoid emotional biases.
- Keep the tone highly professional, premium, analytical, yet simple and accessible.
- Never give direct buy/sell financial advisory recommendations for specific assets. Always frame your analysis as "educational insights and past-performance predictions."
- Answer questions in clean Markdown, with sections, bullet points, and key statistics formatted clearly.`;

interface HistoryMessage {
    role: string;
    content: string;
}

function parseHistory(raw: unknown): HistoryMessage[] | null {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw) || raw.length > MAX_HISTORY_MESSAGES) return null;
    const history: HistoryMessage[] = [];
    for (const item of raw) {
        if (typeof item !== "object" || item === null) return null;
        const { role, content } = item as Record<string, unknown>;
        if (typeof role !== "string" || typeof content !== "string") {
            return null;
        }
        if (content.length > MAX_HISTORY_MESSAGE_LENGTH) return null;
        history.push({ role, content });
    }
    return history;
}

export async function GET() {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    return NextResponse.json({
        success: true,
        message: "WealthyMinds AI Teller API is active and ready.",
        timestamp: new Date().toISOString(),
    });
}

export async function POST(request: NextRequest) {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`ai-insights:${userId}`, {
        limit: 10,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
        return fail("BAD_REQUEST", "Request body must be JSON.", 400);
    }
    const { prompt, history: rawHistory, type } = body as Record<string, unknown>;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
        return fail("BAD_REQUEST", "Prompt is required.", 400);
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
        return fail(
            "BAD_REQUEST",
            `Prompt must be at most ${MAX_PROMPT_LENGTH} characters.`,
            400,
        );
    }
    const history = parseHistory(rawHistory);
    if (history === null) {
        return fail("BAD_REQUEST", "History is malformed or too long.", 400);
    }
    const promptType =
        typeof type === "string" ? type.slice(0, 40) : undefined;

    if (!hasAiProvider()) {
        return NextResponse.json({
            success: true,
            text: getFallbackResponse(promptType),
            source: "fallback",
        });
    }

    try {
        // System instruction rides with the final user turn so history keeps
        // strict user/model alternation (Gemini rejects consecutive same-role
        // turns).
        const aiText = await generateText(
            `${SYSTEM_INSTRUCTION}\n\nUser's latest question: ${prompt}`,
            {
                history: history.map((message) => ({
                    role: message.role,
                    text: message.content,
                })),
            },
        );

        return NextResponse.json({
            success: true,
            text: aiText,
            source: "ai",
        });
    } catch (error) {
        console.error("AI insights route error:", error);
        // Graceful degradation: the chat UI stays functional with honest
        // general guidance instead of a hard error.
        return NextResponse.json({
            success: true,
            text: getFallbackResponse(promptType),
            source: "fallback",
        });
    }
}

/**
 * Honest fallback shown when live AI is unavailable. Deliberately contains
 * no invented performance figures, returns, or statistics.
 */
function getFallbackResponse(type?: string): string {
    const header = `### Live AI is currently unavailable\n\nWe could not reach our AI engine for a live analysis of your question, so here is general, time-tested investing guidance instead:\n\n`;

    if (type === "comparison") {
        return `${header}* **How to compare funds yourself**: Look beyond last year's return — compare rolling returns across full market cycles, expense ratios, maximum drawdown, and how long the fund manager has run the strategy.
* **Risk-adjusted lens**: A fund with slightly lower returns but much lower volatility is often the better long-term SIP choice, because it is easier to stay invested through corrections.
* **Diversification beats picking a single winner**: Splitting a SIP across two differentiated funds (for example, one broad-market and one style-differentiated) reduces the impact of any single manager underperforming.
* **Costs compound too**: Prefer direct plans and lower expense ratios — fees are one of the few factors you fully control.

*This is general educational guidance, not a live analysis of the specific assets you asked about. Please try again shortly for a full AI comparison.*`;
    }

    return `${header}* **Stay systematic**: SIPs remove market-timing decisions and average your purchase cost across market cycles.
* **Match risk to horizon**: Equity suits long horizons; keep near-term needs in debt or fixed-income instruments.
* **Diversify sensibly**: Spread across asset classes and, within equity, across market caps and sectors rather than concentrating in one theme.
* **Behavior matters most**: Avoid panic-selling during drawdowns and avoid chasing recent winners — discipline usually contributes more to outcomes than fund selection.
* **Control costs**: Prefer low expense ratios and direct plans; verify facts with official AMC or exchange sources.

*This is general educational guidance, not a live analysis of your query. Please try again shortly.*`;
}
