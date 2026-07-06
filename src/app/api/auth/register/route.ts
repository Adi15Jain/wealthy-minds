import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";

/**
 * POST /api/auth/register
 * Body: { name: string, email: string, password: string }
 * Returns: { success: true, message?: string }
 *       or { success: false, error: { code: string, message: string } }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterBody {
    name?: unknown;
    email?: unknown;
    password?: unknown;
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
    let body: RegisterBody;
    try {
        body = (await request.json()) as RegisterBody;
    } catch {
        return validationError("Invalid request body.");
    }

    const { name, email, password } = body;

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
        return validationError("Name must be between 2 and 60 characters.");
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return validationError("Please enter a valid email address.");
    }
    if (typeof password !== "string") {
        return validationError("Password is required.");
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        return validationError(passwordCheck.message);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            if (existingUser.passwordHash) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: "EXISTS",
                            message:
                                "Account already exists — sign in instead",
                        },
                    },
                    { status: 409 },
                );
            }

            // Existing Google-only account: attach a password to it.
            const passwordHash = await hashPassword(password);
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { passwordHash },
            });
            return NextResponse.json({
                success: true,
                message: "Password added to your existing Google account",
            });
        }

        const passwordHash = await hashPassword(password);
        await prisma.user.create({
            data: {
                name: trimmedName,
                email: normalizedEmail,
                passwordHash,
                emailVerified: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Registration failed:", error);
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
