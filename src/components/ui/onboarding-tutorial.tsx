"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    TrendingUp,
    LineChart,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    X,
    LayoutDashboard,
    Star,
    ArrowRight,
    Rocket,
    Shield,
    Zap,
    BarChart3,
    Target,
    Grid3X3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Tutorial Step Definition ─────────────────────────────────────────────────
interface TutorialStep {
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    description: string;
    features?: string[];
    tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        icon: Rocket,
        iconColor: "text-wealth-400",
        iconBg: "bg-wealth-600/15",
        title: "Welcome to WealthyMinds",
        subtitle: "Your AI-Powered Wealth Intelligence Teller",
        description:
            "WealthyMinds helps you make smarter investment decisions by analyzing stocks, mutual funds, and bonds with real-time data and AI-powered insights. It's not a portfolio manager — it's your personal investment analyst.",
        features: [
            "Real-time market data from Groww API",
            "AI-powered analysis using Google Gemini",
            "SIP comparison, projection, and Monte Carlo simulation",
        ],
        tip: "All data is fetched live — no hardcoded numbers. Results may take a few seconds on first load.",
    },
    {
        icon: Search,
        iconColor: "text-blue-400",
        iconBg: "bg-blue-500/15",
        title: "Search & Discover",
        subtitle: "Find any stock, mutual fund, or bond instantly",
        description:
            "The central search bar on the Dashboard lets you search across the entire Indian market. Start typing any name (e.g., \"HDFC Mid Cap\", \"Reliance\", \"Axis Bluechip\") and get autocomplete suggestions powered by Groww's live search.",
        features: [
            "Type at least 2 characters to see suggestions",
            "Click any result to get a full AI analysis",
            "Press Enter to ask the AI Teller a free-form question",
        ],
        tip: "You can search for stocks by company name, ticker symbol, or mutual funds by scheme name.",
    },
    {
        icon: BarChart3,
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-500/15",
        title: "Asset Intelligence Modal",
        subtitle: "Deep-dive into any asset with one click",
        description:
            "When you click a search result or trending asset, WealthyMinds fetches real-time fundamentals (for stocks: PE ratio, ROE, market cap from Groww) and combines them with AI-generated analysis including CAGR, volatility, strengths, risks, and investment recommendations.",
        features: [
            "Real Groww API fundamentals for stocks (PE, ROE, 52-week range)",
            "AI-generated 3Y/5Y CAGR, drawdown, and volatility metrics",
            "Strengths, risks, fair value assessment, and SIP suitability",
        ],
        tip: "Star any asset to add it to your watchlist for quick access later.",
    },
    {
        icon: TrendingUp,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/15",
        title: "SIP Comparative Analyzer",
        subtitle: "Compare up to 3 assets side-by-side",
        description:
            "Navigate to the SIP Analyzer to compare up to 3 stocks, mutual funds, or bonds. Set your monthly SIP amount, time horizon, and yearly step-up to see projected compound growth curves.",
        features: [
            "Search and add any asset from the Indian market",
            "Adjust SIP amount (₹1K to ₹1L), duration (1-30 yrs), and step-up",
            "Run \"AI Teller Audit\" for a decisive comparative recommendation",
        ],
        tip: "The AI Teller Audit gives you a structured ranking with scores, risk-reward analysis, and optimal SIP strategy.",
    },
    {
        icon: LineChart,
        iconColor: "text-violet-400",
        iconBg: "bg-violet-500/15",
        title: "Monte Carlo SIP Simulator",
        subtitle: "Forecast growth with statistical confidence bands",
        description:
            "The Monte Carlo Simulator shows you optimistic, expected, and conservative growth trajectories for your SIP. It uses variance modeling to give you a realistic range of outcomes instead of a single estimate.",
        features: [
            "Search any asset to auto-populate CAGR and volatility",
            "Adjust parameters manually with precision sliders",
            "See FD outperformance probability and wealth growth multiplier",
        ],
        tip: "From the Dashboard modal, click \"Monte Carlo Simulation\" to pre-load that asset's CAGR and volatility automatically.",
    },
    {
        icon: Sparkles,
        iconColor: "text-pink-400",
        iconBg: "bg-pink-500/15",
        title: "AI Teller Chat",
        subtitle: "Ask anything about investments",
        description:
            "The AI Teller Chat is a free-form conversational interface powered by Google Gemini. Ask it to compare funds, explain concepts, analyze historical performance, or recommend SIP strategies.",
        features: [
            "Full conversation memory — follow up on previous answers",
            "Automatically triggered from Dashboard's suggested asks",
            "Gives educational insights, not financial advice",
        ],
        tip: "Try asking: \"Compare PPFAS Flexi Cap vs UTI Nifty 50 Index for a 15-year SIP\"",
    },
    {
        icon: Target,
        iconColor: "text-orange-400",
        iconBg: "bg-orange-500/15",
        title: "Goal-Based SIP Calculator",
        subtitle: "Reverse-engineer your monthly SIP",
        description:
            "Tell WealthyMinds your target corpus (₹1 Crore, ₹5 Crore, etc.) and timeline, and it calculates exactly how much monthly SIP you need — with or without yearly step-ups, and optionally adjusted for inflation.",
        features: [
            "Quick presets: ₹25L, ₹50L, ₹1Cr, ₹2Cr, ₹5Cr",
            "Auto-fill CAGR from any real asset search",
            "Inflation-adjusted calculation toggle (6% CPI)",
        ],
        tip: "With a 10% yearly step-up, your starting SIP can be much lower while still reaching the same goal.",
    },
    {
        icon: Grid3X3,
        iconColor: "text-cyan-400",
        iconBg: "bg-cyan-500/15",
        title: "Fund Explorer & Tax Calculator",
        subtitle: "Browse top funds and understand tax impact",
        description:
            "The Fund Explorer lets you browse top-performing mutual funds by category (Large Cap, Mid Cap, ELSS, etc.). The Tax Calculator shows you LTCG/STCG impact on your investments with Budget 2024 rates.",
        features: [
            "8 MF categories with AI-ranked top 5 funds each",
            "One-click to compare any fund in the SIP Analyzer",
            "Tax calculator with equity, debt, and ELSS rules",
        ],
        tip: "Debt MFs no longer get indexation benefit — all gains are taxed at your income slab rate since April 2023.",
    },
    {
        icon: Shield,
        iconColor: "text-red-400",
        iconBg: "bg-red-500/15",
        title: "Risk Profile Quiz",
        subtitle: "Discover your investment personality",
        description:
            "Take a quick 5-question quiz to understand your risk tolerance. Get a personalized risk profile (Conservative → Aggressive) with tailored asset allocation and investment recommendations.",
        features: [
            "5 behavioral and financial questions",
            "Personalized equity/debt/gold allocation split",
            "Specific fund and strategy recommendations",
        ],
        tip: "Your risk profile should be reassessed whenever your income, goals, or life situation changes significantly.",
    },
];

