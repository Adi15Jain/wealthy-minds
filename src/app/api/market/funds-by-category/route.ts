import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/market/funds-by-category
 * Returns top-performing mutual funds for a given category.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || "Large Cap";

        const apiKey = env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, message: "GOOGLE_AI_API_KEY not configured." }, { status: 500 });
        }

        const prompt = `You are a professional Indian mutual fund data system. Return a JSON array of the top 5 best-performing mutual funds in the "${category}" category in India.

For each fund, provide ACCURATE, real-world performance data:
{
  "name": "<Full official scheme name — direct growth plan>",
  "symbol": "<AMC short code or scheme code>",
  "amc": "<Asset Management Company name>",
  "cagr1y": <accurate 1-year return as float>,
  "cagr3y": <accurate 3-year CAGR as float>,
  "cagr5y": <accurate 5-year CAGR as float>,
  "expenseRatio": <expense ratio as float, e.g. 0.35>,
  "aum": "<AUM in crores, e.g. ₹42,500 Cr>",
  "riskLabel": "<Conservative | Moderate | Aggressive>",
  "rating": <Morningstar-style rating 1-5>,
  "minSIP": <minimum SIP amount in INR, e.g. 500>
}

Use the most recent available data. Only include direct growth plans.
Return ONLY the raw JSON array.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
            }),
        });

        if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty Gemini response");

        const funds = JSON.parse(text.trim());
        return NextResponse.json({ success: true, data: Array.isArray(funds) ? funds : [], source: "gemini" });
    } catch (error: any) {
        console.error("Funds by category API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
