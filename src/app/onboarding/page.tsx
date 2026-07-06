"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { fadeInUp } from "@/lib/motion";
import {
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Bell,
    ShieldCheck,
    CheckCircle,
    CheckCircle2,
    User,
} from "lucide-react";
import Link from "next/link";

const steps = [
    { id: 1, title: "Your Profile", icon: User },
    { id: 2, title: "Risk Profile", icon: ShieldCheck },
    { id: 3, title: "Preferences", icon: Bell },
    { id: 4, title: "Complete", icon: CheckCircle },
];

// ── Step 1: financial focus options ──────────────────────────
const FOCUS_OPTIONS = [
    { value: "WEALTH_BUILDING", label: "Wealth Building" },
    { value: "RETIREMENT", label: "Retirement" },
    { value: "TAX_SAVING", label: "Tax Saving" },
    { value: "LEARNING", label: "Learning" },
] as const;

type FocusValue = (typeof FOCUS_OPTIONS)[number]["value"];

// ── Step 2: risk questions (pattern from dashboard/risk-profile) ──
interface RiskQuestion {
    id: string;
    question: string;
    options: { label: string; score: number; description: string }[];
}

const RISK_QUESTIONS: RiskQuestion[] = [
    {
        id: "horizon",
        question: "What is your investment time horizon?",
        options: [
            { label: "Less than 3 years", score: 1, description: "Short-term goals or upcoming expenses" },
            { label: "3 to 7 years", score: 2, description: "Medium-term like education or a house" },
            { label: "7 to 15 years", score: 3, description: "Long-term wealth creation" },
            { label: "More than 15 years", score: 4, description: "Retirement corpus or generational wealth" },
        ],
    },
    {
        id: "drawdown",
        question: "Your portfolio drops 25% in a crash. What do you do?",
        options: [
            { label: "Sell everything", score: 1, description: "Safety is my priority" },
            { label: "Sell some, keep some", score: 2, description: "Reduce exposure but stay invested" },
            { label: "Hold and wait", score: 3, description: "Markets recover — I'll be patient" },
            { label: "Buy more", score: 4, description: "A crash is a discount" },
        ],
    },
    {
        id: "experience",
        question: "How would you describe your investment experience?",
        options: [
            { label: "Complete beginner", score: 1, description: "Never invested beyond FDs or savings" },
            { label: "Basic understanding", score: 2, description: "Hold some MFs or stocks" },
            { label: "Intermediate investor", score: 3, description: "Track markets, understand SIP and risk" },
            { label: "Experienced investor", score: 4, description: "Actively manage my own allocation" },
        ],
    },
];

type RiskProfileValue = "CONSERVATIVE" | "BALANCED" | "GROWTH" | "AGGRESSIVE";

function scoreToRiskProfile(total: number): RiskProfileValue {
    // Total ranges from 3 to 12.
    if (total <= 4) return "CONSERVATIVE";
    if (total <= 7) return "BALANCED";
    if (total <= 10) return "GROWTH";
    return "AGGRESSIVE";
}

// ── Step 3: preference toggles ───────────────────────────────
interface ToggleOption {
    key: "sipReminders" | "goalMilestones" | "aiInsightNotifs";
    label: string;
    description: string;
}

const TOGGLE_OPTIONS: ToggleOption[] = [
    {
        key: "sipReminders",
        label: "SIP Reminders",
        description: "Get notified before your SIP installments are due.",
    },
    {
        key: "goalMilestones",
        label: "Goal Milestone Alerts",
        description: "Celebrate progress as your financial goals advance.",
    },
    {
        key: "aiInsightNotifs",
        label: "AI Insight Notifications",
        description: "Receive intelligent observations about your portfolio.",
    },
];

