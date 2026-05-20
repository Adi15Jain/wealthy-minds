import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Middleware/Proxy for route protection and redirects.
 * Runs on every matched route before the page renders.
 */

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/onboarding"];
// Routes only accessible when NOT authenticated
const authRoutes = ["/auth"];

export const proxy = auth((request) => {
    const { pathname } = request.nextUrl;
    
    // request.auth is populated by Auth.js
    const isAuthenticated = !!request.auth;

    // Redirect authenticated users away from auth pages
    if (
        authRoutes.some((route) => pathname.startsWith(route)) &&
        isAuthenticated
    ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect unauthenticated users to login
    if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

// Since NextAuth returns a named 'auth' export, and Next.js 16 wants a 'proxy' export,
// we export the auth wrapper as 'proxy' above. We also export it as default to be safe.
export default proxy;

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes
         * - _next (Next.js internals)
         * - static files
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
    ],
};
