import { NextRequest, NextResponse } from "next/server";

/**
 * Market data API routes.
 * Scaffold — will integrate with Groww APIs / NSE/BSE data.
 */

// GET /api/market/indices — Get market indices
export async function GET(request: NextRequest) {
    // Mock market data for scaffold
    const mockIndices = [
        {
            name: "NIFTY 50",
            value: 24850.42,
            change: 125.3,
            changePercent: 0.51,
            lastUpdated: new Date().toISOString(),
        },
        {
            name: "SENSEX",
            value: 81220.15,
            change: 380.65,
            changePercent: 0.47,
            lastUpdated: new Date().toISOString(),
        },
        {
            name: "NIFTY BANK",
            value: 52180.9,
            change: -85.2,
            changePercent: -0.16,
            lastUpdated: new Date().toISOString(),
        },
    ];

    return NextResponse.json({
        data: mockIndices,
        success: true,
        timestamp: new Date().toISOString(),
    });
}
