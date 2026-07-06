import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fail, requireUser } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";

/**
 * Analytics proxy — forwards requests to the Python FastAPI microservice.
 * Only allowlisted path prefixes are forwarded, the client's Authorization
 * header is never passed through, and upstream JSON (and its status code)
 * is passed back verbatim when the service responds.
 */

const ALLOWED_PREFIXES = [
    "risk",
    "projection",
    "behavioral",
    "allocation",
    "health",
] as const;

const SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;
const UPSTREAM_TIMEOUT_MS = 10_000;

function validatePath(path: string[]): string | null {
    if (path.length === 0) return null;
    for (const segment of path) {
        if (segment.includes("..") || !SEGMENT_PATTERN.test(segment)) {
            return null;
        }
    }
    if (!(ALLOWED_PREFIXES as readonly string[]).includes(path[0])) {
        return null;
    }
    return path.join("/");
}

async function proxy(
    request: NextRequest,
    path: string[],
    method: "GET" | "POST",
): Promise<NextResponse> {
    const userId = await requireUser();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required", 401);

    const limited = rateLimit(`analytics:${userId}`, {
        limit: 60,
        windowMs: 60_000,
    });
    if (!limited.allowed) {
        return fail("RATE_LIMITED", "Too many requests. Please slow down.", 429, {
            retryAfterSeconds: limited.retryAfterSeconds,
        });
    }

    const analyticsPath = validatePath(path);
    if (!analyticsPath) {
        return fail("NOT_FOUND", "Unknown analytics endpoint.", 404);
    }

    let body: string | undefined;
    if (method === "POST") {
        const json: unknown = await request.json().catch(() => null);
        if (json === null) {
            return fail("BAD_REQUEST", "Request body must be JSON.", 400);
        }
        body = JSON.stringify(json);
    }

    const search = request.nextUrl.search;
    const url = `${env.ANALYTICS_SERVICE_URL}/api/v1/${analyticsPath}${search}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            ...(body !== undefined ? { body } : {}),
            signal: controller.signal,
        });
    } catch {
        return fail(
            "ANALYTICS_UNAVAILABLE",
            "Analytics service is not available.",
            503,
        );
    } finally {
        clearTimeout(timer);
    }

    try {
        const data: unknown = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch {
        return fail(
            "ANALYTICS_UNAVAILABLE",
            "Analytics service returned an invalid response.",
            503,
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const { path } = await params;
    return proxy(request, path, "GET");
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> },
) {
    const { path } = await params;
    return proxy(request, path, "POST");
}
