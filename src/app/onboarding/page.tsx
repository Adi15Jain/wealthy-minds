"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { Button, Card } from "@/components/ui";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import {
    ArrowRight,
    ArrowLeft,
    Target,
    ShieldCheck,
    BarChart3,
    CheckCircle,
} from "lucide-react";
import Link from "next/link";

const steps = [
    { id: 1, title: "Risk Profile", icon: ShieldCheck },
    { id: 2, title: "Financial Goals", icon: Target },
    { id: 3, title: "Portfolio Setup", icon: BarChart3 },
    { id: 4, title: "Complete", icon: CheckCircle },
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(1);

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
                                "Help us understand your risk appetite for personalized recommendations."}
                            {currentStep === 2 &&
                                "Set your financial goals so we can track and optimize your journey."}
                            {currentStep === 3 &&
                                "Connect or manually add your investment portfolio."}
                            {currentStep === 4 &&
                                "You're all set! Let's start building your wealth intelligence."}
                        </p>
                    </div>

                    <Card padding="lg" variant="elevated">
                        {currentStep < 4 ? (
                            <div className="space-y-6">
                                {/* Placeholder content — to be built out with actual forms */}
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-12 rounded-lg bg-surface-200/60 animate-pulse"
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            setCurrentStep((s) =>
                                                Math.max(1, s - 1),
                                            )
                                        }
                                        disabled={currentStep === 1}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setCurrentStep((s) =>
                                                Math.min(4, s + 1),
                                            )
                                        }
                                    >
                                        Continue
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
                                <Link href={ROUTES.DASHBOARD}>
                                    <Button size="lg">
                                        Go to Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
