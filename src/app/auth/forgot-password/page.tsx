"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/motion";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        setError(null);

        const trimmedEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail }),
            });
        } catch {
            // Privacy-preserving flow: the success state is shown regardless.
        }
        setSubmittedEmail(trimmedEmail);
        setSubmitted(true);
        setIsLoading(false);
    };

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
                        <AnimatePresence mode="wait">
                            {submitted ? (
                                <motion.div
                                    key="success"
                                    variants={scaleIn}
                                    initial="hidden"
                                    animate="visible"
                                    className="text-center py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                            delay: 0.1,
                                        }}
                                        className="h-16 w-16 rounded-full bg-positive-500/10 flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle2 className="h-8 w-8 text-positive-500" />
                                    </motion.div>
                                    <h2 className="text-lg font-bold text-text-primary mb-2">
                                        Check your inbox
                                    </h2>
                                    <p className="text-sm text-text-secondary">
                                        If an account exists for{" "}
                                        <span className="text-text-primary font-medium">
                                            {submittedEmail}
                                        </span>
                                        , reset instructions will be sent.
                                    </p>
                                    <p className="text-xs text-text-tertiary mt-3">
                                        (Email delivery is not yet configured
                                        in this deployment — contact support.)
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                    noValidate
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {error && (
                                        <div
                                            role="alert"
                                            className="flex items-start gap-2.5 p-3 rounded-lg bg-negative-500/10 border border-negative-500/30"
                                        >
                                            <AlertCircle className="h-4 w-4 text-negative-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-negative-400">
                                                {error}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label
                                            htmlFor="forgot-email"
                                            className="block text-sm font-medium text-text-secondary mb-1.5"
                                        >
                                            Email
                                        </label>
                                        <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                            <Mail className="h-4 w-4 text-text-tertiary mr-3" />
                                            <input
                                                id="forgot-email"
                                                type="email"
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        isLoading={isLoading}
                                    >
                                        Send Reset Link
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>

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
