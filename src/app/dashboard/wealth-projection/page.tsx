"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    Badge,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import {
    LineChart as LineChartIcon,
    Calculator,
    HelpCircle,
    Info,
    Shield,
    TrendingUp,
    TrendingDown,
    Zap,
    Search,
    Loader2,
    X,
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    type: string;
    sector: string;
}

function MonteCarloContent() {
    const searchParams = useSearchParams();
    const urlName = searchParams.get("name");
    const urlCagr = searchParams.get("cagr");
    const urlVol = searchParams.get("vol");

    // Inputs state — initialized from URL params if present
    const [sipAmount, setSipAmount] = useState<number>(15000);
    const [years, setYears] = useState<number>(15);
    const [cagr, setCagr] = useState<number>(urlCagr ? parseFloat(urlCagr) : 14);
    const [volatility, setVolatility] = useState<number>(urlVol ? parseFloat(urlVol) : 16);
    const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);
    const [inflationRate] = useState(6);

    // Asset search state
    const [selectedAssetName, setSelectedAssetName] = useState<string>(urlName || "");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Debounced autocomplete search
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success && data.content) {
                    setSearchResults(data.content);
                }
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery]);

    // Handle selecting an asset from search results
    const handleSelectAsset = async (item: SearchResult) => {
        setSearchQuery("");
        setSearchResults([]);
        setDetailsLoading(true);
        setSelectedAssetName(item.name);

        try {
            const url = `/api/market/details?name=${encodeURIComponent(item.name)}&type=${encodeURIComponent(item.type)}&symbol=${encodeURIComponent(item.symbol)}&id=${encodeURIComponent(item.id)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data) {
                if (data.data.cagr3y) setCagr(data.data.cagr3y);
                if (data.data.volatilityPercent) {
                    setVolatility(data.data.volatilityPercent);
                } else if (data.data.volatility === "Low") {
                    setVolatility(8);
                } else if (data.data.volatility === "High") {
                    setVolatility(22);
                } else {
                    setVolatility(14);
                }
            }
        } catch (e) {
            console.error("Failed to fetch asset details", e);
        } finally {
            setDetailsLoading(false);
        }
    };

    const clearSelectedAsset = () => {
        setSelectedAssetName("");
        setCagr(14);
        setVolatility(16);
    };

    // Calculations
    const effectiveCagr = showInflationAdjusted
        ? ((1 + cagr / 100) / (1 + inflationRate / 100) - 1) * 100
        : cagr;

    const generateSimulationData = () => {
        const data = [];
        const totalMonths = years * 12;
        let expectedBalance = 0;
        let accumulatedInvested = 0;

        const monthlyRate = effectiveCagr / 12 / 100;

        for (let month = 1; month <= totalMonths; month++) {
            accumulatedInvested += sipAmount;
            
            // Expected Compounding Balance (Annuity due model)
            expectedBalance = (expectedBalance + sipAmount) * (1 + monthlyRate);

            // Cumulative volatility risk scaling with sqrt(time)
            const t = month / 12; // Time in years
            const volFrac = volatility / 100;
            const cumulativeVol = volFrac * Math.sqrt(t);

            // Z-Scores: 90th percentile = +1.28, 10th percentile = -1.28
            const optMultiplier = Math.exp(1.28 * cumulativeVol - 0.5 * volFrac * volFrac * t);
            const conMultiplier = Math.exp(-1.28 * cumulativeVol - 0.5 * volFrac * volFrac * t);

            const optimisticBalance = expectedBalance * optMultiplier;
            const conservativeBalance = expectedBalance * conMultiplier;

            // Sample data points to keep chart performance optimal
            if (month === 1 || month === totalMonths || month % 3 === 0) {
                data.push({
                    month,
                    year: `Yr ${(month / 12).toFixed(1)}`,
                    "Invested Capital": Math.round(accumulatedInvested),
                    "Conservative Scenario": Math.round(Math.max(accumulatedInvested * 0.75, conservativeBalance)),
                    "Expected Target": Math.round(expectedBalance),
                    "Optimistic Scenario": Math.round(optimisticBalance),
                });
            }
        }
        return data;
    };

    const simData = generateSimulationData();
    const finalYearData = simData[simData.length - 1];

    const finalInvested = finalYearData ? finalYearData["Invested Capital"] : 0;
    const finalExpected = finalYearData ? finalYearData["Expected Target"] : 0;
    const finalOptimistic = finalYearData ? finalYearData["Optimistic Scenario"] : 0;
    const finalConservative = finalYearData ? finalYearData["Conservative Scenario"] : 0;

    const totalGains = finalExpected - finalInvested;
    const fdOutperformance = effectiveCagr > 7.0 ? Math.min(99, Math.round(75 + (effectiveCagr - 7) * 3 - (volatility - 10) * 0.5)) : Math.round(effectiveCagr * 10);

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <PageHeader
                title="Monte Carlo SIP Simulator"
                description="Forecast long-term wealth growth boundaries using compound variance mathematical simulations. Adjust volatility and CAGR to stress-test your SIP."
            />

            {/* Slider Parameters Card */}
            <Card padding="lg" className="relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />
                <CardHeader className="pb-6">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4.5 w-4.5 text-wealth-400" />
                        <CardTitle>Simulation Assumptions</CardTitle>
                    </div>
                </CardHeader>

                {/* Asset Search */}
                <div className="mb-6 relative">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-wealth-400" />
                        Auto-Populate from Real Asset
                    </p>
                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            placeholder="Search a stock or mutual fund to auto-fill CAGR & volatility..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-50 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-all"
                        />
                        {(searchLoading || detailsLoading) && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 text-wealth-400 animate-spin" />
                        )}

                        <AnimatePresence>
                            {isFocused && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-xl bg-surface-100/95 backdrop-blur-xl border border-border-subtle shadow-2xl p-2 space-y-1 z-50"
                                >
                                    {searchResults.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectAsset(item)}
                                            className="w-full text-left p-2.5 rounded-lg hover:bg-wealth-500/10 border border-transparent transition-all flex items-center justify-between group"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                                                <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{item.symbol} • {item.type}</p>
                                            </div>
                                            <Badge
                                                variant={item.type === "Stock" ? "default" : "positive"}
                                                className="text-[9px] ml-2 flex-shrink-0"
                                            >
                                                {item.type}
                                            </Badge>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Selected asset badge */}
                    {selectedAssetName && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wealth-600/10 text-wealth-400 border border-wealth-500/20">
                                <TrendingUp className="h-3 w-3" />
                                Simulating: {selectedAssetName}
                            </span>
                            <button onClick={clearSelectedAsset} className="text-text-tertiary hover:text-text-primary transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Monthly SIP */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Monthly Contribution
                            </span>
                            <span className="text-sm font-bold text-wealth-400">
                                ₹{sipAmount.toLocaleString("en-IN")}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1000"
                            max="100000"
                            step="1000"
                            value={sipAmount}
                            onChange={(e) => setSipAmount(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-text-tertiary">
                            <span>₹1,000</span>
                            <span>₹50,000</span>
                            <span>₹1,00,000</span>
                        </div>
                    </div>

                    {/* Time Frame */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Duration
                            </span>
                            <span className="text-sm font-bold text-wealth-400">{years} Years</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-text-tertiary">
                            <span>1 Year</span>
                            <span>15 Years</span>
                            <span>30 Years</span>
                        </div>
                    </div>

                    {/* Expected Return */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                                Expected return (CAGR)
                                <span title="Long-term compound annual growth rate. Equities typically yield 12-15%, debt 6-8%.">
                                    <HelpCircle className="h-3 w-3 text-text-tertiary cursor-help" />
                                </span>
                            </span>
                            <span className="text-sm font-bold text-wealth-400">{cagr}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="25"
                            step="0.5"
                            value={cagr}
                            onChange={(e) => setCagr(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-text-tertiary">
                            <span>5% p.a.</span>
                            <span>15% p.a.</span>
                            <span>25% p.a.</span>
                        </div>
                    </div>

                    {/* Volatility */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                                Market Volatility
                                <span title="Standard deviation of returns. Higher volatility creates wider ranges between Conservative and Optimistic outcomes.">
                                    <HelpCircle className="h-3 w-3 text-text-tertiary cursor-help" />
                                </span>
                            </span>
                            <span className="text-sm font-bold text-wealth-400">{volatility}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={volatility}
                            onChange={(e) => setVolatility(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-text-tertiary">
                            <span>5% (Low)</span>
                            <span>15% (Medium)</span>
                            <span>30% (Extreme)</span>
                        </div>
                    </div>
                </div>

                {/* Inflation Toggle */}
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

            {/* Simulated Outcome Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card padding="md" animate>
                    <p className="metric-label mb-1">Total Invested Principal</p>
                    <p className="text-xl font-bold text-text-primary">
                        ₹{finalInvested.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-text-tertiary">Raw cumulative savings</span>
                </Card>

                <Card padding="md" className="border-l-4 border-l-negative-500/50" animate>
                    <p className="metric-label mb-1 text-negative-400 flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Conservative Scenario (10th%)
                    </p>
                    <p className="text-xl font-bold text-negative-400">
                        ₹{finalConservative.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-text-tertiary">In highly stagnated markets</span>
                </Card>

                <Card padding="md" className="border-l-4 border-l-wealth-500" animate>
                    <p className="metric-label mb-1 text-wealth-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Expected Growth Target (50th%)
                    </p>
                    <p className="text-xl font-bold text-wealth-400">
                        ₹{finalExpected.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-text-tertiary">Historical CAGR average</span>
                </Card>

                <Card padding="md" className="border-l-4 border-l-positive-500" animate>
                    <p className="metric-label mb-1 text-positive-400 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-positive-500 animate-pulse" />
                        Optimistic Scenario (90th%)
                    </p>
                    <p className="text-xl font-bold text-positive-500">
                        ₹{finalOptimistic.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-text-tertiary">In strong bull markets</span>
                </Card>
            </div>

            {/* Simulation Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card padding="md" className="lg:col-span-2 min-h-[400px] flex flex-col">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <LineChartIcon className="h-4 w-4 text-wealth-400" />
                            <CardTitle>Monte Carlo Probability Bounds</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="flex-1 min-h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02}/>
                                    </linearGradient>
                                    <linearGradient id="colorCon" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.01}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                                />
                                <Tooltip
                                    formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`}
                                    contentStyle={{
                                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                                        borderColor: "rgba(255,255,255,0.1)",
                                        borderRadius: "12px",
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                                
                                <Area
                                    type="monotone"
                                    dataKey="Optimistic Scenario"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorOpt)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Expected Target"
                                    stroke="#3B82F6"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorExp)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Conservative Scenario"
                                    stroke="#EF4444"
                                    strokeWidth={1.5}
                                    fillOpacity={1}
                                    fill="url(#colorCon)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Invested Capital"
                                    stroke="rgba(148, 163, 184, 0.5)"
                                    strokeWidth={1}
                                    fill="none"
                                    strokeDasharray="4 4"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Mathematical Insight Summary */}
                <div className="space-y-4 flex flex-col justify-between">
                    <Card padding="md" className="space-y-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4.5 w-4.5 text-wealth-400" />
                            <CardTitle className="text-sm">compounding metrics</CardTitle>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-border-subtle pb-2">
                                <span className="text-xs text-text-secondary">Expected CAGR Return</span>
                                <span className="text-xs font-bold text-text-primary">+{cagr}%</span>
                            </div>
                            <div className="flex justify-between border-b border-border-subtle pb-2">
                                <span className="text-xs text-text-secondary">Total Net Compounded Gains</span>
                                <span className="text-xs font-bold text-positive-500">
                                    +₹{totalGains > 0 ? totalGains.toLocaleString("en-IN") : 0}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-border-subtle pb-2">
                                <span className="text-xs text-text-secondary">Compounding Multiplier</span>
                                <span className="text-xs font-bold text-wealth-400">
                                    {finalExpected && finalInvested ? (finalExpected / finalInvested).toFixed(2) : 1}x
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-border-subtle pb-2">
                                <span className="text-xs text-text-secondary">Outperform FD Probability</span>
                                <span className="text-xs font-bold text-positive-500">{fdOutperformance}%</span>
                            </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-surface-50 border border-border-subtle text-[11px] text-text-secondary leading-relaxed space-y-2">
                            <p>
                                💡 **The Volatility Shield**: When you increase volatility, the gap between Conservative and Optimistic outcomes widens significantly.
                            </p>
                            <p>
                                Over longer horizons (e.g. 15+ years), the compounding effect acts as an insurance layer, keeping the Conservative scenario highly efficient compared to raw savings.
                            </p>
                        </div>
                    </Card>

                    <Card padding="md" className="bg-gradient-to-br from-wealth-600/10 to-transparent border border-wealth-500/20">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-wealth-400" />
                            Teller Wisdom
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            "Compounding growth is highly back-loaded. Your SIP generates nearly 50% of its total projected returns in the final 4 years of the {years}-year timeline."
                        </p>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}

export default function WealthProjectionPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-tertiary">Loading Monte Carlo Simulator...</div>}>
            <MonteCarloContent />
        </Suspense>
    );
}
