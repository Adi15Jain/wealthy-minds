import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    fail,
    getUserId,
    internalError,
    isBoolean,
    isStringArray,
    ok,
    readBody,
    unauthorized,
} from "@/app/api/_lib/crud";

const THEMES = ["dark", "light", "system"] as const;
const CURRENCIES = ["INR"] as const;

const BOOLEAN_FIELDS = [
    "emailNotifs",
    "pushNotifs",
    "sipReminders",
    "goalMilestones",
    "marketAlerts",
    "aiInsightNotifs",
] as const;

type BooleanField = (typeof BOOLEAN_FIELDS)[number];

type PreferencesUpdate = Partial<Record<BooleanField, boolean>> & {
    theme?: string;
    currency?: string;
    dashboardLayout?: string[];
};

/** GET /api/user/preferences — Fetch (lazily creating defaults). */
export async function GET(): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    try {
        const preferences = await prisma.userPreferences.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
        return ok(preferences);
    } catch {
        return internalError();
    }
}

/**
 * PATCH /api/user/preferences — Partial update.
 * Body: any of { emailNotifs, pushNotifs, sipReminders, goalMilestones,
 *   marketAlerts, aiInsightNotifs (booleans), theme ("dark"|"light"|"system"),
 *   currency ("INR"), dashboardLayout (string[], max 30) }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = await readBody(request);
    if (!body) {
        return fail("VALIDATION_ERROR", "Request body must be a JSON object");
    }

    const update: PreferencesUpdate = {};

    for (const field of BOOLEAN_FIELDS) {
        const value = body[field];
        if (value === undefined) continue;
        if (!isBoolean(value)) {
            return fail("VALIDATION_ERROR", `${field} must be a boolean`);
        }
        update[field] = value;
    }

    const { theme, currency, dashboardLayout } = body;

    if (theme !== undefined) {
        if (
            typeof theme !== "string" ||
            !(THEMES as readonly string[]).includes(theme)
        ) {
            return fail(
                "VALIDATION_ERROR",
                `theme must be one of: ${THEMES.join(", ")}`,
            );
        }
        update.theme = theme;
    }

    if (currency !== undefined) {
        if (
            typeof currency !== "string" ||
            !(CURRENCIES as readonly string[]).includes(currency)
        ) {
            return fail(
                "VALIDATION_ERROR",
                `currency must be one of: ${CURRENCIES.join(", ")}`,
            );
        }
        update.currency = currency;
    }

    if (dashboardLayout !== undefined) {
        if (!isStringArray(dashboardLayout, 30, 100)) {
            return fail(
                "VALIDATION_ERROR",
                "dashboardLayout must be an array of at most 30 strings, each 1-100 chars",
            );
        }
        update.dashboardLayout = dashboardLayout;
    }

    if (Object.keys(update).length === 0) {
        return fail("VALIDATION_ERROR", "No updatable fields provided");
    }

    try {
        const preferences = await prisma.userPreferences.upsert({
            where: { userId },
            update,
            create: { userId, ...update },
        });
        return ok(preferences);
    } catch {
        return internalError();
    }
}