const STORAGE_KEY = "wealthyminds_tutorial_complete";

// ── Main Tutorial Component ──────────────────────────────────────────────────
export function OnboardingTutorial() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

    useEffect(() => {
        // Check if the user has already completed the tutorial
        try {
            const completed = localStorage.getItem(STORAGE_KEY);
            if (!completed) {
                // Small delay to let the dashboard render first
                const timer = setTimeout(() => setIsVisible(true), 800);
                return () => clearTimeout(timer);
            }
        } catch {
            // localStorage not available — don't show tutorial
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        try {
            localStorage.setItem(STORAGE_KEY, "true");
        } catch {}
    };

    const handleNext = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleGoToStep = (index: number) => {
        setDirection(index > currentStep ? 1 : -1);
        setCurrentStep(index);
    };

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

    // Slide animation variants
    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 80 : -80,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -80 : 80,
            opacity: 0,
        }),
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-surface-0/70 backdrop-blur-xl"
                        onClick={handleClose}
                    />

                    {/* Tutorial Card */}
                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 30, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-xl rounded-2xl border border-border-subtle bg-surface-50 shadow-2xl overflow-hidden"
                    >
                        {/* Decorative gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-wealth-500 via-blue-500 to-violet-500" />

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-all z-10"
                            aria-label="Close tutorial"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Step counter */}
                        <div className="absolute top-4 left-5 text-[10px] font-bold text-text-tertiary uppercase tracking-wider z-10">
                            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                        </div>

                        {/* Content area with slide animation */}
                        <div className="pt-12 pb-4 px-6 min-h-[420px] flex flex-col">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        type: "tween",
                                        duration: 0.25,
                                        ease: "easeInOut",
                                    }}
                                    className="flex-1 flex flex-col"
                                >
                                    {/* Icon */}
                                    <div className="flex justify-center mb-5">
                                        <div
                                            className={`h-16 w-16 rounded-2xl ${step.iconBg} flex items-center justify-center`}
                                        >
                                            <step.icon
                                                className={`h-8 w-8 ${step.iconColor}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Title & Subtitle */}
                                    <h2 className="text-xl font-extrabold text-text-primary text-center leading-tight">
                                        {step.title}
                                    </h2>
                                    <p className="text-xs text-wealth-400 font-semibold text-center mt-1.5 tracking-wide">
                                        {step.subtitle}
                                    </p>

                                    {/* Description */}
                                    <p className="text-sm text-text-secondary leading-relaxed text-center mt-4 max-w-md mx-auto">
                                        {step.description}
                                    </p>

                                    {/* Features list */}
                                    {step.features && step.features.length > 0 && (
                                        <div className="mt-5 space-y-2.5 max-w-md mx-auto w-full">
                                            {step.features.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-2.5 text-xs text-text-secondary"
                                                >
                                                    <div
                                                        className={`h-5 w-5 rounded-md ${step.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                                                    >
                                                        <Zap
                                                            className={`h-3 w-3 ${step.iconColor}`}
                                                        />
                                                    </div>
                                                    <span className="leading-relaxed">
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tip */}
                                    {step.tip && (
                                        <div className="mt-5 px-4 py-3 rounded-xl bg-wealth-600/5 border border-wealth-500/10 max-w-md mx-auto w-full">
                                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                                <span className="font-bold text-wealth-400">
                                                    💡 Tip:{" "}
                                                </span>
                                                {step.tip}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Bottom bar: Progress dots + navigation */}
                        <div className="px-6 pb-5 pt-2 flex items-center justify-between border-t border-border-subtle/50">
                            {/* Previous button */}
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    currentStep === 0
                                        ? "text-text-tertiary/40 cursor-not-allowed"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface-100"
                                }`}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Back
                            </button>

                            {/* Progress dots */}
                            <div className="flex items-center gap-1.5">
                                {TUTORIAL_STEPS.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleGoToStep(idx)}
                                        className={`rounded-full transition-all duration-300 ${
                                            idx === currentStep
                                                ? "h-2 w-6 bg-wealth-500"
                                                : idx < currentStep
                                                  ? "h-2 w-2 bg-wealth-500/40"
                                                  : "h-2 w-2 bg-surface-200"
                                        }`}
                                        aria-label={`Go to step ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Next / Get Started button */}
                            <button
                                onClick={handleNext}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    isLastStep
                                        ? "bg-gradient-to-r from-wealth-500 to-wealth-600 text-white shadow-lg shadow-wealth-500/20 hover:shadow-wealth-500/40"
                                        : "bg-wealth-600/10 text-wealth-400 hover:bg-wealth-600/20"
                                }`}
                            >
                                {isLastStep ? (
                                    <>
                                        Get Started
                                        <Rocket className="h-3.5 w-3.5" />
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
