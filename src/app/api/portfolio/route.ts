import { NextRequest, NextResponse } from "next/server";

/**
 * Portfolio API routes.
 * Scaffold — business logic to be implemented.
 */

// GET /api/portfolio — List user portfolios
export async function GET(request: NextRequest) {
    // TODO: Authenticate user, fetch from database
    return NextResponse.json({
        data: [],
        success: true,
        message: "Portfolio endpoint ready",
        timestamp: new Date().toISOString(),
    });
}

// POST /api/portfolio — Create a new portfolio
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // TODO: Validate, authenticate, save to database
        return NextResponse.json(
            {
                data: { id: "scaffold", ...body },
                success: true,
                message: "Portfolio created",
                timestamp: new Date().toISOString(),
            },
            { status: 201 },
        );
    } catch {
        return NextResponse.json(
            {
                code: "INVALID_REQUEST",
                message: "Invalid request body",
            },
            { status: 400 },
        );
    }
}
