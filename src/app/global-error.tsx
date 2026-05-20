"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { fadeInUp } from "@/lib/motion";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body className="bg-surface-0 text-text-primary font-sans">
                <div className="min-h-screen flex items-center justify-center px-4">
                    <motion.div
                        className="text-center max-w-md"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="h-20 w-20 rounded-2xl bg-negative-500/10 flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-3">
                            Something went wrong
                        </h1>
                        <p className="text-sm text-text-secondary mb-8">
                            An unexpected error occurred. This has been logged
                            and we&apos;re looking into it.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button onClick={reset} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                            <Link href="/">
                                <Button>
                                    <Home className="h-4 w-4 mr-2" />
                                    Go Home
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </body>
        </html>
    );
}
