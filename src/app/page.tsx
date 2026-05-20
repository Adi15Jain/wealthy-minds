"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import {
    ArrowRight,
    Brain,
    Shield,
    TrendingUp,
    Sparkles,
    Target,
    BarChart3,
    Zap,
    LineChart,
    PieChart,
} from "lucide-react";
import { staggerContainer, staggerItem, scrollFadeUp } from "@/lib/motion";

// ── Hero Section ─────────────────────────────────────────────
function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    return (
        <section
            ref={ref}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* Animated background */}
            <div className="absolute inset-0">
                {/* Primary gradient orb */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full animate-glow-pulse"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.55 0.14 250 / 0.15) 0%, transparent 70%)",
                    }}
                    animate={{
                        x: [0, 30, -20, 0],
                        y: [0, -20, 30, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {/* Secondary gradient orb */}
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full animate-glow-pulse"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.48 0.16 280 / 0.12) 0%, transparent 70%)",
                        animationDelay: "2s",
                    }}
                    animate={{
                        x: [0, -25, 15, 0],
                        y: [0, 25, -15, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {/* Accent orb */}
                <motion.div
                    className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.68 0.14 168 / 0.08) 0%, transparent 70%)",
                    }}
                    animate={{
                        x: [0, 40, -30, 0],
                        y: [0, -30, 20, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                {/* Grid pattern */}
                <div className="absolute inset-0 dot-pattern opacity-30" />
                {/* Gradient fade at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface-0 to-transparent" />
            </div>

            <motion.div
                className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6"
                style={{ y, opacity, scale }}
            >
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={staggerItem} className="mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-wealth-600/10 text-wealth-400 border border-wealth-500/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI-Powered Wealth Intelligence
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={staggerItem}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8"
                    >
                        <span className="text-text-primary">Your Wealth.</span>
                        <br />
                        <span className="gradient-text">
                            Your Intelligence.
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        variants={staggerItem}
                        className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        An intelligent operating system for personal wealth
                        creation. AI-driven portfolio cognition, behavioral
                        intelligence, and disciplined long-term investing —
                        designed for clarity, not chaos.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        variants={staggerItem}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href={ROUTES.AUTH.REGISTER}>
                            <Button size="xl" className="group px-8">
                                Start Building Wealth
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button
                                variant="outline"
                                size="xl"
                                className="px-8"
                            >
                                Explore Features
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        variants={staggerItem}
                        className="mt-16 flex items-center justify-center gap-8 text-text-tertiary"
                    >
                        {[
                            "Bank-Grade Security",
                            "AI-First Architecture",
                            "Zero Trading Noise",
                        ].map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-2 text-xs font-medium"
                            >
                                <div className="h-1.5 w-1.5 rounded-full bg-positive-500" />
                                {item}
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}

// ── Features Section ─────────────────────────────────────────
const features = [
    {
        icon: Brain,
        title: "AI Portfolio Cognition",
        description:
            "Your portfolio analyzed by AI that understands behavioral finance, risk dynamics, and long-term wealth patterns.",
    },
    {
        icon: Shield,
        title: "Risk Intelligence",
        description:
            "Deep risk analytics with concentration analysis, volatility scoring, and portfolio stress testing.",
    },
    {
        icon: TrendingUp,
        title: "Wealth Projection",
        description:
            "Monte Carlo simulations and compound growth modeling to visualize your wealth trajectory across decades.",
    },
    {
        icon: Target,
        title: "Goal Architecture",
        description:
            "Map every financial goal — retirement, education, home — with intelligent SIP and allocation strategies.",
    },
    {
        icon: BarChart3,
        title: "Behavioral Analytics",
        description:
            "Understand your investing psychology. Track decision patterns, emotional triggers, and discipline scores.",
    },
    {
        icon: Zap,
        title: "Allocation Intelligence",
        description:
            "AI-optimized asset allocation recommendations based on your risk profile, goals, and market conditions.",
    },
];

function FeaturesSection() {
    return (
        <section id="features" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center mb-20"
                    variants={scrollFadeUp}
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <span className="text-xs font-semibold uppercase tracking-widest text-wealth-400 mb-4 block">
                        Platform Intelligence
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-6">
                        Financial Clarity,{" "}
                        <span className="gradient-text">Not Noise</span>
                    </h2>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        Every feature is designed to enhance your financial
                        decision-making with intelligence, discipline, and
                        long-term perspective.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            className="group card-surface p-8 hover:border-wealth-500/30 transition-all duration-300"
                            variants={scrollFadeUp}
                            initial="offscreen"
                            whileInView="onscreen"
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="h-12 w-12 rounded-xl bg-wealth-600/10 flex items-center justify-center mb-6 group-hover:bg-wealth-600/20 transition-colors">
                                <feature.icon className="h-6 w-6 text-wealth-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Intelligence Preview Section ─────────────────────────────
function IntelligenceSection() {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-wealth-600/[0.03] to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    className="grid lg:grid-cols-2 gap-16 items-center"
                    variants={scrollFadeUp}
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.2 }}
                >
                    {/* Left — Text */}
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-positive-500 mb-4 block">
                            AI-First Design
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-6 leading-tight">
                            Intelligence That
                            <br />
                            <span className="gradient-text-warm">
                                Compounds
                            </span>
                        </h2>
                        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                            WealthyMinds uses advanced AI to generate
                            personalized financial insights, behavioral
                            observations, and optimization strategies that
                            improve over time as it learns your financial
                            personality.
                        </p>

                        <div className="space-y-4">
                            {[
                                {
                                    icon: LineChart,
                                    text: "Portfolio health scoring with AI narratives",
                                },
                                {
                                    icon: PieChart,
                                    text: "Dynamic allocation rebalancing intelligence",
                                },
                                {
                                    icon: Brain,
                                    text: "Behavioral pattern recognition and coaching",
                                },
                            ].map((item) => (
                                <div
                                    key={item.text}
                                    className="flex items-center gap-4"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0">
                                        <item.icon className="h-5 w-5 text-wealth-400" />
                                    </div>
                                    <span className="text-sm text-text-secondary">
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Visual mock */}
                    <motion.div
                        className="relative"
                        variants={scrollFadeUp}
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true }}
                    >
                        <div className="glass rounded-2xl p-8 space-y-5">
                            {/* Mock insight cards */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-8 w-8 rounded-lg bg-wealth-600/20 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-wealth-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        AI Wealth Insights
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        Last updated 2 minutes ago
                                    </p>
                                </div>
                            </div>

                            {[
                                {
                                    title: "Portfolio Concentration Alert",
                                    desc: "Your top 3 holdings represent 62% of portfolio value. Consider diversifying into debt instruments.",
                                    severity: "warning" as const,
                                },
                                {
                                    title: "SIP Consistency Score: 94%",
                                    desc: "Excellent discipline. You've maintained SIP investments for 18 consecutive months.",
                                    severity: "positive" as const,
                                },
                                {
                                    title: "Goal On Track: Retirement",
                                    desc: "At current pace, you'll reach your retirement goal 2 years ahead of schedule.",
                                    severity: "positive" as const,
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className={`p-4 rounded-xl border-l-4 ${
                                        item.severity === "warning"
                                            ? "border-l-caution-500 bg-caution-500/5"
                                            : "border-l-positive-500 bg-positive-500/5"
                                    }`}
                                >
                                    <p className="text-sm font-semibold text-text-primary mb-1">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Glow behind */}
                        <div
                            className="absolute inset-0 -z-10 rounded-2xl blur-3xl opacity-20"
                            style={{
                                background:
                                    "linear-gradient(135deg, oklch(0.55 0.14 250), oklch(0.48 0.16 280))",
                            }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ── CTA Section ──────────────────────────────────────────────
function CTASection() {
    return (
        <section className="py-32 relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center"
                    variants={scrollFadeUp}
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-wealth-600/20 via-surface-100 to-wealth-800/20 border border-border-subtle rounded-3xl" />
                    <div className="absolute inset-0 dot-pattern opacity-10" />

                    <div className="relative z-10">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary mb-6">
                            Start Your Wealth
                            <br />
                            <span className="gradient-text">
                                Intelligence Journey
                            </span>
                        </h2>
                        <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10">
                            Join thousands of disciplined investors building
                            long-term wealth with AI-powered clarity and
                            strategic intelligence.
                        </p>
                        <Link href={ROUTES.AUTH.REGISTER}>
                            <Button size="xl" className="group px-10">
                                Get Started Free
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ── Footer ───────────────────────────────────────────────────
function Footer() {
    return (
        <footer className="border-t border-border-subtle py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                W
                            </span>
                        </div>
                        <span className="font-bold text-text-primary">
                            WealthyMinds
                        </span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                        © {new Date().getFullYear()} WealthyMinds. Building
                        wealth with intelligence.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// ── Landing Page ─────────────────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-surface-0">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                W
                            </span>
                        </div>
                        <span className="font-bold text-text-primary text-lg tracking-tight">
                            WealthyMinds
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
                        <a
                            href="#features"
                            className="hover:text-text-primary transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#"
                            className="hover:text-text-primary transition-colors"
                        >
                            Pricing
                        </a>
                        <a
                            href="#"
                            className="hover:text-text-primary transition-colors"
                        >
                            About
                        </a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={ROUTES.AUTH.LOGIN}>
                            <Button variant="ghost" size="sm">
                                Sign In
                            </Button>
                        </Link>
                        <Link href={ROUTES.AUTH.REGISTER}>
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <HeroSection />
            <FeaturesSection />
            <IntelligenceSection />
            <CTASection />
            <Footer />
        </div>
    );
}
