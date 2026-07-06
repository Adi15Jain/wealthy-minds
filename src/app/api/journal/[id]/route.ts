import { NextRequest, NextResponse } from "next/server";
import { Mood, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    MAX_CONTENT,
    fail,
    getUserId,
    internalError,
    isEnumValue,
    isNonEmptyString,
    isStringArray,
    notFound,
    ok,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/journal/[id] — Partial update.
 * Body: { title?, content?, mood?, tags? }
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

    const { title, content, mood, tags } = body;

    if (title !== undefined && !isNonEmptyString(title)) {
        return fail("VALIDATION_ERROR", "title must be a non-empty string (max 500 chars)");
    }
    if (content !== undefined && !isNonEmptyString(content, MAX_CONTENT)) {
        return fail("VALIDATION_ERROR", "content must be a non-empty string (max 10000 chars)");
    }
    if (mood !== undefined && !isEnumValue(Mood, mood)) {
        return fail(
            "VALIDATION_ERROR",
            `mood must be one of: ${Object.values(Mood).join(", ")}`,
        );
    }
    if (tags !== undefined && !isStringArray(tags, 10, 30)) {
        return fail(
            "VALIDATION_ERROR",
            "tags must be an array of at most 10 strings, each 1-30 chars",
        );
    }
    if (
        title === undefined &&
        content === undefined &&
        mood === undefined &&
        tags === undefined
    ) {
        return fail("VALIDATION_ERROR", "No updatable fields provided");
    }

    try {
        const existing = await prisma.journalEntry.findFirst({
            where: { id, userId },
            select: { id: true },
        });
        if (!existing) return notFound("Journal entry");

        const data: Prisma.JournalEntryUpdateInput = {
            title: title !== undefined ? title.trim() : undefined,
            content,
            mood,
            tags,
        };

        const updated = await prisma.journalEntry.update({
            where: { id: existing.id },
            data,
        });
        return ok(updated);
    } catch {
        return internalError();
    }
}

/** DELETE /api/journal/[id] */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;

    try {
        const existing = await prisma.journalEntry.findFirst({
            where: { id, userId },
            select: { id: true },
        });
        if (!existing) return notFound("Journal entry");

        await prisma.journalEntry.delete({ where: { id: existing.id } });
        return ok({ id: existing.id, deleted: true });
    } catch {
        return internalError();
    }
}
