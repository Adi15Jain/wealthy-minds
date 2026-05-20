import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/market/trending
 * Returns currently popular Indian market assets with real performance metrics
 * powered by Gemini AI. No hardcoded data — every response is generated live.
 */
export async function GET(request: NextRequest) {
    try {
        const apiKey = env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { success: false, message: "GOOGLE_AI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const prompt = `You are a professional Indian financial markets data system with access to the latest market data as of today.

Return a JSON array of exactly 6 currently popular and relevant Indian market assets that retail investors are actively researching or investing in. These should be REAL assets with ACCURATE, up-to-date performance data.

Requirements:
- Include 2 popular mutual funds (mix of flexi cap, mid cap, ELSS, or index funds — choose from real top-performing funds)
- Include 2 popular Indian stocks (mix of large-cap and mid-cap companies that are currently in the news or trending)
- Include 1 index fund or ETF tracking a major Indian index
- Include 1 government bond, debt fund, or fixed-income instrument

For EACH asset, provide ACCURATE real-world data:
{
  "symbol": "<NSE ticker for stocks, or AMC short code for mutual funds>",
  "name": "<Full official name as listed on exchanges or AMC>",
  "type": "Stock" | "Mutual Fund" | "Bond",
  "cagr3y": <accurate 3-year CAGR as a float, e.g. 18.4>,
  "cagr1y": <accurate 1-year return as a float>,
  "volatility": "Low" | "Medium" | "High",
  "consistency": <risk-adjusted Sharpe-equivalent score, integer 40-99>,
  "drawdown": <worst peak-to-trough drawdown in last 5 years as negative float, e.g. -18.2>,
  "sector": "<Primary business sector or fund category>",
  "riskLabel": "<one of: Conservative, Moderate, Aggressive>",
  "highlight": "<one compelling reason this asset is noteworthy right now, max 15 words>"
}

Use the most recently available market data. Be as accurate as possible — investors will use this to make real decisions.
Return ONLY the raw JSON array. No markdown, no explanation, no code fences.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini trending API error:", errText);
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Empty response from Gemini for trending assets");
        }

        const assets = JSON.parse(text.trim());

        return NextResponse.json({
            success: true,
            data: Array.isArray(assets) ? assets : [],
            source: "gemini",
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error("Trending API Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch trending assets", error: error.message },
            { status: 500 }
        );
    }
}
