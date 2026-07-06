"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { PASSWORD_RULE, validatePassword } from "@/lib/password";
import { AlertCircle, ArrowRight, CheckCircle2, Mail, User } from "lucide-react";

interface FieldErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

interface RegisterResponse {
    success: boolean;
    message?: string;
    error?: { code: string; message: string };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const errors: FieldErrors = {};
        const trimmedName = name.trim();

        if (trimmedName.length < 2 || trimmedName.length > 60) {
            errors.name = "Name must be between 2 and 60 characters.";
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            errors.email = "Please enter a valid email address.";
        }
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            errors.password = passwordCheck.message;
        }
        if (confirmPassword !== password) {
            errors.confirmPassword = "Passwords do not match.";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        setFormError(null);
        setSuccessMessage(null);

        if (!validate()) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });
            const data = (await response.json()) as RegisterResponse;

            if (!data.success) {
                setFormError(
                    data.error?.message ??
                        "Registration failed. Please try again.",
                );
                setIsLoading(false);
                return;
            }

            setSuccessMessage(
                data.message ?? "Account created! Signing you in…",
            );

            const signInResult = await signIn("credentials", {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            });

            if (signInResult?.error) {
                // Account was created but auto sign-in failed — send to login.
                router.push(ROUTES.AUTH.LOGIN);
                return;
            }

            router.push(ROUTES.ONBOARDING);
        } catch {
            setFormError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const inputBaseClass =
        "flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none";

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
                            onClick={() =>
                                signIn("google", {
                                    callbackUrl: ROUTES.ONBOARDING,
                                })
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

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                            noValidate
                        >
                            {formError && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2.5 p-3 rounded-lg bg-negative-500/10 border border-negative-500/30"
                                >
                                    <AlertCircle className="h-4 w-4 text-negative-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-negative-400">
                                        {formError}
                                    </p>
                                </div>
                            )}
                            {successMessage && (
                                <div
                                    role="status"
                                    className="flex items-start gap-2.5 p-3 rounded-lg bg-positive-500/10 border border-positive-500/30"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-positive-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-positive-500">
                                        {successMessage}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label
                                    htmlFor="register-name"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Full Name
                                </label>
                                <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                    <User className="h-4 w-4 text-text-tertiary mr-3" />
                                    <input
                                        id="register-name"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Your name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        className={inputBaseClass}
                                    />
                                </div>
                                {fieldErrors.name && (
                                    <p className="text-xs text-negative-400 mt-1.5">
                                        {fieldErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="register-email"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Email
                                </label>
                                <div className="flex items-center h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus-within:border-wealth-500/50 transition-colors">
                                    <Mail className="h-4 w-4 text-text-tertiary mr-3" />
                                    <input
                                        id="register-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className={inputBaseClass}
                                    />
                                </div>
                                {fieldErrors.email && (
                                    <p className="text-xs text-negative-400 mt-1.5">
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="register-password"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Password
                                </label>
                                <input
                                    id="register-password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Min. 8 characters"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                />
                                {fieldErrors.password ? (
                                    <p className="text-xs text-negative-400 mt-1.5">
                                        {fieldErrors.password}
                                    </p>
                                ) : (
                                    <p className="text-xs text-text-tertiary mt-1.5">
                                        {PASSWORD_RULE}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="register-confirm-password"
                                    className="block text-sm font-medium text-text-secondary mb-1.5"
                                >
                                    Confirm Password
                                </label>
                                <input
                                    id="register-confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="w-full h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                />
                                {fieldErrors.confirmPassword && (
                                    <p className="text-xs text-negative-400 mt-1.5">
                                        {fieldErrors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                isLoading={isLoading}
                            >
                                Create Account
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>

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
