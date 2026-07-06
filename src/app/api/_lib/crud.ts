import { NextResponse } from "next/server";
import { GoalStatus, Prisma, type Portfolio } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Shared helpers for the database-backed CRUD API routes.
 * Response envelope:
 *   Success: { success: true, data }
 *   Error:   { success: false, error: { code, message } }
 */

// ── Response envelope ────────────────────────────────────────

export type ErrorCode =
    | "UNAUTHORIZED"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "INTERNAL";

const ERROR_STATUS: Record<ErrorCode, number> = {
    UNAUTHORIZED: 401,
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    INTERNAL: 500,
};

export function ok<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: ErrorCode, message: string): NextResponse {
    return NextResponse.json(
        { success: false, error: { code, message } },
        { status: ERROR_STATUS[code] },
    );
}

export function unauthorized(): NextResponse {
    return fail("UNAUTHORIZED", "Authentication required");
}

export function notFound(resource = "Resource"): NextResponse {
    return fail("NOT_FOUND", `${resource} not found`);
}

export function internalError(): NextResponse {
    return fail("INTERNAL", "An unexpected error occurred");
}

// ── Auth ─────────────────────────────────────────────────────

export async function getUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}

// ── Body parsing & validation ────────────────────────────────

export const MAX_AMOUNT = 1e12;
export const MAX_STRING = 500;
export const MAX_CONTENT = 10000;

export async function readBody(
    request: Request,
): Promise<Record<string, unknown> | null> {
    try {
        const body: unknown = await request.json();
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            return null;
        }
        return body as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function isNonEmptyString(
    value: unknown,
    maxLength = MAX_STRING,
): value is string {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= maxLength
    );
}

export function isFiniteNumber(
    value: unknown,
    min = 0,
    max = MAX_AMOUNT,
): value is number {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= min &&
        value <= max
    );
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/** Parses an ISO date string (or Date-compatible value) within a sane range. */
export function parseDate(value: unknown): Date | null {
    if (typeof value !== "string" || value.length === 0 || value.length > 64) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    if (year < 1900 || year > 2200) return null;
    return date;
}

export function isEnumValue<T extends Record<string, string>>(
    enumObject: T,
    value: unknown,
): value is T[keyof T] {
    return (
        typeof value === "string" &&
        (Object.values(enumObject) as string[]).includes(value)
    );
}

export function isStringArray(
    value: unknown,
    maxItems: number,
    maxItemLength = MAX_STRING,
): value is string[] {
    return (
        Array.isArray(value) &&
        value.length <= maxItems &&
        value.every(
            (item): item is string =>
                typeof item === "string" &&
                item.length > 0 &&
                item.length <= maxItemLength,
        )
    );
}

// ── Numeric helpers ──────────────────────────────────────────

export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

// ── Portfolio helpers ────────────────────────────────────────

/** Returns the user's default portfolio, creating one lazily if none exists. */
export async function getOrCreateDefaultPortfolio(
    userId: string,
): Promise<Portfolio> {
    const existing = await prisma.portfolio.findFirst({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    if (existing) return existing;
    return prisma.portfolio.create({
        data: { userId, name: "My Portfolio", isDefault: true },
    });
}

/**
 * Recomputes a portfolio's cached totals and each holding's allocation
 * from its current holdings. Must run inside a transaction.
 */
export async function recomputePortfolio(
    tx: Prisma.TransactionClient,
    portfolioId: string,
): Promise<void> {
    const holdings = await tx.holding.findMany({
        where: { portfolioId },
        select: { id: true, currentValue: true, investedValue: true },
    });

    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
    const totalReturns = totalValue - totalInvested;
    const returnPercentage =
        totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
            totalValue: round2(totalValue),
            totalInvested: round2(totalInvested),
            totalReturns: round2(totalReturns),
            returnPercentage: round2(returnPercentage),
            lastSyncedAt: new Date(),
        },
    });

    for (const holding of holdings) {
        const allocation =
            totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
        await tx.holding.update({
            where: { id: holding.id },
            data: { allocation: round2(allocation) },
        });
    }
}

/** Derives the holding's cached financial figures from its raw inputs. */
export function computeHoldingFigures(input: {
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
}): {
    currentPrice: number;
    investedValue: number;
    currentValue: number;
    returns: number;
    returnPercentage: number;
} {
    const effectivePrice =
        input.currentPrice > 0 ? input.currentPrice : input.avgBuyPrice;
    const investedValue = input.quantity * input.avgBuyPrice;
    const currentValue = input.quantity * effectivePrice;
    const returns = currentValue - investedValue;
    const returnPercentage =
        investedValue > 0 ? (returns / investedValue) * 100 : 0;
    return {
        currentPrice: effectivePrice,
        investedValue: round2(investedValue),
        currentValue: round2(currentValue),
        returns: round2(returns),
        returnPercentage: round2(returnPercentage),
    };
}

// ── Goal helpers ─────────────────────────────────────────────

/** Derives a goal's progress (0-100) and status from its figures. */
export function deriveGoalProgress(goal: {
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    monthlyContribution: number;
}): { progress: number; status: GoalStatus } {
    const progress =
        goal.targetAmount > 0
            ? clamp((goal.currentAmount / goal.targetAmount) * 100, 0, 100)
            : 0;

    if (progress >= 100) {
        return { progress: 100, status: GoalStatus.COMPLETED };
    }

    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
    const monthsToDeadline =
        (goal.deadline.getTime() - Date.now()) / msPerMonth;

    if (monthsToDeadline <= 0) {
        return { progress: round2(progress), status: GoalStatus.BEHIND };
    }

    const requiredMonthlyPace =
        (goal.targetAmount - goal.currentAmount) / monthsToDeadline;

    let status: GoalStatus;
    if (requiredMonthlyPace <= 0) {
        status = GoalStatus.AHEAD;
    } else if (goal.monthlyContribution >= requiredMonthlyPace * 1.2) {
        status = GoalStatus.AHEAD;
    } else if (goal.monthlyContribution >= requiredMonthlyPace * 0.9) {
        status = GoalStatus.ON_TRACK;
    } else {
        status = GoalStatus.BEHIND;
    }

    return { progress: round2(progress), status };
}