function OnboardingFlow() {
    const router = useRouter();
    const { data: session } = useSession();

    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 state — the name defaults to the session value until edited.
    const [nameInput, setNameInput] = useState<string | null>(null);
    const name = nameInput ?? session?.user?.name ?? "";
    const [focus, setFocus] = useState<FocusValue | null>(null);

    // Step 2 state
    const [answers, setAnswers] = useState<Record<string, number>>({});

    // Step 3 state
    const [prefs, setPrefs] = useState({
        sipReminders: true,
        goalMilestones: true,
        aiInsightNotifs: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);
    const allAnswered = RISK_QUESTIONS.every(
        (q) => answers[q.id] !== undefined,
    );

    const canContinue =
        (currentStep === 1 && focus !== null) ||
        (currentStep === 2 && allAnswered) ||
        currentStep === 3;

    const handleComplete = async () => {
        if (isSubmitting || focus === null) return;
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const trimmedName = name.trim();
            const response = await fetch("/api/user/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(trimmedName.length >= 2 ? { name: trimmedName } : {}),
                    focus,
                    riskProfile: scoreToRiskProfile(totalScore),
                    ...prefs,
                }),
            });
            const data = (await response.json()) as {
                success: boolean;
                error?: { message: string };
            };
            if (!data.success) {
                setSubmitError(
                    data.error?.message ??
                        "Could not save your setup. Please try again.",
                );
                setIsSubmitting(false);
                return;
            }
            setCurrentStep(4);
        } catch {
            setSubmitError("Could not save your setup. Please try again.");
        }
        setIsSubmitting(false);
    };

    const handleContinue = () => {
        if (currentStep === 3) {
            void handleComplete();
        } else {
            setCurrentStep((s) => Math.min(4, s + 1));
        }
    };

    return (
        <div className="min-h-screen bg-surface-0 flex flex-col">
            {/* Progress bar */}
            <div className="border-b border-border-subtle bg-surface-50">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-text-secondary">
                            Step {currentStep} of 4
                        </span>
                        <Link
                            href={ROUTES.DASHBOARD}
                            className="text-sm text-text-tertiary hover:text-text-primary"
                        >
                            Skip for now
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${
                                    step.id <= currentStep
                                        ? "bg-wealth-500"
                                        : "bg-surface-200"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Step content */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <motion.div
                    key={currentStep}
                    className="max-w-lg w-full"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="text-center mb-8">
                        <div className="h-14 w-14 rounded-2xl bg-wealth-600/10 flex items-center justify-center mx-auto mb-4">
                            {(() => {
                                const StepIcon = steps[currentStep - 1].icon;
                                return (
                                    <StepIcon className="h-7 w-7 text-wealth-400" />
                                );
                            })()}
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            {steps[currentStep - 1].title}
                        </h1>
                        <p className="text-sm text-text-secondary mt-2">
                            {currentStep === 1 &&
                                "Tell us a little about yourself and what you're here to achieve."}
                            {currentStep === 2 &&
                                "Help us understand your risk appetite for personalized recommendations."}
                            {currentStep === 3 &&
                                "Choose how WealthyMinds keeps you informed."}
                            {currentStep === 4 &&
                                "You're all set! Let's start building your wealth intelligence."}
                        </p>
                    </div>

                    <Card padding="lg" variant="elevated">
                        {currentStep < 4 ? (
                            <div className="space-y-6">
                                {/* ── Step 1: Your profile ── */}
                                {currentStep === 1 && (
                                    <div className="space-y-5">
                                        <div>
                                            <label
                                                htmlFor="onboarding-name"
                                                className="block text-sm font-medium text-text-secondary mb-1.5"
                                            >
                                                Your Name
                                            </label>
                                            <input
                                                id="onboarding-name"
                                                type="text"
                                                autoComplete="name"
                                                placeholder="Your name"
                                                value={name}
                                                onChange={(e) =>
                                                    setNameInput(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full h-11 px-4 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                                            />
                                        </div>
                                        <fieldset>
                                            <legend className="block text-sm font-medium text-text-secondary mb-2">
                                                Primary Financial Focus
                                            </legend>
                                            <div className="grid grid-cols-2 gap-3">
                                                {FOCUS_OPTIONS.map(
                                                    (option) => {
                                                        const isSelected =
                                                            focus ===
                                                            option.value;
                                                        return (
                                                            <button
                                                                key={
                                                                    option.value
                                                                }
                                                                type="button"
                                                                aria-pressed={
                                                                    isSelected
                                                                }
                                                                onClick={() =>
                                                                    setFocus(
                                                                        option.value,
                                                                    )
                                                                }
                                                                className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                                                                    isSelected
                                                                        ? "border-wealth-500 bg-wealth-500/10 text-wealth-400"
                                                                        : "border-border-subtle bg-surface-50 text-text-primary hover:border-wealth-500/30 hover:bg-wealth-500/5"
                                                                }`}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </fieldset>
                                    </div>
                                )}

                                {/* ── Step 2: Risk profile ── */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        {RISK_QUESTIONS.map((question) => (
                                            <fieldset key={question.id}>
                                                <legend className="text-sm font-bold text-text-primary mb-3">
                                                    {question.question}
                                                </legend>
                                                <div className="space-y-2">
                                                    {question.options.map(
                                                        (option) => {
                                                            const isSelected =
                                                                answers[
                                                                    question.id
                                                                ] ===
                                                                option.score;
                                                            return (
                                                                <button
                                                                    key={
                                                                        option.score
                                                                    }
                                                                    type="button"
                                                                    aria-pressed={
                                                                        isSelected
                                                                    }
                                                                    onClick={() =>
                                                                        setAnswers(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [question.id]:
                                                                                    option.score,
                                                                            }),
                                                                        )
                                                                    }
                                                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                                                                        isSelected
                                                                            ? "border-wealth-500 bg-wealth-500/10"
                                                                            : "border-border-subtle bg-surface-50 hover:border-wealth-500/30 hover:bg-wealth-500/5"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                                isSelected
                                                                                    ? "border-wealth-500 bg-wealth-500"
                                                                                    : "border-border-subtle"
                                                                            }`}
                                                                        >
                                                                            {isSelected && (
                                                                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p
                                                                                className={`text-sm font-bold ${
                                                                                    isSelected
                                                                                        ? "text-wealth-400"
                                                                                        : "text-text-primary"
                                                                                }`}
                                                                            >
                                                                                {
                                                                                    option.label
                                                                                }
                                                                            </p>
                                                                            <p className="text-[11px] text-text-tertiary mt-0.5">
                                                                                {
                                                                                    option.description
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </fieldset>
                                        ))}
                                    </div>
                                )}

                                {/* ── Step 3: Preferences ── */}
                                {currentStep === 3 && (
                                    <div className="space-y-3">
                                        {TOGGLE_OPTIONS.map((toggle) => {
                                            const isOn = prefs[toggle.key];
                                            return (
                                                <button
                                                    key={toggle.key}
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isOn}
                                                    aria-label={toggle.label}
                                                    onClick={() =>
                                                        setPrefs((prev) => ({
                                                            ...prev,
                                                            [toggle.key]:
                                                                !prev[
                                                                    toggle.key
                                                                ],
                                                        }))
                                                    }
                                                    className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-border-subtle bg-surface-50 hover:border-wealth-500/30 transition-all duration-200 text-left"
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">
                                                            {toggle.label}
                                                        </p>
                                                        <p className="text-[11px] text-text-tertiary mt-0.5">
                                                            {
                                                                toggle.description
                                                            }
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${
                                                            isOn
                                                                ? "bg-wealth-500"
                                                                : "bg-surface-300"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                                                isOn
                                                                    ? "translate-x-[22px]"
                                                                    : "translate-x-0.5"
                                                            }`}
                                                        />
                                                    </span>
                                                </button>
                                            );
                                        })}

                                        {submitError && (
                                            <div
                                                role="alert"
                                                className="flex items-start gap-2.5 p-3 rounded-lg bg-negative-500/10 border border-negative-500/30"
                                            >
                                                <AlertCircle className="h-4 w-4 text-negative-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-negative-400">
                                                    {submitError}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setCurrentStep((s) =>
                                                Math.max(1, s - 1),
                                            )
                                        }
                                        disabled={
                                            currentStep === 1 || isSubmitting
                                        }
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleContinue}
                                        disabled={!canContinue}
                                        isLoading={isSubmitting}
                                    >
                                        {currentStep === 3
                                            ? "Complete Setup"
                                            : "Continue"}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="h-16 w-16 rounded-full bg-positive-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-positive-500" />
                                </div>
                                <h2 className="text-lg font-bold text-text-primary mb-2">
                                    Setup Complete!
                                </h2>
                                <p className="text-sm text-text-secondary mb-6">
                                    Your wealth intelligence platform is ready.
                                    Let&apos;s dive in.
                                </p>
                                <Button
                                    size="lg"
                                    onClick={() =>
                                        router.push(ROUTES.DASHBOARD)
                                    }
                                >
                                    Go to Dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <SessionProvider>
            <OnboardingFlow />
        </SessionProvider>
    );
}
