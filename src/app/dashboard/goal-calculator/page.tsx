"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    Button,
    Badge,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import {
    Target,
    Calculator,
    TrendingUp,
    HelpCircle,
    Search,
    Loader2,
    Sparkles,
    ArrowRight,
    IndianRupee,
    Zap,
} from "lucide-react";

interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    type: string;
    sector: string;
}

function GoalCalculatorContent() {
    const searchParams = useSearchParams();

    // Goal parameters
    const [targetCorpus, setTargetCorpus] = useState<number>(10000000); // ₹1 Cr default
    const [years, setYears] = useState<number>(15);
    const [expectedCagr, setExpectedCagr] = useState<number>(14);
    const [stepUp, setStepUp] = useState<number>(10);
    const [inflationRate, setInflationRate] = useState<number>(6);
    const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);

    // Search for asset CAGR
    const [selectedAssetName, setSelectedAssetName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Debounced autocomplete
    useEffect(() => {
        if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
        const delay = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success && data.content) setSearchResults(data.content);
            } catch { /* ignore */ } finally { setSearchLoading(false); }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    const handleSelectAsset = async (item: SearchResult) => {
        setSearchQuery("");
        setSearchResults([]);
        setDetailsLoading(true);
        setSelectedAssetName(item.name);
        try {
            const url = `/api/market/details?name=${encodeURIComponent(item.name)}&type=${encodeURIComponent(item.type)}&symbol=${encodeURIComponent(item.symbol)}&id=${encodeURIComponent(item.id)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data?.cagr3y) setExpectedCagr(data.data.cagr3y);
        } catch { /* ignore */ } finally { setDetailsLoading(false); }
    };

    // ── Reverse SIP Calculation ──────────────────────────────────
    const effectiveCagr = showInflationAdjusted
        ? ((1 + expectedCagr / 100) / (1 + inflationRate / 100) - 1) * 100
        : expectedCagr;

    const calcRequiredSIP = () => {
        const r = effectiveCagr / 12 / 100;
        const n = years * 12;
        if (r === 0) return targetCorpus / n;
        // FV of annuity: FV = PMT * [((1+r)^n - 1) / r]
        const fvFactor = (Math.pow(1 + r, n) - 1) / r;
        return targetCorpus / fvFactor;
    };

    const calcRequiredSIPWithStepUp = () => {
        // Iterative approach: find SIP that reaches target with yearly step-up
        let low = 100, high = targetCorpus / 12;
        for (let iter = 0; iter < 100; iter++) {
            const mid = (low + high) / 2;
            const fv = simulateSIPWithStepUp(mid);
            if (fv < targetCorpus) low = mid; else high = mid;
        }
        return (low + high) / 2;
    };

    const simulateSIPWithStepUp = (startingSIP: number) => {
        const monthlyRate = effectiveCagr / 12 / 100;
        let balance = 0;
        let currentSIP = startingSIP;
        for (let yr = 0; yr < years; yr++) {
            for (let m = 0; m < 12; m++) {
                balance = (balance + currentSIP) * (1 + monthlyRate);
            }
            currentSIP *= (1 + stepUp / 100);
        }
        return balance;
    };

    const requiredSIPNoStepUp = calcRequiredSIP();
    const requiredSIPWithStepUp = stepUp > 0 ? calcRequiredSIPWithStepUp() : requiredSIPNoStepUp;

    const totalInvestedNoStepUp = requiredSIPNoStepUp * years * 12;
    const totalInvestedWithStepUp = (() => {
        let total = 0, sip = requiredSIPWithStepUp;
        for (let yr = 0; yr < years; yr++) { total += sip * 12; sip *= (1 + stepUp / 100); }
        return total;
    })();

    const wealthGainNoStepUp = targetCorpus - totalInvestedNoStepUp;
    const wealthGainWithStepUp = targetCorpus - totalInvestedWithStepUp;

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${Math.round(val).toLocaleString("en-IN")}`;
    };

    // Preset target amounts
    const presets = [
        { label: "₹25 Lakh", value: 2500000 },
        { label: "₹50 Lakh", value: 5000000 },
        { label: "₹1 Crore", value: 10000000 },
        { label: "₹2 Crore", value: 20000000 },
        { label: "₹5 Crore", value: 50000000 },
    ];

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" className="space-y-8">
            <PageHeader
                title="Goal-Based SIP Calculator"
                description="Tell us your target corpus and timeline. We'll calculate exactly how much monthly SIP you need — with or without yearly step-ups."
            />

            {/* Asset Search for CAGR */}
            <Card padding="md" className="relative">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-wealth-400" />
                    Auto-Fill CAGR from Real Asset (Optional)
                </p>
                <div className="relative max-w-lg">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Search a stock or mutual fund to auto-fill expected CAGR..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-50 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-all"
                    />
                    {(searchLoading || detailsLoading) && <Loader2 className="absolute right-3 top-3 h-4 w-4 text-wealth-400 animate-spin" />}
                    <AnimatePresence>
                        {isFocused && searchResults.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-xl bg-surface-100/95 backdrop-blur-xl border border-border-subtle shadow-2xl p-2 space-y-1 z-50">
                                {searchResults.map((item) => (
                                    <button key={item.id} onClick={() => handleSelectAsset(item)}
                                        className="w-full text-left p-2.5 rounded-lg hover:bg-wealth-500/10 transition-all flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                                            <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{item.symbol} • {item.type}</p>
                                        </div>
                                        <Badge variant={item.type === "Stock" ? "default" : "positive"} className="text-[9px] ml-2 flex-shrink-0">{item.type}</Badge>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {selectedAssetName && (
                    <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wealth-600/10 text-wealth-400 border border-wealth-500/20">
                            <TrendingUp className="h-3 w-3" /> Using CAGR from: {selectedAssetName}
                        </span>
                    </div>
                )}
            </Card>

            {/* Target Corpus Presets */}
            <Card padding="lg" className="relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Target className="h-4.5 w-4.5 text-wealth-400" />
                        <CardTitle>Set Your Target</CardTitle>
                    </div>
                </CardHeader>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {presets.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setTargetCorpus(p.value)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                targetCorpus === p.value
                                    ? "bg-wealth-500/15 text-wealth-400 border border-wealth-500/30"
                                    : "bg-surface-100 text-text-secondary border border-border-subtle hover:bg-surface-200"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Target Amount */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Target Corpus</span>
                            <span className="text-sm font-bold text-wealth-400">{formatCurrency(targetCorpus)}</span>
                        </div>
                        <input type="range" min="500000" max="100000000" step="500000" value={targetCorpus}
                            onChange={(e) => setTargetCorpus(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                        <div className="flex justify-between text-[10px] text-text-tertiary"><span>₹5L</span><span>₹5Cr</span><span>₹10Cr</span></div>
                    </div>

                    {/* Time Horizon */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Timeline</span>
                            <span className="text-sm font-bold text-wealth-400">{years} Years</span>
                        </div>
                        <input type="range" min="1" max="30" step="1" value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                        <div className="flex justify-between text-[10px] text-text-tertiary"><span>1Y</span><span>15Y</span><span>30Y</span></div>
                    </div>

                    {/* Expected CAGR */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                                Expected CAGR
                                <HelpCircle className="h-3 w-3 text-text-tertiary cursor-help" />
                            </span>
                            <span className="text-sm font-bold text-wealth-400">{expectedCagr}%</span>
                        </div>
                        <input type="range" min="5" max="25" step="0.5" value={expectedCagr}
                            onChange={(e) => setExpectedCagr(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                        <div className="flex justify-between text-[10px] text-text-tertiary"><span>5%</span><span>15%</span><span>25%</span></div>
                    </div>

                    {/* Yearly Step-Up */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Yearly Step-Up</span>
                            <span className="text-sm font-bold text-wealth-400">{stepUp}%</span>
                        </div>
                        <input type="range" min="0" max="25" step="1" value={stepUp}
                            onChange={(e) => setStepUp(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                        <div className="flex justify-between text-[10px] text-text-tertiary"><span>0%</span><span>10%</span><span>25%</span></div>
                    </div>
                </div>

                {/* Inflation toggle */}
                <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-3">
                    <button
                        onClick={() => setShowInflationAdjusted(!showInflationAdjusted)}
                        className={`relative h-5 w-10 rounded-full transition-colors ${showInflationAdjusted ? "bg-wealth-500" : "bg-surface-200"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showInflationAdjusted ? "translate-x-5" : ""}`} />
                    </button>
                    <span className="text-xs text-text-secondary">
                        Adjust for inflation ({inflationRate}% CPI)
                    </span>
                    {showInflationAdjusted && (
                        <span className="text-[10px] text-wealth-400 font-semibold bg-wealth-500/10 px-2 py-0.5 rounded-full">
                            Real CAGR: {effectiveCagr.toFixed(1)}%
                        </span>
                    )}
                </div>
            </Card>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Without Step-Up */}
                <Card padding="lg" className="border-l-4 border-l-blue-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent -z-10" />
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                        <Calculator className="h-4 w-4 text-blue-400" />
                        Fixed SIP (No Step-Up)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider">Required Monthly SIP</p>
                            <p className="text-3xl font-extrabold text-blue-400 mt-1">
                                {formatCurrency(requiredSIPNoStepUp)}
                                <span className="text-xs text-text-tertiary font-normal ml-1">/month</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                            <div>
                                <p className="text-[9px] uppercase text-text-tertiary">Total Invested</p>
                                <p className="text-sm font-bold text-text-primary">{formatCurrency(totalInvestedNoStepUp)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase text-text-tertiary">Wealth Gain</p>
                                <p className="text-sm font-bold text-positive-500">{formatCurrency(wealthGainNoStepUp)}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* With Step-Up */}
                <Card padding="lg" className="border-l-4 border-l-wealth-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-wealth-500/5 to-transparent -z-10" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <Zap className="h-4 w-4 text-wealth-400" />
                            With {stepUp}% Yearly Step-Up
                        </h3>
                        <Badge variant="positive" className="text-[9px]">RECOMMENDED</Badge>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider">Starting Monthly SIP</p>
                            <p className="text-3xl font-extrabold text-wealth-400 mt-1">
                                {formatCurrency(requiredSIPWithStepUp)}
                                <span className="text-xs text-text-tertiary font-normal ml-1">/month</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                            <div>
                                <p className="text-[9px] uppercase text-text-tertiary">Total Invested</p>
                                <p className="text-sm font-bold text-text-primary">{formatCurrency(totalInvestedWithStepUp)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase text-text-tertiary">Wealth Gain</p>
                                <p className="text-sm font-bold text-positive-500">{formatCurrency(wealthGainWithStepUp)}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-wealth-600/5 border border-wealth-500/10">
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                <span className="font-bold text-wealth-400">💡 </span>
                                With step-up, you start at <span className="font-bold">{formatCurrency(requiredSIPWithStepUp)}</span> and it grows to{" "}
                                <span className="font-bold">{formatCurrency(requiredSIPWithStepUp * Math.pow(1 + stepUp / 100, years - 1))}</span> in the final year.
                                This is <span className="font-bold text-positive-500">{formatCurrency(requiredSIPNoStepUp - requiredSIPWithStepUp)} less</span> than the fixed SIP initially.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* CTA */}
            <Card padding="md" className="bg-gradient-to-r from-wealth-600/5 via-transparent to-wealth-600/5 border-gradient">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-wealth-400" />
                        <div>
                            <p className="text-sm font-bold text-text-primary">Ready to find the right SIP?</p>
                            <p className="text-xs text-text-secondary">Compare real mutual funds and stocks to find the best fit for your goal.</p>
                        </div>
                    </div>
                    <a href="/dashboard/sip-tracking" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-wealth-600/10 text-wealth-400 text-xs font-bold hover:bg-wealth-600/20 transition-colors">
                        Open SIP Analyzer <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                </div>
            </Card>
        </motion.div>
    );
}

export default function GoalCalculatorPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-tertiary">Loading Goal Calculator...</div>}>
            <GoalCalculatorContent />
        </Suspense>
    );
}
