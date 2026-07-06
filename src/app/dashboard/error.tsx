"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Surface the error for observability tooling / console diagnostics.
        console.error("[dashboard]", error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="card-surface max-w-md w-full p-8 text-center">
                <div className="h-14 w-14 rounded-xl bg-negative-500/10 border border-negative-500/20 flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="h-6 w-6 text-negative-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                    This view hit a snag
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                    Something went wrong while loading this part of your
                    dashboard. Your data is safe — try again, or head back to
                    the overview.
                </p>
                {error.digest ? (
                    <p className="text-xs font-mono text-text-tertiary mb-6">
                        Error reference: {error.digest}
                    </p>
                ) : null}
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex items-center px-5 py-2.5 rounded-lg bg-wealth-600 text-white text-sm font-medium hover:bg-wealth-500 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border-default text-sm font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
