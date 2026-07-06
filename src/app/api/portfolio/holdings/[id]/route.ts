import { NextRequest, NextResponse } from "next/server";
import type { Holding } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    computeHoldingFigures,
    fail,
    getUserId,
    internalError,
    isFiniteNumber,
    isNonEmptyString,
    notFound,
    ok,
    readBody,
    recomputePortfolio,
    unauthorized,
} from "@/app/api/_lib/crud";

type RouteContext = { params: Promise<{ id: string }> };

async function findOwnedHolding(
    id: string,
    userId: string,
): Promise<Holding | null> {
    return prisma.holding.findFirst({
        where: { id, portfolio: { userId } },
    });
}

/**
 * PATCH /api/portfolio/holdings/[id]
 * Body: { quantity?, avgBuyPrice?, currentPrice?, sector? }
 * Recomputes holding figures and portfolio totals + allocations.
 */
export async function PATCH(
    request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;
    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const { quantity, avgBuyPrice, currentPrice, sector } = body;

    if (quantity !== undefined && (!isFiniteNumber(quantity) || quantity <= 0)) {
        return fail("VALIDATION_ERROR", "quantity must be a number > 0 and <= 1e12");
    }
    if (avgBuyPrice !== undefined && !isFiniteNumber(avgBuyPrice)) {
        return fail("VALIDATION_ERROR", "avgBuyPrice must be a number >= 0 and <= 1e12");
    }
    if (currentPrice !== undefined && !isFiniteNumber(currentPrice)) {
        return fail("VALIDATION_ERROR", "currentPrice must be a number >= 0 and <= 1e12");
    }
    if (sector !== undefined && !isNonEmptyString(sector)) {
        return fail("VALIDATION_ERROR", "sector must be a non-empty string (max 500 chars)");
    }
    if (
        quantity === undefined &&
        avgBuyPrice === undefined &&
        currentPrice === undefined &&
        sector === undefined
    ) {
        return fail("VALIDATION_ERROR", "No updatable fields provided");
    }

    try {
        const existing = await findOwnedHolding(id, userId);
        if (!existing) return notFound("Holding");

        const nextQuantity = quantity ?? existing.quantity;
        const nextAvgBuyPrice = avgBuyPrice ?? existing.avgBuyPrice;
        const nextCurrentPrice = currentPrice ?? existing.currentPrice;
        const figures = computeHoldingFigures({
            quantity: nextQuantity,
            avgBuyPrice: nextAvgBuyPrice,
            currentPrice: nextCurrentPrice,
        });

        const updated = await prisma.$transaction(
            async (tx): Promise<Holding> => {
                await tx.holding.update({
                    where: { id: existing.id },
                    data: {
                        quantity: nextQuantity,
                        avgBuyPrice: nextAvgBuyPrice,
                        currentPrice: figures.currentPrice,
                        investedValue: figures.investedValue,
                        currentValue: figures.currentValue,
                        returns: figures.returns,
                        returnPercentage: figures.returnPercentage,
                        sector: sector !== undefined ? sector.trim() : undefined,
                    },
                });
                await recomputePortfolio(tx, existing.portfolioId);
                return tx.holding.findUniqueOrThrow({
                    where: { id: existing.id },
                });
            },
        );

        return ok(updated);
    } catch {
        return internalError();
    }
}

/**
 * DELETE /api/portfolio/holdings/[id]
 * Deletes the holding and recomputes portfolio totals + allocations.
 */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;

    try {
        const existing = await findOwnedHolding(id, userId);
        if (!existing) return notFound("Holding");

        await prisma.$transaction(async (tx) => {
            await tx.holding.delete({ where: { id: existing.id } });
            await recomputePortfolio(tx, existing.portfolioId);
        });

        return ok({ id: existing.id, deleted: true });
    } catch {
        return internalError();
    }
}
