"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PageHeader,
    Card,
    Badge,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import {
    Shield,
    ChevronRight,
    ChevronLeft,
    RotateCcw,
    TrendingUp,
    Target,
    Zap,
    CheckCircle2,
    ArrowRight,
    AlertTriangle,
    BarChart3,
} from "lucide-react";
import Link from "next/link";

interface QuizQuestion {
    id: string;
    question: string;
    context: string;
    options: { label: string; score: number; description: string }[];
}

const QUESTIONS: QuizQuestion[] = [
    {
        id: "horizon",
        question: "What is your investment time horizon?",
        context: "Longer horizons allow more risk since markets recover over time.",
        options: [
            { label: "Less than 3 years", score: 1, description: "Short-term goal like emergency fund or upcoming expense" },
            { label: "3 to 7 years", score: 2, description: "Medium-term like car purchase, education, or house down payment" },
            { label: "7 to 15 years", score: 3, description: "Long-term goal like children's education or early retirement" },
            { label: "More than 15 years", score: 4, description: "Very long-term like retirement corpus or generational wealth" },
        ],
    },
    {
        id: "reaction",
        question: "Your portfolio drops 25% in a market crash. What do you do?",
        context: "This reveals your emotional risk tolerance — the most important factor.",
        options: [
            { label: "Panic sell everything", score: 1, description: "I can't afford to lose money. Safety is my priority." },
            { label: "Sell some, keep some", score: 2, description: "I'd reduce exposure but not exit completely." },
            { label: "Hold and wait", score: 3, description: "I trust the market will recover. I'll be patient." },
            { label: "Buy more aggressively", score: 4, description: "Market crash = discount. I'd invest more." },
        ],
    },
    {
        id: "income",
        question: "How stable and predictable is your monthly income?",
        context: "Stable income means you can absorb short-term investment losses.",
        options: [
            { label: "Very unstable (freelance/gig)", score: 1, description: "Income varies significantly month to month" },
            { label: "Somewhat variable", score: 2, description: "Commission-based, seasonal, or semi-regular" },
            { label: "Stable salaried income", score: 3, description: "Regular paycheck from employer" },
            { label: "Multiple stable income sources", score: 4, description: "Salary + rental income + other passive income" },
        ],
    },
    {
        id: "experience",
        question: "How would you describe your investment experience?",
        context: "Experience helps you stay rational during volatility.",
        options: [
            { label: "Complete beginner", score: 1, description: "Never invested beyond FD or savings account" },
            { label: "Basic understanding", score: 2, description: "Have some MFs or stocks, understand basics" },
            { label: "Intermediate investor", score: 3, description: "Track markets, understand SIP/CAGR/risk metrics" },
            { label: "Experienced investor", score: 4, description: "Actively manage portfolio, understand derivatives & allocation" },
        ],
    },
    {
        id: "preference",
        question: "Which return scenario would you prefer?",
        context: "This reveals whether you prioritize growth or safety.",
        options: [
            { label: "Guaranteed 7% per year", score: 1, description: "Low risk, predictable returns like FDs or debt" },
            { label: "8-12% with some ups and downs", score: 2, description: "Moderate risk, balanced approach" },
            { label: "12-18% with significant volatility", score: 3, description: "Higher risk, equity-heavy portfolio" },
            { label: "20%+ with extreme swings possible", score: 4, description: "Maximum growth, can tolerate 40%+ drawdowns" },
        ],
    },
];

interface RiskProfile {
    label: string;
    tagline: string;
    color: string;
    bg: string;
    borderColor: string;
    allocation: { equity: number; debt: number; gold: number };
    recommendations: string[];
    avoidList: string[];
}

