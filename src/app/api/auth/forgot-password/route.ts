import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Privacy-preserving: always returns a generic success response whether or
 * not the account exists, so the endpoint cannot be used to enumerate users.
 *
 * EMAIL DELIVERY REQUIRES SMTP — no email provider is configured in this
 * deployment. Wire Resend/SES (or similar) here: generate a signed,
 * short-lived reset token, persist it, and send the reset link to the user.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotPasswordBody {
    email?: unknown;
}

export async function POST(request: NextRequest) {
    let body: ForgotPasswordBody;
    try {
        body = (await request.json()) as ForgotPasswordBody;
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid request body.",
                },
            },
            { status: 400 },
        );
    }

    const { email } = body;
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Please enter a valid email address.",
                },
            },
            { status: 400 },
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (user?.passwordHash) {
            // EMAIL DELIVERY REQUIRES SMTP — wire Resend/SES here.
            console.info("Password reset requested for", normalizedEmail);
        }
    } catch (error) {
        // Swallow lookup errors — response must stay generic either way.
        console.error("Forgot-password lookup failed:", error);
    }

    // Always generic: never reveal whether an account exists.
    return NextResponse.json({ success: true });
}
