"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { ArrowRight, Mail, User } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 relative overflow-hidden">
            <div
                className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full animate-glow-pulse"
                style={{
                    background:
                        "radial-gradient(circle, oklch(0.48 0.16 280 / 0.1) 0%, transparent 70%)",
                }}
            />
            <div className="absolute inset-0 dot-pattern opacity-20" />

            <motion.div
                className="relative z-10 w-full max-w-md px-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={staggerItem} className="text-center mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 mb-6"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                W
                            </span>
                        </div>
                        <span className="font-bold text-text-primary text-xl tracking-tight">
                            WealthyMinds
                        </span>
                    </Link>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Create your account
                    </h1>
                    <p className="text-sm text-text-secondary mt-2">
                        Begin your intelligent wealth creation journey.
                    </p>
                </motion.div>

                <motion.div variants={staggerItem}>
                    <Card padding="lg" variant="elevated">
                        <Button
                            variant="outline"
                            className="w-full mb-4"
                            size="lg"
                        >
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign up with Google
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border-subtle" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-surface-100 px-3 text-text-tertiary">
                                    or
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    Full Name
                                </label>
                                <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                    <User className="h-4 w-4 text-text-tertiary mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Adi Jain"
                                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                    />
                                </div>
                            </div>
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
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Min. 8 characters"
                                    className="w-full h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                />
                            </div>

                            <Button className="w-full" size="lg">
                                Create Account
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <p className="text-center text-sm text-text-secondary mt-6">
                            Already have an account?{" "}
                            <Link
                                href={ROUTES.AUTH.LOGIN}
                                className="text-wealth-400 hover:text-wealth-300 font-medium"
                            >
                                Sign in
                            </Link>
                        </p>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}