const RISK_PROFILES: Record<string, RiskProfile> = {
    conservative: {
        label: "Conservative",
        tagline: "Capital Preservation First",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        allocation: { equity: 20, debt: 65, gold: 15 },
        recommendations: [
            "Debt Mutual Funds (Liquid, Ultra-Short Duration)",
            "Government Bonds & PPF",
            "Conservative Hybrid Funds",
            "Fixed Deposits (for liquidity needs)",
            "Sovereign Gold Bonds",
        ],
        avoidList: [
            "Small & micro-cap funds",
            "Sector/thematic funds",
            "Direct stock trading",
        ],
    },
    moderate: {
        label: "Moderate",
        tagline: "Balanced Growth with Safety",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        allocation: { equity: 50, debt: 40, gold: 10 },
        recommendations: [
            "Balanced Advantage / Hybrid Funds",
            "Large Cap Index Funds (Nifty 50, Sensex)",
            "Flexi Cap Mutual Funds",
            "Short-Duration Debt Funds",
            "ELSS for tax saving",
        ],
        avoidList: [
            "Micro-cap or penny stocks",
            "F&O / derivatives trading",
            "Concentrated sector bets",
        ],
    },
    growth: {
        label: "Growth",
        tagline: "Long-Term Wealth Builder",
        color: "text-wealth-400",
        bg: "bg-wealth-500/10",
        borderColor: "border-wealth-500/30",
        allocation: { equity: 70, debt: 20, gold: 10 },
        recommendations: [
            "Flexi Cap & Multi-Cap Funds",
            "Mid Cap Mutual Funds",
            "Nifty Next 50 Index Fund",
            "Quality large-cap stocks (SIP)",
            "International Equity Funds (US/Global)",
        ],
        avoidList: [
            "Excessive cash holding",
            "Guaranteed return products only",
            "Avoiding equity altogether",
        ],
    },
    aggressive: {
        label: "Aggressive",
        tagline: "Maximum Growth, Maximum Risk",
        color: "text-red-400",
        bg: "bg-red-500/10",
        borderColor: "border-red-500/30",
        allocation: { equity: 85, debt: 10, gold: 5 },
        recommendations: [
            "Small Cap & Mid Cap Funds",
            "Sectoral/Thematic Funds (IT, Pharma, Infra)",
            "Direct equity with conviction picks",
            "International growth funds",
            "Momentum or factor-based strategies",
        ],
        avoidList: [
            "Putting entire corpus in one stock",
            "Leveraged or margin trading without experience",
            "Ignoring portfolio rebalancing",
        ],
    },
};

