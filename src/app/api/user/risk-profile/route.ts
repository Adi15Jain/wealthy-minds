import { NextRequest, NextResponse } from "next/server";
import { RiskProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    fail,
    getUserId,
    internalError,
    isEnumValue,
    notFound,
    ok,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

/** GET /api/user/risk-profile — { riskProfile: RiskProfile | null } */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { riskProfile: true },
        });
        if (!user) return notFound("User");
        return ok({ riskProfile: user.riskProfile });
    } catch {
        return internalError();
    }
}

/**
 * PUT /api/user/risk-profile — Update the user's risk profile.
 * Body: { riskProfile: RiskProfile }
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const { riskProfile } = body;
    if (!isEnumValue(RiskProfile, riskProfile)) {
        return fail(
            "VALIDATION_ERROR",
            `riskProfile must be one of: ${Object.values(RiskProfile).join(", ")}`,
        );
    }

    try {
        const existing = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existing) return notFound("User");

        const user = await prisma.user.update({
            where: { id: userId },
            data: { riskProfile },
            select: { riskProfile: true },
        });
        return ok({ riskProfile: user.riskProfile });
    } catch {
        return internalError();
    }
}
