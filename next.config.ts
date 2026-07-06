import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Next.js requires 'unsafe-inline' (hydration/style tags) and 'unsafe-eval'
 * (dev-mode React refresh) today; a nonce-based CSP via middleware is the
 * planned future hardening step.
 */
const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://generativelanguage.googleapis.com https://groww.in http://localhost:8000 https://lh3.googleusercontent.com",
    "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
    // Emit a self-contained server bundle for slim production Docker images.
    output: "standalone",
    poweredByHeader: false,
    reactStrictMode: true,
    images: {
        remotePatterns: [{ hostname: "lh3.googleusercontent.com" }],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