export default function RiskProfilePage() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showResult, setShowResult] = useState(false);
    const [direction, setDirection] = useState(0);

    const handleAnswer = (questionId: string, score: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: score }));
        if (currentQuestion < QUESTIONS.length - 1) {
            setDirection(1);
            setTimeout(() => setCurrentQuestion(prev => prev + 1), 150);
        } else {
            setTimeout(() => setShowResult(true), 300);
        }
    };

    const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);
    const maxScore = QUESTIONS.length * 4;

    const getProfile = (): RiskProfile => {
        const pct = totalScore / maxScore;
        if (pct <= 0.3) return RISK_PROFILES.conservative;
        if (pct <= 0.55) return RISK_PROFILES.moderate;
        if (pct <= 0.8) return RISK_PROFILES.growth;
        return RISK_PROFILES.aggressive;
    };

    const reset = () => {
        setCurrentQuestion(0);
        setAnswers({});
        setShowResult(false);
    };

    const profile = getProfile();
    const answeredCount = Object.keys(answers).length;

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" className="space-y-8">
            <PageHeader
                title="Risk Profile Assessment"
                description="Answer 5 quick questions to understand your risk tolerance. Get personalized asset allocation and investment recommendations."
            />

            {!showResult ? (
                <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-secondary">
                                Question {currentQuestion + 1} of {QUESTIONS.length}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {answeredCount}/{QUESTIONS.length} answered
                            </span>
                        </div>
                        <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-wealth-500 to-wealth-400 rounded-full"
                                animate={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            />
                        </div>
                    </div>

                    {/* Question Card */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentQuestion}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "tween", duration: 0.2 }}
                        >
                            <Card padding="lg" className="relative overflow-hidden">
                                <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />
                                <div className="mb-6">
                                    <h3 className="text-lg font-extrabold text-text-primary leading-tight">
                                        {QUESTIONS[currentQuestion].question}
                                    </h3>
                                    <p className="text-xs text-text-tertiary mt-1.5">
                                        {QUESTIONS[currentQuestion].context}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {QUESTIONS[currentQuestion].options.map((option) => {
                                        const isSelected = answers[QUESTIONS[currentQuestion].id] === option.score;
                                        return (
                                            <button
                                                key={option.score}
                                                onClick={() => handleAnswer(QUESTIONS[currentQuestion].id, option.score)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                                                    isSelected
                                                        ? "border-wealth-500 bg-wealth-500/10"
                                                        : "border-border-subtle bg-surface-50 hover:border-wealth-500/30 hover:bg-wealth-500/5"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                        isSelected ? "border-wealth-500 bg-wealth-500" : "border-border-subtle"
                                                    }`}>
                                                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isSelected ? "text-wealth-400" : "text-text-primary"}`}>
                                                            {option.label}
                                                        </p>
                                                        <p className="text-[11px] text-text-tertiary mt-0.5">{option.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => { setDirection(-1); setCurrentQuestion(prev => Math.max(0, prev - 1)); }}
                            disabled={currentQuestion === 0}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                currentQuestion === 0 ? "text-text-tertiary/40 cursor-not-allowed" : "text-text-secondary hover:text-text-primary hover:bg-surface-100"
                            }`}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> Previous
                        </button>
                        <div className="flex gap-1.5">
                            {QUESTIONS.map((_, idx) => (
                                <div key={idx} className={`h-2 rounded-full transition-all ${
                                    idx === currentQuestion ? "w-6 bg-wealth-500" : answers[QUESTIONS[idx].id] ? "w-2 bg-wealth-500/40" : "w-2 bg-surface-200"
                                }`} />
                            ))}
                        </div>
                        <button
                            onClick={() => { setDirection(1); setCurrentQuestion(prev => Math.min(QUESTIONS.length - 1, prev + 1)); }}
                            disabled={currentQuestion === QUESTIONS.length - 1}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                currentQuestion === QUESTIONS.length - 1 ? "text-text-tertiary/40 cursor-not-allowed" : "text-text-secondary hover:text-text-primary hover:bg-surface-100"
                            }`}
                        >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            ) : (
                /* ─── Results ─────────────────────────────────────────────────────── */
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
                    {/* Profile Card */}
                    <Card padding="lg" className={`border-2 ${profile.borderColor} relative overflow-hidden`}>
                        <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />
                        <div className="text-center mb-6">
                            <div className={`h-16 w-16 rounded-2xl ${profile.bg} flex items-center justify-center mx-auto mb-4`}>
                                <Shield className={`h-8 w-8 ${profile.color}`} />
                            </div>
                            <p className="text-xs text-text-tertiary uppercase font-bold tracking-wider mb-1">Your Risk Profile</p>
                            <h2 className={`text-3xl font-extrabold ${profile.color}`}>{profile.label}</h2>
                            <p className="text-sm text-text-secondary mt-1">{profile.tagline}</p>
                            <div className="mt-3">
                                <Badge variant="default" className="text-[10px]">
                                    Score: {totalScore}/{maxScore}
                                </Badge>
                            </div>
                        </div>

                        {/* Allocation Donut (simplified as bar) */}
                        <div className="space-y-3 mb-6">
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Recommended Asset Allocation</p>
                            <div className="flex h-6 rounded-full overflow-hidden">
                                <div className="bg-wealth-500 flex items-center justify-center" style={{ width: `${profile.allocation.equity}%` }}>
                                    <span className="text-[9px] font-bold text-white">{profile.allocation.equity}% Equity</span>
                                </div>
                                <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${profile.allocation.debt}%` }}>
                                    <span className="text-[9px] font-bold text-white">{profile.allocation.debt}% Debt</span>
                                </div>
                                <div className="bg-amber-500 flex items-center justify-center" style={{ width: `${profile.allocation.gold}%` }}>
                                    <span className="text-[9px] font-bold text-white">{profile.allocation.gold}% Gold</span>
                                </div>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-positive-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Recommended For You
                                </p>
                                <div className="space-y-2">
                                    {profile.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                                            <TrendingUp className="h-3.5 w-3.5 text-positive-500 flex-shrink-0 mt-0.5" />
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-negative-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Avoid
                                </p>
                                <div className="space-y-2">
                                    {profile.avoidList.map((avoid, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                                            <AlertTriangle className="h-3.5 w-3.5 text-negative-400 flex-shrink-0 mt-0.5" />
                                            <span>{avoid}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={reset}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-surface-100 text-text-secondary text-xs font-bold hover:bg-surface-200 transition-colors">
                            <RotateCcw className="h-3.5 w-3.5" /> Retake Quiz
                        </button>
                        <Link href="/dashboard/fund-explorer"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-wealth-600/10 text-wealth-400 text-xs font-bold hover:bg-wealth-600/20 transition-colors">
                            <BarChart3 className="h-3.5 w-3.5" /> Browse Recommended Funds
                        </Link>
                        <Link href="/dashboard/goal-calculator"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-wealth-600/10 text-wealth-400 text-xs font-bold hover:bg-wealth-600/20 transition-colors">
                            <Target className="h-3.5 w-3.5" /> Set a Goal <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
