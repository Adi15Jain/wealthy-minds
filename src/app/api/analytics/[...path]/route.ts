import { NextRequest, NextResponse } from "next/server";

/**
 * Analytics proxy — forwards requests to the Python FastAPI microservice.
 * Acts as a BFF (Backend for Frontend) layer.
 */

const ANALYTICS_URL =
    process.env.ANALYTICS_SERVICE_URL ?? "http://localhost:8000";

// GET /api/analytics/[...path] — Proxy to Python service
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    try {
        const { path } = await params;
        const analyticsPath = path.join("/");
        const url = `${ANALYTICS_URL}/api/v1/${analyticsPath}`;

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                // Forward auth headers
                ...(request.headers.get("authorization")
                    ? { Authorization: request.headers.get("authorization")! }
                    : {}),
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json(
            {
                code: "ANALYTICS_UNAVAILABLE",
                message:
                    "Analytics service is not available. Ensure the Python microservice is running.",
            },
            { status: 503 },
        );
    }
}

// POST /api/analytics/[...path] — Proxy POST to Python service
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    try {
        const { path } = await params;
        const analyticsPath = path.join("/");
        const url = `${ANALYTICS_URL}/api/v1/${analyticsPath}`;
        const body = await request.json();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(request.headers.get("authorization")
                    ? { Authorization: request.headers.get("authorization")! }
                    : {}),
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return NextResponse.json(
            {
                code: "ANALYTICS_UNAVAILABLE",
                message: "Analytics service is not available.",
            },
            { status: 503 },
        );
    }
}
