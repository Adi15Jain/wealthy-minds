"use client";

import { Suspense, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { signIn } from "next-auth/react";
import { AlertCircle, ArrowRight, Mail } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.DASHBOARD;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        setError(null);

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
                return;
            }

            router.push(callbackUrl);
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 relative overflow-hidden">
            {/* Background effects */}
            <div
                className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full animate-glow-pulse"
                style={{
                    background:
                        "radial-gradient(circle, oklch(0.55 0.14 250 / 0.1) 0%, transparent 70%)",
                }}
            />
            <div className="absolute inset-0 dot-pattern opacity-20" />

            <motion.div
                className="relative z-10 w-full max-w-md px-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* Logo */}
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
                        Welcome back
                    </h1>
                    <p className="text-sm text-text-secondary mt-2">
                        Sign in to your wealth intelligence platform.
                    </p>
                </motion.div>

                <motion.div variants={staggerItem}>
                    <Card padding="lg" variant="elevated">
                        {/* OAuth buttons */}
                        <Button
                            variant="outline"
                            className="w-full mb-4"
                            size="lg"
                            onClick={() =>
                                signIn("google", { callbackUrl })
                            }
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
                            Continue with Google
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

                        {/* Email + password form */}
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                                    htmlFor="login-email"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Email
                                </label>
                                <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                    <Mail className="h-4 w-4 text-text-tertiary mr-3" />
                                    <input
                                        id="login-email"
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
                            <div>
                                <label
                                    htmlFor="login-password"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Password
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end">
                                <Link
                                    href={ROUTES.AUTH.FORGOT_PASSWORD}
                                    className="text-sm text-wealth-400 hover:text-wealth-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                isLoading={isLoading}
                            >
                                Sign In
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>

                        <p className="text-center text-sm text-text-secondary mt-6">
                            Don&apos;t have an account?{" "}
                            <Link
                                href={ROUTES.AUTH.REGISTER}
                                className="text-wealth-400 hover:text-wealth-300 font-medium"
                            >
                                Sign up
                            </Link>
                        </p>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
