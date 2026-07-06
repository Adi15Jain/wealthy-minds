import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RiskProfile } from "@prisma/client";

/**
 * POST /api/user/onboarding
 * Body: {
 *   name?: string,
 *   focus: string,               // primary financial focus (informational)
 *   riskProfile: RiskProfile,    // CONSERVATIVE | MODERATE | BALANCED | GROWTH | AGGRESSIVE
 *   sipReminders: boolean,
 *   goalMilestones: boolean,
 *   aiInsightNotifs: boolean,
 * }
 * Requires an authenticated session. Marks onboarding complete, stores the
 * risk profile (and name if provided), and upserts notification preferences.
 */

const RISK_PROFILES = [
    "CONSERVATIVE",
    "MODERATE",
    "BALANCED",
    "GROWTH",
    "AGGRESSIVE",
] as const;

const FOCUS_OPTIONS = [
    "WEALTH_BUILDING",
    "RETIREMENT",
    "TAX_SAVING",
    "LEARNING",
] as const;

interface OnboardingBody {
    name?: unknown;
    focus?: unknown;
    riskProfile?: unknown;
    sipReminders?: unknown;
    goalMilestones?: unknown;
    aiInsightNotifs?: unknown;
}

function isRiskProfile(value: unknown): value is RiskProfile {
    return (
        typeof value === "string" &&
        (RISK_PROFILES as readonly string[]).includes(value)
    );
}

function validationError(message: string): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: { code: "VALIDATION_ERROR", message },
        },
        { status: 400 },
    );
}

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            {
                success: false,
                error: { code: "UNAUTHORIZED", message: "Sign in required." },
            },
            { status: 401 },
        );
    }

    let body: OnboardingBody;
    try {
        body = (await request.json()) as OnboardingBody;
    } catch {
        return validationError("Invalid request body.");
    }

    const { name, focus, riskProfile, sipReminders, goalMilestones, aiInsightNotifs } = body;

    if (
        name !== undefined &&
        (typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 60)
    ) {
        return validationError("Name must be between 2 and 60 characters.");
    }
    if (
        typeof focus !== "string" ||
        !(FOCUS_OPTIONS as readonly string[]).includes(focus)
    ) {
        return validationError("A valid financial focus is required.");
    }
    if (!isRiskProfile(riskProfile)) {
        return validationError("A valid risk profile is required.");
    }
    if (
        typeof sipReminders !== "boolean" ||
        typeof goalMilestones !== "boolean" ||
        typeof aiInsightNotifs !== "boolean"
    ) {
        return validationError("Notification preferences must be booleans.");
    }

    const userId = session.user.id;
    const trimmedName =
        typeof name === "string" && name.trim().length > 0
            ? name.trim()
            : undefined;

    try {
        // NOTE: `focus` has no dedicated column in the current schema; it is
        // validated and accepted for forward compatibility but not persisted.
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    ...(trimmedName ? { name: trimmedName } : {}),
                    riskProfile,
                    onboardingComplete: true,
                },
            }),
            prisma.userPreferences.upsert({
                where: { userId },
                create: {
                    userId,
                    sipReminders,
                    goalMilestones,
                    aiInsightNotifs,
                },
                update: {
                    sipReminders,
                    goalMilestones,
                    aiInsightNotifs,
                },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Onboarding completion failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Something went wrong. Please try again.",
                },
            },
            { status: 500 },
        );
    }
}
