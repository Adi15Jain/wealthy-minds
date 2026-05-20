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
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import {
    TrendingUp,
    Plus,
    X,
    Sparkles,
    Calculator,
    HelpCircle,
    Info,
    RefreshCw,
    TrendingDown,
    Award,
    Copy,
    Check,
    Search,
    Loader2,
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

// Dynamic asset type — no hardcoded data
interface Asset {
    symbol: string;
    name: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    cagr3y: number;
    cagr5y?: number;
    cagr1y?: number;
    volatility: "Low" | "Medium" | "High";
    volatilityPercent?: number;
    consistency: number; // Sharpe consistency out of 100
    drawdown: number; // Worst historical drop %
    sector: string;
    riskLabel?: string;
    aiSummary?: string;
    strengths?: string[];
    risks?: string[];
    recommendation?: string;
    // Groww enrichment
    marketCap?: string;
    peRatio?: number;
    roe?: number;
    debtToEquity?: number;
}

// NO PRESET_ASSETS — everything is loaded dynamically

function ComparativeSIPAnalyzerContent() {
    const searchParams = useSearchParams();
    const compareQuery = searchParams.get("compare");

    // UI Configuration States
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
    const [sipAmount, setSipAmount] = useState<number>(10000);
    const [years, setYears] = useState<number>(10);
    const [stepUp, setStepUp] = useState<number>(10); // Yearly step-up %

    // Real-time Groww API Search Autocomplete States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Custom asset form state
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customAsset, setCustomAsset] = useState<Partial<Asset>>({
        symbol: "CUSTOM_EQUITY",
        name: "My Custom Equity / Scheme",
        type: "Stock",
        cagr3y: 15.0,
        volatility: "Medium",
        consistency: 80,
        drawdown: -15.0,
        sector: "Custom Sector",
    });

    const [assetsList, setAssetsList] = useState<Asset[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);

    // AI recommendation state
    const [aiRecommendation, setAiRecommendation] = useState<string>("");
    const [loadingAi, setLoadingAi] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");

    // Load initial assets dynamically from trending API on mount
    useEffect(() => {
        const loadInitialAssets = async () => {
            setInitialLoading(true);
            try {
                const res = await fetch("/api/market/trending");
                const data = await res.json();
                if (data.success && data.data && Array.isArray(data.data)) {
                    const trendingAssets: Asset[] = data.data.map((a: any) => ({
                        symbol: a.symbol,
                        name: a.name,
                        type: a.type,
                        cagr3y: a.cagr3y,
                        cagr1y: a.cagr1y,
                        volatility: a.volatility,
                        consistency: a.consistency,
                        drawdown: a.drawdown,
                        sector: a.sector,
                        riskLabel: a.riskLabel,
                    }));
                    setAssetsList(trendingAssets);
                    // Auto-select first 2 assets for comparison
                    if (trendingAssets.length >= 2) {
                        setSelectedSymbols([trendingAssets[0].symbol, trendingAssets[1].symbol]);
                    } else if (trendingAssets.length === 1) {
                        setSelectedSymbols([trendingAssets[0].symbol]);
                    }
                }
            } catch (e) {
                console.error("Failed to load initial assets", e);
            } finally {
                setInitialLoading(false);
            }
        };
        loadInitialAssets();
    }, []);

    // Debounce search input and hit real Groww API gateway
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success && data.content) {
                    setSearchResults(data.content);
                }
            } catch (e) {
                console.error("Failed to query Groww API", e);
            } finally {
                setSearchLoading(false);
            }
        }, 350);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Handle selecting an autocomplete search result from Groww
    const handleSelectRealAsset = async (item: any) => {
        setSearchQuery("");
        setSearchResults([]);
        setDetailsLoading(true);

        try {
            const detailsUrl = `/api/market/details?name=${encodeURIComponent(item.name)}&type=${encodeURIComponent(item.type)}&symbol=${encodeURIComponent(item.symbol)}&id=${encodeURIComponent(item.id)}`;
            const res = await fetch(detailsUrl);
            const data = await res.json();

            if (data.success && data.data) {
                const newAsset: Asset = data.data;

                // Check if symbol is already in list, if not add it
                setAssetsList((prev) => {
                    if (prev.some((a) => a.symbol === newAsset.symbol)) {
                        return prev;
                    }
                    return [...prev, newAsset];
                });

                // Auto-select the newly added real asset
                setSelectedSymbols((prev) => {
                    if (prev.includes(newAsset.symbol)) {
                        return prev;
                    }
                    if (prev.length < 3) {
                        return [...prev, newAsset.symbol];
                    }
                    return [prev[0], prev[1], newAsset.symbol];
                });
            }
        } catch (e) {
            console.error("Failed to fetch asset performance details", e);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Read URL search params for cross-page asset pre-selection
    useEffect(() => {
        if (!compareQuery) return;
        // Check if the symbol is already in our list
        const existsInList = assetsList.some((a) => a.symbol === compareQuery);
        if (existsInList) {
            if (!selectedSymbols.includes(compareQuery)) {
                if (selectedSymbols.length >= 3) {
                    setSelectedSymbols([selectedSymbols[0], selectedSymbols[1], compareQuery]);
                } else {
                    setSelectedSymbols([...selectedSymbols, compareQuery]);
                }
            }
        } else {
            // Asset not in list yet — fetch it dynamically using URL params
            const urlParams = new URLSearchParams(window.location.search);
            const assetName = urlParams.get("name");
            const assetType = urlParams.get("type") || "Stock";
            if (assetName) {
                const fetchAndAdd = async () => {
                    try {
                        const detailsUrl = `/api/market/details?name=${encodeURIComponent(assetName)}&type=${encodeURIComponent(assetType)}&symbol=${encodeURIComponent(compareQuery)}&id=`;
                        const res = await fetch(detailsUrl);
                        const data = await res.json();
                        if (data.success && data.data) {
                            const newAsset: Asset = data.data;
                            setAssetsList((prev) => {
                                if (prev.some((a) => a.symbol === newAsset.symbol)) return prev;
                                return [...prev, newAsset];
                            });
                            setSelectedSymbols((prev) => {
                                if (prev.includes(newAsset.symbol)) return prev;
                                if (prev.length < 3) return [...prev, newAsset.symbol];
                                return [prev[0], prev[1], newAsset.symbol];
                            });
                        }
                    } catch (e) {
                        console.error("Failed to load asset from URL params", e);
                    }
                };
                fetchAndAdd();
            }
        }
    }, [compareQuery, assetsList]);

    // Handle adding custom asset to the list and selecting it
    const handleAddCustomAsset = () => {
        if (!customAsset.symbol || !customAsset.name || !customAsset.cagr3y) return;

        const newAsset: Asset = {
            symbol: customAsset.symbol.toUpperCase(),
            name: customAsset.name,
            type: customAsset.type || "Stock",
            cagr3y: Number(customAsset.cagr3y),
            volatility: customAsset.volatility || "Medium",
            consistency: Number(customAsset.consistency) || 75,
            drawdown: Number(customAsset.drawdown) || -15,
            sector: customAsset.sector || "General Sector",
        };

        setAssetsList((prev) => [...prev, newAsset]);
        
        // Auto-select the newly added asset
        if (selectedSymbols.length < 3) {
            setSelectedSymbols((prev) => [...prev, newAsset.symbol]);
        } else {
            setSelectedSymbols((prev) => [prev[0], prev[1], newAsset.symbol]);
        }

        setShowCustomModal(false);
    };

    // Toggle asset selection (Max 3)
    const toggleAssetSelect = (symbol: string) => {
        if (selectedSymbols.includes(symbol)) {
            // Keep at least one selected asset
            if (selectedSymbols.length > 1) {
                setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
            }
        } else {
            if (selectedSymbols.length < 3) {
                setSelectedSymbols([...selectedSymbols, symbol]);
            } else {
                // Replace the last one
                setSelectedSymbols([selectedSymbols[0], selectedSymbols[1], symbol]);
            }
        }
    };

    // Compounding SIP Calculations
    const selectedAssets = assetsList.filter((a) => selectedSymbols.includes(a.symbol));

    const generateChartData = () => {
        const data = [];
        const totalMonths = years * 12;

        // Track variables for each selected asset
        const balances = selectedAssets.map(() => 0);
        const currentMonthlySips = selectedAssets.map(() => sipAmount);
        let accumulatedInvestedCapital = 0;
        let currentInvestedMonthly = sipAmount;

        for (let month = 1; month <= totalMonths; month++) {
            const yearIndex = Math.floor((month - 1) / 12);
            
            // Yearly Step-Up logic
            if (month > 1 && (month - 1) % 12 === 0) {
                for (let i = 0; i < selectedAssets.length; i++) {
                    currentMonthlySips[i] = currentMonthlySips[i] * (1 + stepUp / 100);
                }
                currentInvestedMonthly = currentInvestedMonthly * (1 + stepUp / 100);
            }

            accumulatedInvestedCapital += currentInvestedMonthly;

            const record: any = {
                month: month,
                year: `Yr ${(month / 12).toFixed(1)}`,
                "Capital Invested": Math.round(accumulatedInvestedCapital),
            };

            for (let i = 0; i < selectedAssets.length; i++) {
                const asset = selectedAssets[i];
                const monthlyRate = asset.cagr3y / 12 / 100;
                
                // Compounding math: add monthly investment then apply growth rate
                balances[i] = (balances[i] + currentMonthlySips[i]) * (1 + monthlyRate);
                record[asset.symbol] = Math.round(balances[i]);
            }

            // Sample data points to keep chart lightweight (every 3 months, plus first & last)
            if (month === 1 || month === totalMonths || month % 3 === 0) {
                data.push(record);
            }
        }
        return data;
    };

    const chartData = generateChartData();

    // Calculate final summary metrics for each selected asset
    const getAssetSummaryMetrics = (asset: Asset) => {
        const totalMonths = years * 12;
        let balance = 0;
        let accumulatedInvested = 0;
        let currentSip = sipAmount;

        for (let month = 1; month <= totalMonths; month++) {
            if (month > 1 && (month - 1) % 12 === 0) {
                currentSip = currentSip * (1 + stepUp / 100);
            }
            accumulatedInvested += currentSip;
            const monthlyRate = asset.cagr3y / 12 / 100;
            balance = (balance + currentSip) * (1 + monthlyRate);
        }

        const growth = balance - accumulatedInvested;
        const multiplier = balance / accumulatedInvested;

        // Custom Teller Efficiency Score: Risk-adjusted score out of 100
        const volPenalty = asset.volatility === "High" ? 15 : asset.volatility === "Medium" ? 7 : 2;
        const ddPenalty = Math.abs(asset.drawdown) * 0.8;
        const returnWeight = asset.cagr3y * 2.2;
        const consistencyBonus = asset.consistency * 0.35;
        const rawScore = returnWeight + consistencyBonus - volPenalty - ddPenalty;
        const efficiencyScore = Math.max(30, Math.min(99, Math.round(rawScore)));

        return {
            invested: Math.round(accumulatedInvested),
            futureValue: Math.round(balance),
            growth: Math.round(growth),
            multiplier: multiplier.toFixed(2),
            efficiencyScore,
        };
    };

    // AI recommendation triggering — uses the deep /api/market/analyze endpoint
    const handleFetchAIRecommendation = async () => {
        if (selectedAssets.length === 0) return;

        setLoadingAi(true);
        setAiRecommendation("");
        
        const loaderPrompts = [
            "Retrieving real-time performance data...",
            "Analyzing CAGR and risk-reward matrices...",
            "Running compound projection scenarios...",
            "Evaluating drawdown resilience...",
            "Generating actionable investment recommendation...",
        ];
        
        let promptIndex = 0;
        setLoadingMessage(loaderPrompts[0]);
        const loaderInterval = setInterval(() => {
            promptIndex = (promptIndex + 1) % loaderPrompts.length;
            setLoadingMessage(loaderPrompts[promptIndex]);
        }, 1800);

        try {
            // Enrich assets with computed projection data
            const enrichedAssets = selectedAssets.map((asset) => {
                const metrics = getAssetSummaryMetrics(asset);
                return {
                    ...asset,
                    projectedInvested: metrics.invested,
                    projectedFutureValue: metrics.futureValue,
                    projectedMultiplier: metrics.multiplier,
                    projectedGrowth: metrics.growth,
                    efficiencyScore: metrics.efficiencyScore,
                };
            });

            const response = await fetch("/api/market/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assets: enrichedAssets,
                    sipAmount,
                    years,
                    stepUp,
                }),
            });

            const data = await response.json();
            clearInterval(loaderInterval);

            if (data.success && data.data) {
                // Format structured analysis into readable markdown
                const analysis = data.data;
                let formattedText = "";

                if (analysis.verdict) {
                    formattedText += `### 🏆 Verdict\n\n${analysis.verdict}\n\n`;
                }

                if (analysis.ranking && Array.isArray(analysis.ranking)) {
                    formattedText += `### 📊 Investment Rankings\n\n`;
                    analysis.ranking.forEach((r: any) => {
                        formattedText += `**#${r.rank} — ${r.name}** (Score: ${r.score}/100)\n${r.rationale}\n\n`;
                    });
                }

                if (analysis.deepAnalysis) {
                    const da = analysis.deepAnalysis;
                    if (da.riskRewardMatrix) {
                        formattedText += `### ⚖️ Risk-Reward Analysis\n\n${da.riskRewardMatrix}\n\n`;
                    }
                    if (da.compoundingAdvantage) {
                        formattedText += `### 📈 Compounding Advantage\n\n${da.compoundingAdvantage}\n\n`;
                    }
                    if (da.marketCycleResilience) {
                        formattedText += `### 🛡️ Market Cycle Resilience\n\n${da.marketCycleResilience}\n\n`;
                    }
                    if (da.sipOptimalStrategy) {
                        formattedText += `### 🎯 Optimal SIP Strategy\n\n${da.sipOptimalStrategy}\n\n`;
                    }
                }

                if (analysis.projections) {
                    formattedText += `### 🔮 Projections\n\n`;
                    if (analysis.projections.bestCase) formattedText += `* **Best Case:** ${analysis.projections.bestCase}\n`;
                    if (analysis.projections.worstCase) formattedText += `* **Worst Case:** ${analysis.projections.worstCase}\n`;
                    if (analysis.projections.recommendation) formattedText += `* **Recommendation:** ${analysis.projections.recommendation}\n\n`;
                }

                if (analysis.keyInsights && Array.isArray(analysis.keyInsights)) {
                    formattedText += `### 💡 Key Insights\n\n`;
                    analysis.keyInsights.forEach((insight: string) => {
                        formattedText += `* ${insight}\n`;
                    });
                    formattedText += "\n";
                }

                if (analysis.warnings && Array.isArray(analysis.warnings)) {
                    formattedText += `### ⚠️ Important Warnings\n\n`;
                    analysis.warnings.forEach((w: string) => {
                        formattedText += `* ${w}\n`;
                    });
                }

                setAiRecommendation(formattedText.trim());
            } else {
                // Fallback to the chat-style insights API
                const fallbackRes = await fetch("/api/ai/insights", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: `Compare these ${selectedAssets.length} assets for a ${years}-year SIP of ₹${sipAmount.toLocaleString("en-IN")}/month with ${stepUp}% step-up: ${selectedAssets.map(a => `${a.name} (${a.cagr3y}% CAGR, ${a.volatility} volatility)`).join(" vs ")}. Give a decisive recommendation.`,
                        type: "comparison",
                    }),
                });
                const fallbackData = await fallbackRes.json();
                if (fallbackData.success && fallbackData.text) {
                    setAiRecommendation(fallbackData.text);
                } else {
                    setAiRecommendation("Failed to receive AI feedback. Please try again.");
                }
            }
        } catch (e) {
            clearInterval(loaderInterval);
            console.error("AI analysis failed", e);
            setAiRecommendation("Failed to connect to the WealthyMinds analysis engine. Please check your connection and try again.");
        } finally {
            setLoadingAi(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(aiRecommendation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lineColors = ["#10B981", "#3B82F6", "#F59E0B"];

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
            className="space-y-8"
        >
            <PageHeader
                title="SIP Comparative Analyzer"
                description="Compare up to 3 shares or mutual funds side-by-side on risk, CAGR, and compound growth, to pinpoint the best long-term SIP."
                actions={
                    <Button onClick={() => setShowCustomModal(true)} size="sm" variant="outline">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Create Custom Asset
                    </Button>
                }
            />

            {/* REAL-TIME API SEARCH BOX */}
            <Card padding="md" className="relative z-30">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-text-tertiary" />
                    
                    <input
                        type="text"
                        placeholder="Search & add ANY real-world Stock, ETF, or Mutual Fund from Indian markets (e.g. Tata Motors, Axis Bluechip)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-surface-50 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-all shadow-inner"
                    />

                    <div className="absolute right-3.5 top-3">
                        {(searchLoading || detailsLoading) && (
                            <Loader2 className="h-5 w-5 text-wealth-400 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Autocomplete suggestions dropdown */}
                <AnimatePresence>
                    {isFocused && searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 top-[102%] mt-1 max-h-64 overflow-y-auto rounded-xl bg-surface-100/95 backdrop-blur-md border border-border-subtle shadow-2xl p-2 space-y-1 z-50 scrollbar-thin"
                        >
                            {searchResults.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelectRealAsset(item)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-wealth-500/10 hover:border-wealth-500/20 border border-transparent transition-all flex items-center justify-between group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-text-primary group-hover:text-wealth-400 transition-colors truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-[10px] text-text-tertiary truncate font-mono mt-0.5">
                                            {item.symbol} &bull; {item.sector}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            item.type === "Stock"
                                                ? "default"
                                                : item.type === "Mutual Fund"
                                                  ? "positive"
                                                  : "warning"
                                        }
                                        className="text-[9px]"
                                    >
                                        {item.type}
                                    </Badge>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Asset Selector Row */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-wealth-400" />
                        {assetsList.length === 0 && !initialLoading
                            ? "Search above to add assets for comparison"
                            : `Select up to 3 Assets to Compare (Currently ${selectedSymbols.length}/3 selected)`}
                    </p>
                    <Badge variant="outline">
                        {initialLoading ? "Loading live data..." : "Click to Select/Deselect"}
                    </Badge>
                </div>

                {/* Loading skeleton */}
                {initialLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="p-3.5 rounded-xl border border-border-subtle bg-surface-50 animate-pulse">
                                <div className="h-4 w-12 bg-surface-200 rounded mb-2" />
                                <div className="h-3 w-24 bg-surface-200 rounded mb-2" />
                                <div className="h-3 w-16 bg-surface-200 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {assetsList.map((asset) => {
                        const isSelected = selectedSymbols.includes(asset.symbol);
                        return (
                            <button
                                key={asset.symbol}
                                onClick={() => toggleAssetSelect(asset.symbol)}
                                className={`text-left p-3.5 rounded-xl border transition-all duration-300 relative ${
                                    isSelected
                                        ? "bg-wealth-500/10 border-wealth-500/50 shadow-md scale-[1.01]"
                                        : "bg-surface-50 hover:bg-surface-100 border-border-subtle hover:border-border-default"
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-wealth-500" />
                                )}
                                <div className="flex items-center gap-1 mb-1">
                                    <Badge
                                        variant={
                                            asset.type === "Stock"
                                                ? "default"
                                                : asset.type === "Mutual Fund"
                                                  ? "positive"
                                                  : "warning"
                                        }
                                        className="text-[9px] px-1 py-0"
                                    >
                                        {asset.type === "Mutual Fund" ? "MF" : asset.type}
                                    </Badge>
                                </div>
                                <h4 className="text-xs font-bold text-text-primary truncate">{asset.name}</h4>
                                <div className="flex items-center justify-between mt-2.5">
                                    <span className="text-[10px] text-text-tertiary font-mono">{asset.symbol}</span>
                                    <span className="text-[11px] font-bold text-positive-500">+{asset.cagr3y}%</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Config & Parameters */}
            <Card padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Starting Monthly SIP
                            </label>
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

                    {/* Time Horizon */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                Time Horizon
                            </label>
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

                    {/* Yearly Step-Up */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                                Yearly SIP Step-Up
                                <span title="Increases your monthly SIP contribution every year to combat inflation and speed up compounding.">
                                    <HelpCircle className="h-3 w-3 text-text-tertiary cursor-help" />
                                </span>
                            </label>
                            <span className="text-sm font-bold text-wealth-400">+{stepUp}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="25"
                            step="1"
                            value={stepUp}
                            onChange={(e) => setStepUp(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-text-tertiary">
                            <span>No Step-Up</span>
                            <span>10% Yearly</span>
                            <span>25% Yearly</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Comparison Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compound Growth Chart (Col span 2) */}
                <div className="lg:col-span-2 bg-blend-normal">
                    <Card padding="md" className="h-full min-h-[420px] flex flex-col">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4 text-wealth-400" />
                                <CardTitle>Compounding Projection Trajectory</CardTitle>
                            </div>
                        </CardHeader>
                        
                        <div className="flex-1 min-h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="year"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#94A3B8", fontSize: 10 }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                                        tick={{ fill: "#94A3B8", fontSize: 10 }}
                                    />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [
                                            `₹${Number(value).toLocaleString("en-IN")}`,
                                            name === "Capital Invested" ? "Total Invested" : name,
                                        ]}
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            borderColor: "rgba(255,255,255,0.1)",
                                            borderRadius: "12px",
                                            color: "#fff",
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: "11px", color: "#94A3B8" }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Capital Invested"
                                        stroke="rgba(148, 163, 184, 0.4)"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        dot={false}
                                    />
                                    {selectedAssets.map((asset, idx) => (
                                        <Line
                                            key={asset.symbol}
                                            type="monotone"
                                            dataKey={asset.symbol}
                                            name={asset.name}
                                            stroke={lineColors[idx % lineColors.length]}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Metrics Details */}
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Award className="h-4.5 w-4.5 text-wealth-400" />
                        Comparison Matrix
                    </h3>

                    {selectedAssets.map((asset, idx) => {
                        const m = getAssetSummaryMetrics(asset);
                        const c = lineColors[idx % lineColors.length];
                        return (
                            <Card key={asset.symbol} padding="md" className="border-l-4" style={{ borderLeftColor: c }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary truncate max-w-[200px]">
                                            {asset.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-text-tertiary font-mono">{asset.symbol}</span>
                                            <span className="text-[10px] px-1 rounded bg-surface-200 text-text-tertiary">
                                                {asset.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs text-text-tertiary">Teller Efficiency Score</div>
                                        <div className="text-lg font-extrabold text-wealth-400 flex items-center justify-end gap-1">
                                            <span>{m.efficiencyScore}</span>
                                            <span className="text-xs text-text-tertiary">/100</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border-subtle">
                                    <div>
                                        <p className="text-[9px] text-text-tertiary uppercase">Investment</p>
                                        <p className="text-xs font-semibold text-text-primary mt-0.5">
                                            ₹{Math.round(m.invested / 100000).toFixed(1)}L
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-text-tertiary uppercase">Future Value</p>
                                        <p className="text-xs font-bold mt-0.5" style={{ color: c }}>
                                            ₹{Math.round(m.futureValue / 100000).toFixed(1)}L
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-text-tertiary uppercase">Multiplier</p>
                                        <p className="text-xs font-extrabold text-positive-500 mt-0.5">
                                            {m.multiplier}x
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border-subtle/50 text-[10px]">
                                    <div>
                                        <span className="text-text-tertiary">CAGR:</span>{" "}
                                        <span className="font-bold text-text-primary">+{asset.cagr3y}%</span>
                                    </div>
                                    <div>
                                        <span className="text-text-tertiary">Vol:</span>{" "}
                                        <span className="font-bold text-text-primary">{asset.volatility}</span>
                                    </div>
                                    <div className="flex items-center text-negative-400">
                                        <TrendingDown className="h-3 w-3 mr-0.5" />
                                        <span>{asset.drawdown}%</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* AI recommendation module */}
            <Card padding="lg" className="border-gradient shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-wealth-500/5 via-transparent to-wealth-600/5 -z-10" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-wealth-400 animate-pulse" />
                            AI Teller Recommendation Narrative
                        </h3>
                        <p className="text-xs text-text-secondary max-w-xl">
                            Request a full customized intelligence audit from WealthyMinds AI to determine which SIP scheme fits your risk threshold and compounding targets.
                        </p>
                    </div>

                    <Button onClick={handleFetchAIRecommendation} disabled={loadingAi} className="flex-shrink-0 group">
                        {loadingAi ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Run AI Teller Audit
                            </>
                        )}
                    </Button>
                </div>

                {/* AI Recommendation Content Display */}
                <AnimatePresence>
                    {loadingAi && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-6 p-12 border border-border-subtle rounded-xl bg-surface-50/50 flex flex-col items-center justify-center space-y-4"
                        >
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full border-2 border-t-wealth-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-wealth-400" />
                            </div>
                            <p className="text-sm font-semibold text-wealth-400">{loadingMessage}</p>
                            <p className="text-xs text-text-tertiary">Reading through volatility standard deviations...</p>
                        </motion.div>
                    )}

                    {aiRecommendation && !loadingAi && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 border border-border-subtle rounded-xl bg-surface-50 p-6 relative"
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const printContent = aiRecommendation
                                            .replace(/\\n/g, '\n')
                                            .replace(/### /g, '\n\n')
                                            .replace(/\*\*/g, '');
                                        const printWindow = window.open('', '_blank');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                                <html>
                                                <head>
                                                    <title>WealthyMinds AI Teller Report</title>
                                                    <style>
                                                        body { font-family: 'Inter', 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; line-height: 1.7; }
                                                        h1 { font-size: 22px; color: #1a1a2e; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
                                                        h2 { font-size: 16px; color: #4338ca; margin-top: 24px; }
                                                        h4 { font-size: 14px; color: #4338ca; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
                                                        p { font-size: 13px; margin: 8px 0; }
                                                        ul { padding-left: 20px; }
                                                        li { font-size: 12px; margin: 4px 0; }
                                                        .meta { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
                                                        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <h1>🧠 WealthyMinds AI Teller Report</h1>
                                                    <p class="meta">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • Assets: ${selectedAssets.map(a => a.name).join(', ')}</p>
                                                    <p class="meta">SIP: ₹${sipAmount.toLocaleString('en-IN')}/month • Duration: ${years} years • Step-up: ${stepUp}%/year</p>
                                                    ${aiRecommendation.split('\\n\\n').map(p => {
                                                        if (p.startsWith('###')) return `<h4>${p.replace('###', '').trim()}</h4>`;
                                                        if (p.startsWith('* ') || p.startsWith('- ')) return `<ul>${p.split('\\n').map(li => `<li>${li.replace(/^[\*\-]\s+/, '')}</li>`).join('')}</ul>`;
                                                        return `<p>${p}</p>`;
                                                    }).join('')}
                                                    <div class="footer">WealthyMinds — AI-Powered Wealth Intelligence • This is not financial advice</div>
                                                </body>
                                                </html>
                                            `);
                                            printWindow.document.close();
                                            printWindow.print();
                                        }
                                    }}
                                    className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 border border-border-subtle text-text-secondary hover:text-text-primary transition-all duration-200"
                                    title="Export as PDF"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 border border-border-subtle text-text-secondary hover:text-text-primary transition-all duration-200"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-positive-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none text-text-secondary space-y-4 leading-relaxed">
                                {aiRecommendation.split("\n\n").map((paragraph, index) => {
                                    if (paragraph.startsWith("###")) {
                                        return (
                                            <h4 key={index} className="text-sm font-bold text-text-primary mt-4 pt-2 border-b border-border-subtle/50 pb-1 flex items-center gap-1.5">
                                                {paragraph.replace("###", "").trim()}
                                            </h4>
                                        );
                                    }
                                    if (paragraph.startsWith("* ") || paragraph.startsWith("- ")) {
                                        return (
                                            <ul key={index} className="list-disc pl-5 space-y-1.5 my-2">
                                                {paragraph.split("\n").map((li, lIdx) => (
                                                    <li key={lIdx} className="text-xs">
                                                        {li.replace(/^[\*\-]\s+/, "").trim()}
                                                    </li>
                                                ))}
                                            </ul>
                                        );
                                    }
                                    return (
                                        <p key={index} className="text-xs">
                                            {paragraph}
                                        </p>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Custom Asset Creation Modal */}
            <AnimatePresence>
                {showCustomModal && (
                    <div className="fixed inset-0 bg-surface-0/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="glass-strong rounded-2xl border border-border-subtle max-w-md w-full p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-wealth-400" />
                                    Configure Custom Asset
                                </h3>
                                <button onClick={() => setShowCustomModal(false)} className="text-text-tertiary hover:text-text-primary">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                        Asset Symbol / Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. SGB_BOND, WIPRO"
                                        value={customAsset.symbol || ""}
                                        onChange={(e) => setCustomAsset({ ...customAsset, symbol: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                        Asset Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Wipro Limited"
                                        value={customAsset.name || ""}
                                        onChange={(e) => setCustomAsset({ ...customAsset, name: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                            Asset Type
                                        </label>
                                        <select
                                            value={customAsset.type || "Stock"}
                                            onChange={(e) => setCustomAsset({ ...customAsset, type: e.target.value as any })}
                                            className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                        >
                                            <option value="Stock">Stock / Share</option>
                                            <option value="Mutual Fund">Mutual Fund</option>
                                            <option value="Bond">Bond / Debt</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                            Estimated CAGR (%)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="15.0"
                                            value={customAsset.cagr3y || ""}
                                            onChange={(e) => setCustomAsset({ ...customAsset, cagr3y: parseFloat(e.target.value) })}
                                            className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                            Risk Volatility
                                        </label>
                                        <select
                                            value={customAsset.volatility || "Medium"}
                                            onChange={(e) => setCustomAsset({ ...customAsset, volatility: e.target.value as any })}
                                            className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                        >
                                            <option value="Low">Low Volatility</option>
                                            <option value="Medium">Medium Volatility</option>
                                            <option value="High">High Volatility</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                                            Max Drawdown (%)
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="-15"
                                            value={customAsset.drawdown || ""}
                                            onChange={(e) => setCustomAsset({ ...customAsset, drawdown: parseFloat(e.target.value) })}
                                            className="w-full px-3.5 py-2 rounded-lg bg-surface-50 border border-border-subtle text-text-primary focus:border-wealth-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowCustomModal(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleAddCustomAsset}>
                                    Save & Compare
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function SIPTrackingPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-tertiary">Loading SIP Analyzer...</div>}>
            <ComparativeSIPAnalyzerContent />
        </Suspense>
    );
}
