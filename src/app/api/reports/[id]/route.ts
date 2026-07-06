import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    getUserId,
    internalError,
    notFound,
    ok,
    unauthorized,
} from "@/app/api/_lib/crud";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/reports/[id] — Single report including its data snapshot. */
export async function GET(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;

    try {
        const report = await prisma.report.findFirst({
            where: { id, userId },
        });
        if (!report) return notFound("Report");
        return ok(report);
    } catch {
        return internalError();
    }
}

/** DELETE /api/reports/[id] */
export async function DELETE(
    _request: NextRequest,
    context: RouteContext,
): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await context.params;

    try {
        const existing = await prisma.report.findFirst({
            where: { id, userId },
            select: { id: true },
        });
        if (!existing) return notFound("Report");

        await prisma.report.delete({ where: { id: existing.id } });
        return ok({ id: existing.id, deleted: true });
    } catch {
        return internalError();
    }
}
