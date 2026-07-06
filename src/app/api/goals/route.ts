import { NextRequest, NextResponse } from "next/server";
import { GoalType, Priority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    deriveGoalProgress,
    fail,
    getUserId,
    internalError,
    isEnumValue,
    isFiniteNumber,
    isNonEmptyString,
    ok,
    parseDate,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

/**
 * GET /api/goals — List goals (createdAt desc) with freshly derived
 * progress/status, persisting any changes.
 */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        const goals = await prisma.goal.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        const refreshed = await Promise.all(
            goals.map(async (goal) => {
                const derived = deriveGoalProgress(goal);
                if (
                    derived.progress === goal.progress &&
                    derived.status === goal.status
                ) {
                    return goal;
                }
                return prisma.goal.update({
                    where: { id: goal.id },
                    data: derived,
                });
            }),
        );

        return ok(refreshed);
    } catch {
        return internalError();
    }
}

/**
 * POST /api/goals — Create a goal.
 * Body: { name, type (GoalType), targetAmount, currentAmount?,
 *         deadline (ISO), monthlyContribution?, priority? (Priority) }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const {
        name,
        type,
        targetAmount,
        currentAmount,
        deadline,
        monthlyContribution,
        priority,
    } = body;

    if (!isNonEmptyString(name)) {
        return fail("VALIDATION_ERROR", "name is required (non-empty string, max 500 chars)");
    }
    if (!isEnumValue(GoalType, type)) {
        return fail(
            "VALIDATION_ERROR",
            `type must be one of: ${Object.values(GoalType).join(", ")}`,
        );
    }
    if (!isFiniteNumber(targetAmount) || targetAmount <= 0) {
        return fail("VALIDATION_ERROR", "targetAmount must be a number > 0 and <= 1e12");
    }
    if (currentAmount !== undefined && !isFiniteNumber(currentAmount)) {
        return fail("VALIDATION_ERROR", "currentAmount must be a number >= 0 and <= 1e12");
    }
    const deadlineDate = parseDate(deadline);
    if (!deadlineDate) {
        return fail("VALIDATION_ERROR", "deadline must be a valid ISO date string");
    }
    if (monthlyContribution !== undefined && !isFiniteNumber(monthlyContribution)) {
        return fail("VALIDATION_ERROR", "monthlyContribution must be a number >= 0 and <= 1e12");
    }
    if (priority !== undefined && !isEnumValue(Priority, priority)) {
        return fail(
            "VALIDATION_ERROR",
            `priority must be one of: ${Object.values(Priority).join(", ")}`,
        );
    }

    try {
        const derived = deriveGoalProgress({
            targetAmount,
            currentAmount: currentAmount ?? 0,
            deadline: deadlineDate,
            monthlyContribution: monthlyContribution ?? 0,
        });

        const goal = await prisma.goal.create({
            data: {
                userId,
                name: name.trim(),
                type,
                targetAmount,
                currentAmount: currentAmount ?? 0,
                deadline: deadlineDate,
                monthlyContribution: monthlyContribution ?? 0,
                priority: priority ?? undefined,
                progress: derived.progress,
                status: derived.status,
            },
        });

        return ok(goal, 201);
    } catch {
        return internalError();
    }
}
