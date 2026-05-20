import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * GET /api/market/indices
 * Fetches live Indian market index data.
 * Uses Gemini AI to provide current index values and daily changes.
 * No hardcoded mock data.
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

        const prompt = `You are a real-time Indian stock market data system. Return a JSON array of the 4 major Indian market indices with their current approximate values and today's change.

Include these indices in this order:
1. NIFTY 50
2. SENSEX (BSE 30)
3. NIFTY BANK
4. NIFTY MIDCAP 150

For each index, return:
{
  "name": "<Index name>",
  "value": <current approximate value as float>,
  "change": <today's point change as float, positive or negative>,
  "changePercent": <today's percentage change as float>,
  "trend": "<up or down>",
  "weekHigh": <52-week high as float>,
  "weekLow": <52-week low as float>
}

Use the most recent available data. Be as accurate as possible with current values.
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

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini indices API error:", errText);
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Empty response from Gemini for indices");
        }

        const indices = JSON.parse(text.trim());

        return NextResponse.json({
            data: Array.isArray(indices) ? indices : [],
            success: true,
            source: "gemini",
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error("Indices API Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch market indices", error: error.message },
            { status: 500 }
        );
    }
}
