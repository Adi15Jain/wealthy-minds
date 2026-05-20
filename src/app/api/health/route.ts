import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 * GET /api/health
 */
export async function GET() {
    return NextResponse.json({
        status: "healthy",
        service: "wealthyminds-api",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
    });
}
