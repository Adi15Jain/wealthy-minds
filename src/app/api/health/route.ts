import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * Health check endpoint — verifies database and analytics-service
 * reachability. Unauthenticated by design (used by load balancers).
 * GET /api/health
 */

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 3_000;

type DependencyStatus = "up" | "down";

async function checkDatabase(): Promise<DependencyStatus> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error("db health check timed out")),
                    CHECK_TIMEOUT_MS,
                );
            }),
        ]);
        return "up";
    } catch {
        return "down";
    } finally {
        clearTimeout(timer);
    }
}

async function checkAnalytics(): Promise<DependencyStatus> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    try {
        const response = await fetch(`${env.ANALYTICS_SERVICE_URL}/health`, {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
        });
        return response.ok ? "up" : "down";
    } catch {
        return "down";
    } finally {
        clearTimeout(timer);
    }
}

export async function GET() {
    const [database, analytics] = await Promise.all([
        checkDatabase(),
        checkAnalytics(),
    ]);

    const healthy = database === "up" && analytics === "up";

    return NextResponse.json(
        {
            status: healthy ? "healthy" : "degraded",
            checks: { database, analytics },
            service: "wealthyminds-api",
            timestamp: new Date().toISOString(),
        },
        {
            // Only a dead database makes the app itself unusable.
            status: database === "up" ? 200 : 503,
            headers: { "Cache-Control": "no-store" },
        },
    );
}
