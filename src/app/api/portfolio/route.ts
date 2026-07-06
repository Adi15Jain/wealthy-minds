import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    fail,
    getUserId,
    internalError,
    isNonEmptyString,
    ok,
    readBody,
    round2,
    unauthorized,
} from "@/app/api/_lib/crud";

/**
 * GET /api/portfolio — List user portfolios (with holdings) plus a summary.
 * Lazily creates a default portfolio on first access.
 */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        let portfolios = await prisma.portfolio.findMany({
            where: { userId },
            include: { holdings: { orderBy: { createdAt: "asc" } } },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        if (portfolios.length === 0) {
            const created = await prisma.portfolio.create({
                data: { userId, name: "My Portfolio", isDefault: true },
                include: { holdings: true },
            });
            portfolios = [created];
        }

        const holdings = portfolios.flatMap((p) => p.holdings);
        const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
        const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
        const totalReturns = totalValue - totalInvested;
        const returnPercentage =
            totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

        const byAssetClass = new Map<string, number>();
        for (const holding of holdings) {
            byAssetClass.set(
                holding.assetClass,
                (byAssetClass.get(holding.assetClass) ?? 0) +
                    holding.currentValue,
            );
        }
        const assetAllocation = Array.from(byAssetClass.entries()).map(
            ([assetClass, value]) => ({
                assetClass,
                value: round2(value),
                percentage:
                    totalValue > 0 ? round2((value / totalValue) * 100) : 0,
            }),
        );

        return ok({
            portfolios,
            summary: {
                totalValue: round2(totalValue),
                totalInvested: round2(totalInvested),
                totalReturns: round2(totalReturns),
                returnPercentage: round2(returnPercentage),
                holdingsCount: holdings.length,
                assetAllocation,
            },
        });
    } catch {
        return internalError();
    }
}

/**
 * POST /api/portfolio — Create a new portfolio.
 * Body: { name: string, description?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }
    const { name, description } = body;

    if (!isNonEmptyString(name)) {
        return fail(
            "VALIDATION_ERROR",
            "name is required (non-empty string, max 500 chars)",
        );
    }
    if (description !== undefined && !isNonEmptyString(description)) {
        return fail(
            "VALIDATION_ERROR",
            "description must be a non-empty string (max 500 chars)",
        );
    }

    try {
        const hasPortfolio = await prisma.portfolio.findFirst({
            where: { userId },
            select: { id: true },
        });
        const portfolio = await prisma.portfolio.create({
            data: {
                userId,
                name: name.trim(),
                description:
                    description !== undefined ? description.trim() : undefined,
                isDefault: !hasPortfolio,
            },
        });
        return ok(portfolio, 201);
    } catch {
        return internalError();
    }
}
