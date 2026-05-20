"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 relative overflow-hidden">
            <div className="absolute inset-0 dot-pattern opacity-20" />

            <motion.div
                className="relative z-10 w-full max-w-md px-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={staggerItem} className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-text-primary">
                        Reset Password
                    </h1>
                    <p className="text-sm text-text-secondary mt-2">
                        Enter your email and we&apos;ll send you reset
                        instructions.
                    </p>
                </motion.div>

                <motion.div variants={staggerItem}>
                    <Card padding="lg" variant="elevated">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    Email
                                </label>
                                <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                    <Mail className="h-4 w-4 text-text-tertiary mr-3" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                    />
                                </div>
                            </div>
                            <Button className="w-full" size="lg">
                                Send Reset Link
                            </Button>
                        </div>

                        <Link
                            href={ROUTES.AUTH.LOGIN}
                            className="flex items-center justify-center gap-2 text-sm text-text-secondary mt-6 hover:text-text-primary"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
