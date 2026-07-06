import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Standard BFF response helpers.
 * Success envelope: { success: true, data }
 * Error envelope:   { success: false, error: { code, message } }
 */

export function ok<T>(
    data: T,
    init?: { status?: number; cacheSeconds?: number },
): NextResponse {
    const headers = new Headers();
    if (init?.cacheSeconds) {
        headers.set(
            "Cache-Control",
            `public, s-maxage=${init.cacheSeconds}, stale-while-revalidate=${init.cacheSeconds * 2}`,
        );
    }
    return NextResponse.json(
        { success: true, data },
        { status: init?.status ?? 200, headers },
    );
}

/**
 * Client-safe error response. `message` must be a static, human-readable
 * string — never pass caught error.message text through here.
 */
export function fail(
    code: string,
    message: string,
    status: number,
    init?: { retryAfterSeconds?: number },
): NextResponse {
    const headers = new Headers();
    if (init?.retryAfterSeconds !== undefined) {
        headers.set("Retry-After", String(init.retryAfterSeconds));
    }
    return NextResponse.json(
        {
            success: false,
            error: {
                code,
                message,
                ...(init?.retryAfterSeconds !== undefined
                    ? { retryAfterSeconds: init.retryAfterSeconds }
                    : {}),
            },
        },
        { status, headers },
    );
}

/** Returns the authenticated user's id, or null when there is no session. */
export async function requireUser(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}
