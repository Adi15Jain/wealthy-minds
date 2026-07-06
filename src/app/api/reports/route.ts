import { NextRequest, NextResponse } from "next/server";
import { ReportType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    deriveGoalProgress,
    fail,
    getUserId,
    internalError,
    isEnumValue,
    isNonEmptyString,
    ok,
    readBody,
    round2,
    unauthorized,
} from "@/app/api/_lib/crud";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    MONTHLY_SUMMARY: "Monthly Summary",
    QUARTERLY_PERFORMANCE: "Quarterly Performance",
    ANNUAL_TAX: "Annual Tax",
    CUSTOM: "Custom",
};

/** GET /api/reports — List reports (createdAt desc). */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        const reports = await prisma.report.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return ok(reports);
    } catch {
        return internalError();
    }
}

/**
 * POST /api/reports — Generate a report now.
 * Body: { title?: string, type: ReportType }
 * Snapshots the user's portfolios, holdings, goals and SIPs into `data`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const { title, type } = body;

    if (!isEnumValue(ReportType, type)) {
        return fail(
            "VALIDATION_ERROR",
            `type must be one of: ${Object.values(ReportType).join(", ")}`,
        );
    }
    if (title !== undefined && !isNonEmptyString(title)) {
        return fail("VALIDATION_ERROR", "title must be a non-empty string (max 500 chars)");
    }

    try {
        const [portfolios, goals, sips] = await Promise.all([
            prisma.portfolio.findMany({
                where: { userId },
                include: { holdings: true },
                orderBy: { createdAt: "asc" },
            }),
            prisma.goal.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
            prisma.sIP.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        const holdings = portfolios.flatMap((p) => p.holdings);
        const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
        const totalInvested = holdings.reduce((s, h) => s + h.investedValue, 0);
        const totalReturns = totalValue - totalInvested;

        const byAssetClass = new Map<string, number>();
        for (const holding of holdings) {
            byAssetClass.set(
                holding.assetClass,
                (byAssetClass.get(holding.assetClass) ?? 0) +
                    holding.currentValue,
            );
        }

        const snapshot: Prisma.InputJsonValue = {
            generatedAt: new Date().toISOString(),
            summary: {
                portfolioCount: portfolios.length,
                holdingsCount: holdings.length,
                totalValue: round2(totalValue),
                totalInvested: round2(totalInvested),
                totalReturns: round2(totalReturns),
                returnPercentage:
                    totalInvested > 0
                        ? round2((totalReturns / totalInvested) * 100)
                        : 0,
            },
            allocation: Array.from(byAssetClass.entries()).map(
                ([assetClass, value]) => ({
                    assetClass,
                    value: round2(value),
                    percentage:
                        totalValue > 0
                            ? round2((value / totalValue) * 100)
                            : 0,
                }),
            ),
            portfolios: portfolios.map((p) => ({
                id: p.id,
                name: p.name,
                totalValue: p.totalValue,
                totalInvested: p.totalInvested,
                totalReturns: p.totalReturns,
                returnPercentage: p.returnPercentage,
                holdings: p.holdings.map((h) => ({
                    id: h.id,
                    name: h.name,
                    ticker: h.ticker,
                    type: h.type,
                    assetClass: h.assetClass,
                    quantity: h.quantity,
                    currentValue: h.currentValue,
                    investedValue: h.investedValue,
                    returns: h.returns,
                    returnPercentage: h.returnPercentage,
                    allocation: h.allocation,
                })),
            })),
            goals: goals.map((goal) => {
                const derived = deriveGoalProgress(goal);
                return {
                    id: goal.id,
                    name: goal.name,
                    type: goal.type,
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount,
                    deadline: goal.deadline.toISOString(),
                    monthlyContribution: goal.monthlyContribution,
                    progress: derived.progress,
                    status: derived.status,
                    priority: goal.priority,
                };
            }),
            sips: sips.map((sip) => ({
                id: sip.id,
                name: sip.name,
                amount: sip.amount,
                frequency: sip.frequency,
                status: sip.status,
                nextDate: sip.nextDate.toISOString(),
                totalInvested: sip.totalInvested,
                currentValue: sip.currentValue,
            })),
        };

        const monthYear = new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
        const reportTitle = isNonEmptyString(title)
            ? title.trim()
            : `${REPORT_TYPE_LABELS[type]} Report — ${monthYear}`;

        const report = await prisma.report.create({
            data: {
                userId,
                title: reportTitle,
                type,
                data: snapshot,
            },
        });

        return ok(report, 201);
    } catch {
        return internalError();
    }
}
