"use client";

import Link from "next/link";

/**
 * Global error boundary. Renders in place of the root layout, so
 * globals.css / Tailwind are NOT available here — inline styles only.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    backgroundColor: "#05070b",
                    color: "#eceff2",
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
                }}
            >
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 1rem",
                    }}
                >
                    <div
                        style={{
                            textAlign: "center",
                            maxWidth: "28rem",
                            padding: "2.5rem 2rem",
                            backgroundColor: "#0f1216",
                            border: "1px solid #1f2227",
                            borderRadius: "0.875rem",
                        }}
                    >
                        <h1
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: 700,
                                margin: "0 0 0.75rem",
                            }}
                        >
                            Something went wrong
                        </h1>
                        <p
                            style={{
                                fontSize: "0.875rem",
                                color: "#9b9fa5",
                                margin: "0 0 1.5rem",
                                lineHeight: 1.6,
                            }}
                        >
                            An unexpected error occurred. Please try again — if
                            the problem persists, come back in a few minutes.
                        </p>
                        {error.digest ? (
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    fontFamily:
                                        "ui-monospace, SFMono-Regular, monospace",
                                    color: "#6b7078",
                                    margin: "0 0 1.5rem",
                                }}
                            >
                                Error reference: {error.digest}
                            </p>
                        ) : null}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.75rem",
                            }}
                        >
                            <button
                                onClick={reset}
                                style={{
                                    padding: "0.625rem 1.25rem",
                                    borderRadius: "0.625rem",
                                    border: "none",
                                    backgroundColor: "#005eb3",
                                    color: "#ffffff",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                Try again
                            </button>
                            <Link
                                href="/"
                                style={{
                                    padding: "0.625rem 1.25rem",
                                    borderRadius: "0.625rem",
                                    border: "1px solid #2a2f37",
                                    color: "#9b9fa5",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    textDecoration: "none",
                                }}
                            >
                                Go home
                            </Link>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
