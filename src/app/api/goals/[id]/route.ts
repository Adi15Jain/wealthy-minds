import { NextRequest, NextResponse } from "next/server";
import { GoalType, Priority, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    deriveGoalProgress,
    fail,
    getUserId,
    internalError,
    isEnumValue,
    isFiniteNumber,
    isNonEmptyString,
    notFound,
    ok,
    parseDate,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/goals/[id] — Partial update.
 * Body: { name?, type?, targetAmount?, currentAmount?, deadline?,
 *         monthlyContribution?, priority? }
 * Progress/status are re-derived after the update.
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

    const {
        name,
        type,
        targetAmount,
        currentAmount,
        deadline,
        monthlyContribution,
        priority,
    } = body;

    if (name !== undefined && !isNonEmptyString(name)) {
        return fail("VALIDATION_ERROR", "name must be a non-empty string (max 500 chars)");
    }
    if (type !== undefined && !isEnumValue(GoalType, type)) {
        return fail(
            "VALIDATION_ERROR",
            `type must be one of: ${Object.values(GoalType).join(", ")}`,
        );
    }
    if (targetAmount !== undefined && (!isFiniteNumber(targetAmount) || targetAmount <= 0)) {
        return fail("VALIDATION_ERROR", "targetAmount must be a number > 0 and <= 1e12");
    }
    if (currentAmount !== undefined && !isFiniteNumber(currentAmount)) {
        return fail("VALIDATION_ERROR", "currentAmount must be a number >= 0 and <= 1e12");
    }
    let deadlineDate: Date | undefined;
    if (deadline !== undefined) {
        const parsed = parseDate(deadline);
        if (!parsed) {
            return fail("VALIDATION_ERROR", "deadline must be a valid ISO date string");
        }
        deadlineDate = parsed;
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
    if (
        name === undefined &&
        type === undefined &&
        targetAmount === undefined &&
        currentAmount === undefined &&
        deadline === undefined &&
        monthlyContribution === undefined &&
        priority === undefined
    ) {
        return fail("VALIDATION_ERROR", "No updatable fields provided");
    }

    try {
        const existing = await prisma.goal.findFirst({
            where: { id, userId },
        });
        if (!existing) return notFound("Goal");

        const derived = deriveGoalProgress({
            targetAmount: targetAmount ?? existing.targetAmount,
            currentAmount: currentAmount ?? existing.currentAmount,
            deadline: deadlineDate ?? existing.deadline,
            monthlyContribution:
                monthlyContribution ?? existing.monthlyContribution,
        });

        const data: Prisma.GoalUpdateInput = {
            name: name !== undefined ? name.trim() : undefined,
            type,
            targetAmount,
            currentAmount,
            deadline: deadlineDate,
            monthlyContribution,
            priority,
            progress: derived.progress,
            status: derived.status,
        };

        const updated = await prisma.goal.update({
            where: { id: existing.id },
            data,
        });

        return ok(updated);
    } catch {
        return internalError();
    }
}

/** DELETE /api/goals/[id] */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;

    try {
        const existing = await prisma.goal.findFirst({
            where: { id, userId },
            select: { id: true },
        });
        if (!existing) return notFound("Goal");

        await prisma.goal.delete({ where: { id: existing.id } });
        return ok({ id: existing.id, deleted: true });
    } catch {
        return internalError();
    }
}
