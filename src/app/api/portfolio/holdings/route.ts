import { NextRequest, NextResponse } from "next/server";
import {
    AssetClass,
    InvestmentType,
    TransactionType,
    type Holding,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    computeHoldingFigures,
    fail,
    getOrCreateDefaultPortfolio,
    getUserId,
    internalError,
    isEnumValue,
    isFiniteNumber,
    isNonEmptyString,
    notFound,
    ok,
    readBody,
    recomputePortfolio,
    unauthorized,
} from "@/app/api/_lib/crud";

/**
 * POST /api/portfolio/holdings — Add a holding.
 * Body: {
 *   portfolioId?: string, name: string, ticker: string,
 *   type: InvestmentType, assetClass: AssetClass,
 *   quantity: number, avgBuyPrice: number, currentPrice?: number,
 *   sector?: string
 * }
 * Creates a BUY transaction and recomputes portfolio totals + allocations.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const {
        portfolioId,
        name,
        ticker,
        type,
        assetClass,
        quantity,
        avgBuyPrice,
        currentPrice,
        sector,
    } = body;

    if (!isNonEmptyString(name)) {
        return fail("VALIDATION_ERROR", "name is required (non-empty string, max 500 chars)");
    }
    if (!isNonEmptyString(ticker, 50)) {
        return fail("VALIDATION_ERROR", "ticker is required (non-empty string, max 50 chars)");
    }
    if (!isEnumValue(InvestmentType, type)) {
        return fail(
            "VALIDATION_ERROR",
            `type must be one of: ${Object.values(InvestmentType).join(", ")}`,
        );
    }
    if (!isEnumValue(AssetClass, assetClass)) {
        return fail(
            "VALIDATION_ERROR",
            `assetClass must be one of: ${Object.values(AssetClass).join(", ")}`,
        );
    }
    if (!isFiniteNumber(quantity) || quantity <= 0) {
        return fail("VALIDATION_ERROR", "quantity must be a number > 0 and <= 1e12");
    }
    if (!isFiniteNumber(avgBuyPrice)) {
        return fail("VALIDATION_ERROR", "avgBuyPrice must be a number >= 0 and <= 1e12");
    }
    if (currentPrice !== undefined && !isFiniteNumber(currentPrice)) {
        return fail("VALIDATION_ERROR", "currentPrice must be a number >= 0 and <= 1e12");
    }
    if (sector !== undefined && !isNonEmptyString(sector)) {
        return fail("VALIDATION_ERROR", "sector must be a non-empty string (max 500 chars)");
    }
    if (portfolioId !== undefined && !isNonEmptyString(portfolioId, 100)) {
        return fail("VALIDATION_ERROR", "portfolioId must be a string");
    }

    try {
        let targetPortfolioId: string;
        if (portfolioId !== undefined) {
            const portfolio = await prisma.portfolio.findFirst({
                where: { id: portfolioId, userId },
                select: { id: true },
            });
            if (!portfolio) return notFound("Portfolio");
            targetPortfolioId = portfolio.id;
        } else {
            targetPortfolioId = (await getOrCreateDefaultPortfolio(userId)).id;
        }

        const figures = computeHoldingFigures({
            quantity,
            avgBuyPrice,
            currentPrice: currentPrice ?? 0,
        });

        const holding = await prisma.$transaction(
            async (tx): Promise<Holding> => {
                const created = await tx.holding.create({
                    data: {
                        portfolioId: targetPortfolioId,
                        name: name.trim(),
                        ticker: ticker.trim(),
                        type,
                        assetClass,
                        quantity,
                        avgBuyPrice,
                        currentPrice: figures.currentPrice,
                        investedValue: figures.investedValue,
                        currentValue: figures.currentValue,
                        returns: figures.returns,
                        returnPercentage: figures.returnPercentage,
                        sector: sector !== undefined ? sector.trim() : undefined,
                    },
                });

                await tx.transaction.create({
                    data: {
                        portfolioId: targetPortfolioId,
                        holdingId: created.id,
                        type: TransactionType.BUY,
                        amount: figures.investedValue,
                        units: quantity,
                        price: avgBuyPrice,
                        date: new Date(),
                    },
                });

                await recomputePortfolio(tx, targetPortfolioId);

                const refreshed = await tx.holding.findUniqueOrThrow({
                    where: { id: created.id },
                });
                return refreshed;
            },
        );

        return ok(holding, 201);
    } catch {
        return internalError();
    }
}
