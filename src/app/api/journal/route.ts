import { NextRequest, NextResponse } from "next/server";
import { Mood } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    MAX_CONTENT,
    fail,
    getUserId,
    internalError,
    isEnumValue,
    isNonEmptyString,
    isStringArray,
    ok,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

/** GET /api/journal — List journal entries (createdAt desc). */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        const entries = await prisma.journalEntry.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return ok(entries);
    } catch {
        return internalError();
    }
}

/**
 * POST /api/journal — Create an entry.
 * Body: { title, content, mood (Mood), tags?: string[] (max 10, each max 30 chars) }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const { title, content, mood, tags } = body;

    if (!isNonEmptyString(title)) {
        return fail("VALIDATION_ERROR", "title is required (non-empty string, max 500 chars)");
    }
    if (!isNonEmptyString(content, MAX_CONTENT)) {
        return fail("VALIDATION_ERROR", "content is required (non-empty string, max 10000 chars)");
    }
    if (!isEnumValue(Mood, mood)) {
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

    try {
        const entry = await prisma.journalEntry.create({
            data: {
                userId,
                title: title.trim(),
                content,
                mood,
                tags: tags ?? [],
            },
        });
        return ok(entry, 201);
    } catch {
        return internalError();
    }
}
