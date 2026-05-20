"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card,
    
    Button,
    Badge,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import {
    Search,
    TrendingUp,
    Sparkles,
    ArrowRight,
    Star,
    Percent,
    Shield,
    TrendingDown,
    LineChart,
    ChevronRight,
    HelpCircle,
    Loader2,
    AlertCircle,
    Zap,
    BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Asset {
    symbol: string;
    name: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    cagr3y: number;
    cagr5y?: number;
    cagr1y?: number;
    volatility: "Low" | "Medium" | "High";
    volatilityPercent?: number;
    consistency: number;
    drawdown: number;
    sector: string;
    riskLabel?: string;
    highlight?: string;
    // Enriched fields from Groww
    marketCap?: string;
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    roe?: number;
    eps?: number;
    debtToEquity?: number;
    yearHigh?: number;
    yearLow?: number;
    cappedType?: string;
    logoUrl?: string;
    industryName?: string;
    // AI analysis fields
    aiSummary?: string;
    strengths?: string[];
    risks?: string[];
    recommendation?: string;
    fairValueAssessment?: string;
    sipSuitability?: string;
}

interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    sector: string;
}

interface MarketIndex {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    trend: string;
    weekHigh?: number;
    weekLow?: number;
}

const SUGGESTED_ASKS = [
    "Which Mid Cap SIP is best for the next 10 years?",
    "Compare Parag Parikh Flexi Cap vs UTI Nifty 50 Index",
    "Analyze Reliance Industries share long-term risk",
    "Is HDFC Mid-Cap Opportunities too risky for a 5-year SIP?",
];

export default function DashboardPage() {
    const router = useRouter();

    // ── Trending/Featured Assets (loaded dynamically) ───────────────────
    const [featuredAssets, setFeaturedAssets] = useState<Asset[]>([]);
    const [featuredLoading, setFeaturedLoading] = useState(true);
    const [featuredError, setFeaturedError] = useState("");

    // ── Market Indices (loaded dynamically) ─────────────────────────────
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [indicesLoading, setIndicesLoading] = useState(true);

    // ── Live Search Autocomplete ─────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // ── Selected Asset Modal ─────────────────────────────────────────────
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // ── Watchlist ────────────────────────────────────────────────────────
    const [watchlist, setWatchlist] = useState<Asset[]>([]);

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS — Dynamic Data Loading
    // ═══════════════════════════════════════════════════════════════════════

    // Load trending assets on mount
    useEffect(() => {
        const fetchTrending = async () => {
            setFeaturedLoading(true);
            setFeaturedError("");
            try {
                const res = await fetch("/api/market/trending");
                const data = await res.json();
                if (data.success && data.data) {
                    setFeaturedAssets(data.data);
                } else {
                    setFeaturedError("Failed to load trending assets.");
                }
            } catch (e) {
                console.error("Failed to fetch trending assets", e);
                setFeaturedError("Network error loading trending assets.");
            } finally {
                setFeaturedLoading(false);
            }
        };
        fetchTrending();
    }, []);

    // Load market indices on mount
    useEffect(() => {
        const fetchIndices = async () => {
            setIndicesLoading(true);
            try {
                const res = await fetch("/api/market/indices");
                const data = await res.json();
                if (data.success && data.data) {
                    setIndices(data.data);
                }
            } catch (e) {
                console.error("Failed to fetch indices", e);
            } finally {
                setIndicesLoading(false);
            }
        };
        fetchIndices();
    }, []);

    // Load watchlist from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("wealthyminds_watchlist_v2");
            if (saved) {
                setWatchlist(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load watchlist", e);
        }
    }, []);

    // Debounced autocomplete search
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
                console.error("Search failed", e);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(searchQuery)}`);
    };

    const handleSelectSearchResult = async (item: SearchResult) => {
        setSearchQuery("");
        setSearchResults([]);
        setDetailsLoading(true);

        try {
            const detailsUrl = `/api/market/details?name=${encodeURIComponent(item.name)}&type=${encodeURIComponent(item.type)}&symbol=${encodeURIComponent(item.symbol)}&id=${encodeURIComponent(item.id)}`;
            const res = await fetch(detailsUrl);
            const data = await res.json();

            if (data.success && data.data) {
                setSelectedAsset(data.data);
            } else {
                console.error("Failed to fetch details:", data.message);
            }
        } catch (e) {
            console.error("Failed to fetch asset details", e);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleFeaturedAssetClick = async (asset: Asset) => {
        // If we already have enriched details, show immediately
        if (asset.aiSummary) {
            setSelectedAsset(asset);
            return;
        }

        // Otherwise fetch full details
        setDetailsLoading(true);
        try {
            const detailsUrl = `/api/market/details?name=${encodeURIComponent(asset.name)}&type=${encodeURIComponent(asset.type)}&symbol=${encodeURIComponent(asset.symbol)}&id=`;
            const res = await fetch(detailsUrl);
            const data = await res.json();
            if (data.success && data.data) {
                setSelectedAsset(data.data);
            } else {
                setSelectedAsset(asset);
            }
        } catch (e) {
            setSelectedAsset(asset);
        } finally {
            setDetailsLoading(false);
        }
    };

    const toggleWatchlist = (asset: Asset, e: React.MouseEvent) => {
        e.stopPropagation();
        let updated: Asset[];
        const exists = watchlist.some(w => w.symbol === asset.symbol);
        if (exists) {
            updated = watchlist.filter(w => w.symbol !== asset.symbol);
        } else {
            updated = [...watchlist, asset];
        }
        setWatchlist(updated);
        localStorage.setItem("wealthyminds_watchlist_v2", JSON.stringify(updated));
    };

    const isInWatchlist = (symbol: string) => watchlist.some(w => w.symbol === symbol);

    const triggerSuggestedAsk = (ask: string) => {
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(ask)}`);
    };

    const handleAssetAsk = (assetName: string) => {
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(`Analyze the past performance, volatility, risk profile, and long-term SIP suitability of ${assetName}`)}`);
    };

    const handleAssetCompare = (asset: Asset) => {
        router.push(`/dashboard/sip-tracking?compare=${encodeURIComponent(asset.symbol)}&name=${encodeURIComponent(asset.name)}&type=${encodeURIComponent(asset.type)}`);
    };

    const handleSimulateMonteCarlo = (asset: Asset) => {
        const volNum = asset.volatilityPercent || (asset.volatility === "High" ? 22 : asset.volatility === "Medium" ? 14 : 7);
        router.push(`/dashboard/wealth-projection?name=${encodeURIComponent(asset.name)}&cagr=${asset.cagr3y}&vol=${volNum}`);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 mb-2"
                >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-wealth-600/10 text-wealth-400 border border-wealth-500/10">
                        <Sparkles className="h-3 w-3" />
                        AI Wealth Intelligence — Live Data
                    </span>
                </motion.div>
                <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
                    Ask WealthyMinds
                </h1>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    Search any stock, mutual fund, or bond. Get real-time performance data, AI-driven insights, and investment recommendations.
                </p>
            </div>

            {/* ── Market Indices Ticker ──────────────────────────────────────── */}
            {!indicesLoading && indices.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-4"
                >
                    {indices.map((idx) => (
                        <div key={idx.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-50 border border-border-subtle">
                            <span className="text-xs font-bold text-text-primary">{idx.name}</span>
                            <span className="text-sm font-extrabold text-text-primary">
                                {typeof idx.value === 'number' ? idx.value.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : idx.value}
                            </span>
                            <span className={`text-xs font-bold flex items-center gap-0.5 ${idx.change >= 0 ? 'text-positive-500' : 'text-negative-400'}`}>
                                {idx.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {idx.change >= 0 ? '+' : ''}{typeof idx.changePercent === 'number' ? idx.changePercent.toFixed(2) : idx.changePercent}%
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* ── Central Search Section ─────────────────────────────────────── */}
            <Card className="border-gradient shadow-2xl relative overflow-hidden" padding="lg">
                <div className="absolute inset-0 bg-gradient-to-r from-wealth-500/5 via-transparent to-wealth-600/5 -z-10 animate-glow-pulse" />
                <div className="absolute inset-0 dot-pattern opacity-10 -z-20" />

                <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
                    <h2 className="text-lg font-extrabold text-text-primary text-center mb-1">
                        Search & Analyze Any Investment
                    </h2>
                    <p className="text-xs text-text-tertiary text-center mb-6 max-w-lg mx-auto">
                        Type a stock name, mutual fund, or ask a question. Results are powered by live Groww market data and AI analysis.
                    </p>

                    <div className="relative" ref={searchRef}>
                        <Search className="absolute left-4 top-4 h-5 w-5 text-text-tertiary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                            placeholder="Search stocks, mutual funds, bonds (e.g. HDFC Mid Cap, Reliance, Axis Bluechip)..."
                            className="w-full pl-12 pr-32 py-4 rounded-xl bg-surface-50 border border-border-subtle text-text-primary placeholder:text-text-tertiary text-base focus:border-wealth-500 focus:outline-none transition-all duration-300 shadow-inner"
                        />
                        <div className="absolute right-2 top-2">
                            {(searchLoading || detailsLoading) ? (
                                <div className="p-2.5">
                                    <Loader2 className="h-5 w-5 text-wealth-400 animate-spin" />
                                </div>
                            ) : (
                                <Button type="submit" size="md" className="shadow-lg group">
                                    Ask AI Teller
                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                            {isFocused && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-xl bg-surface-100/95 backdrop-blur-xl border border-border-subtle shadow-2xl p-2 space-y-1 z-50"
                                >
                                    {searchResults.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectSearchResult(item)}
                                            className="w-full text-left p-3 rounded-lg hover:bg-wealth-500/10 hover:border-wealth-500/20 border border-transparent transition-all flex items-center justify-between group"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-text-primary group-hover:text-wealth-400 transition-colors truncate">
                                                    {item.name}
                                                </p>
                                                <p className="text-[10px] text-text-tertiary font-mono mt-0.5 truncate">
                                                    {item.symbol} • {item.type}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={item.type === "Stock" ? "default" : item.type === "Mutual Fund" ? "positive" : "warning"}
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
                </form>

                {/* Suggested Asks */}
                <div className="mt-4 pt-4 border-t border-border-subtle max-w-3xl mx-auto">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-wealth-400" />
                        Suggested Teller Asks
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {SUGGESTED_ASKS.map((ask) => (
                            <button
                                key={ask}
                                onClick={() => triggerSuggestedAsk(ask)}
                                className="text-left text-xs text-text-secondary hover:text-wealth-400 bg-surface-100 hover:bg-wealth-600/5 border border-border-subtle hover:border-wealth-500/20 px-3.5 py-2.5 rounded-lg transition-all duration-200 truncate flex items-center justify-between"
                            >
                                <span>{ask}</span>
                                <ChevronRight className="h-3 w-3 text-text-tertiary flex-shrink-0 ml-2" />
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* ── Main Interactive Grid ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Watchlist & Sidebar (Col-span 1) */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <Star className="h-4 w-4 text-accent-400 fill-accent-400" />
                            Saved Watchlist
                        </h3>
                        <Badge variant="outline" className="text-xs">
                            {watchlist.length} Assets
                        </Badge>
                    </div>

                    <Card padding="md" className="space-y-2 max-h-[480px] overflow-y-auto">
                        {watchlist.length === 0 ? (
                            <div className="text-center py-12 text-text-tertiary space-y-2">
                                <Star className="h-8 w-8 mx-auto stroke-1" />
                                <p className="text-sm">Your watchlist is empty.</p>
                                <p className="text-xs">Star any asset to track it here.</p>
                            </div>
                        ) : (
                            watchlist.map((asset) => (
                                <div
                                    key={asset.symbol}
                                    onClick={() => setSelectedAsset(asset)}
                                    className="p-3.5 rounded-lg border border-border-subtle bg-surface-50 hover:bg-surface-100 hover:border-border-default transition-all duration-200 cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-text-primary truncate">{asset.symbol}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-200 text-text-tertiary">
                                                {asset.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary truncate mt-0.5">{asset.name}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-3 flex-shrink-0">
                                        <div>
                                            <p className="text-sm font-bold text-positive-500 flex items-center justify-end">
                                                +{asset.cagr3y}%
                                            </p>
                                            <p className="text-[10px] text-text-tertiary">3Y CAGR</p>
                                        </div>
                                        <button
                                            onClick={(e) => toggleWatchlist(asset, e)}
                                            className="text-accent-400 hover:text-text-tertiary transition-colors"
                                        >
                                            <Star className="h-4 w-4 fill-accent-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </Card>

                    {/* Quick Links */}
                    <Card padding="md" className="bg-gradient-to-br from-wealth-600/10 to-transparent border border-wealth-500/20 relative overflow-hidden group">
                        <div className="relative z-10 space-y-2">
                            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-wealth-400" />
                                Monte Carlo SIP Simulator
                            </h4>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Run compound variance simulations for any stock or mutual fund to forecast long-term SIP growth paths.
                            </p>
                            <Link href="/dashboard/wealth-projection" className="inline-flex items-center text-xs font-semibold text-wealth-400 group-hover:text-wealth-300 transition-colors mt-1">
                                Launch Simulator
                                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Trending Assets (Col-span 2) */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-wealth-400" />
                            Trending Asset Intelligence
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                            <Zap className="h-3 w-3 mr-1 text-wealth-400" />
                            Live AI Data
                        </Badge>
                    </div>

                    {/* Loading Skeletons */}
                    {featuredLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="card-surface p-5 animate-pulse space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-16 bg-surface-200 rounded" />
                                        <div className="h-4 w-24 bg-surface-200 rounded" />
                                    </div>
                                    <div className="h-4 w-3/4 bg-surface-200 rounded" />
                                    <div className="h-3 w-1/2 bg-surface-200 rounded" />
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle">
                                        <div className="h-8 bg-surface-200 rounded" />
                                        <div className="h-8 bg-surface-200 rounded" />
                                        <div className="h-8 bg-surface-200 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {featuredError && !featuredLoading && (
                        <Card padding="lg" className="text-center space-y-3">
                            <AlertCircle className="h-10 w-10 mx-auto text-negative-400" />
                            <p className="text-sm text-text-secondary">{featuredError}</p>
                            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </Card>
                    )}

                    {/* Loaded Assets Grid */}
                    {!featuredLoading && !featuredError && featuredAssets.length > 0 && (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            {featuredAssets.map((asset) => {
                                const isStarred = isInWatchlist(asset.symbol);
                                return (
                                    <motion.div
                                        key={asset.symbol}
                                        variants={staggerItem}
                                        onClick={() => handleFeaturedAssetClick(asset)}
                                        className="group card-surface p-5 hover:border-wealth-500/30 transition-all duration-300 cursor-pointer relative"
                                    >
                                        {/* Star Button */}
                                        <button
                                            onClick={(e) => toggleWatchlist(asset, e)}
                                            className="absolute top-4 right-4 text-text-tertiary hover:text-accent-400 transition-colors p-1"
                                        >
                                            <Star className={`h-4.5 w-4.5 ${isStarred ? "fill-accent-400 text-accent-400" : ""}`} />
                                        </button>

                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge
                                                variant={
                                                    asset.type === "Stock"
                                                        ? "default"
                                                        : asset.type === "Mutual Fund"
                                                          ? "positive"
                                                          : "warning"
                                                }
                                                className="text-[10px] font-bold"
                                            >
                                                {asset.type}
                                            </Badge>
                                            <span className="text-[11px] text-text-tertiary truncate">{asset.sector}</span>
                                        </div>

                                        <h4 className="text-sm font-bold text-text-primary group-hover:text-wealth-400 transition-colors truncate pr-6">
                                            {asset.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-text-tertiary font-mono">{asset.symbol}</span>
                                            {asset.highlight && (
                                                <span className="text-[9px] text-wealth-400 bg-wealth-500/10 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                                                    {asset.highlight}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-subtle">
                                            <div>
                                                <p className="text-[10px] text-text-tertiary uppercase">3Y CAGR</p>
                                                <p className="text-sm font-extrabold text-positive-500 mt-0.5">
                                                    +{asset.cagr3y}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary uppercase">Volatility</p>
                                                <p className="text-xs font-bold text-text-primary mt-1">
                                                    {asset.volatility}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary uppercase">Drawdown</p>
                                                <p className="text-sm font-bold text-negative-400 mt-0.5 flex items-center">
                                                    <TrendingDown className="h-3 w-3 mr-0.5" />
                                                    {asset.drawdown}%
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Loading Overlay ───────────────────────────────────────────── */}
            <AnimatePresence>
                {detailsLoading && !selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-surface-0/60 backdrop-blur-md z-50 flex items-center justify-center"
                    >
                        <div className="text-center space-y-4">
                            <Loader2 className="h-10 w-10 text-wealth-400 animate-spin mx-auto" />
                            <p className="text-sm text-text-secondary">Fetching real-time asset intelligence...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Asset Detail Modal ────────────────────────────────────────── */}
            <AnimatePresence>
                {selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedAsset(null)}
                        className="fixed inset-0 bg-surface-0/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-strong rounded-2xl border border-border-subtle max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Badge
                                            variant={
                                                selectedAsset.type === "Stock"
                                                    ? "default"
                                                    : selectedAsset.type === "Mutual Fund"
                                                      ? "positive"
                                                      : "warning"
                                            }
                                        >
                                            {selectedAsset.type}
                                        </Badge>
                                        <span className="text-xs text-text-tertiary font-mono">{selectedAsset.symbol}</span>
                                        {selectedAsset.cappedType && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-200 text-text-tertiary">{selectedAsset.cappedType}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary leading-tight">
                                        {selectedAsset.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-1">{selectedAsset.sector}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedAsset(null)}
                                    className="text-text-tertiary hover:text-text-primary text-2xl font-light p-1"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Performance Matrix */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-surface-50 border border-border-subtle">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">3Y CAGR</p>
                                    <p className="text-lg font-extrabold text-positive-500 flex items-center gap-0.5">
                                        <Percent className="h-4 w-4" />
                                        {selectedAsset.cagr3y}
                                    </p>
                                </div>
                                {selectedAsset.cagr1y !== undefined && (
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-text-tertiary uppercase font-medium">1Y Return</p>
                                        <p className={`text-base font-bold ${selectedAsset.cagr1y >= 0 ? 'text-positive-500' : 'text-negative-400'}`}>
                                            {selectedAsset.cagr1y >= 0 ? '+' : ''}{selectedAsset.cagr1y}%
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Volatility</p>
                                    <p className="text-base font-bold text-text-primary mt-0.5">
                                        {selectedAsset.volatility}
                                    </p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Max Drawdown</p>
                                    <p className="text-lg font-bold text-negative-400 mt-0.5 flex items-center gap-0.5">
                                        <Shield className="h-4 w-4 text-negative-500" />
                                        {selectedAsset.drawdown}%
                                    </p>
                                </div>
                            </div>

                            {/* Real Fundamentals (Groww data) */}
                            {(selectedAsset.peRatio || selectedAsset.marketCap || selectedAsset.roe) && (
                                <div className="p-4 rounded-xl bg-surface-50 border border-border-subtle">
                                    <p className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider mb-3 flex items-center gap-1.5">
                                        <BarChart3 className="h-3.5 w-3.5 text-wealth-400" />
                                        Live Market Fundamentals
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {selectedAsset.marketCap && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">Market Cap</p>
                                                <p className="text-xs font-bold text-text-primary">{selectedAsset.marketCap}</p>
                                            </div>
                                        )}
                                        {selectedAsset.peRatio && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">P/E Ratio</p>
                                                <p className="text-xs font-bold text-text-primary">{selectedAsset.peRatio}</p>
                                            </div>
                                        )}
                                        {selectedAsset.roe && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">ROE</p>
                                                <p className="text-xs font-bold text-text-primary">{selectedAsset.roe}%</p>
                                            </div>
                                        )}
                                        {selectedAsset.debtToEquity !== undefined && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">Debt/Equity</p>
                                                <p className="text-xs font-bold text-text-primary">{selectedAsset.debtToEquity}</p>
                                            </div>
                                        )}
                                        {selectedAsset.dividendYield !== undefined && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">Dividend Yield</p>
                                                <p className="text-xs font-bold text-text-primary">{selectedAsset.dividendYield}%</p>
                                            </div>
                                        )}
                                        {selectedAsset.eps && (
                                            <div>
                                                <p className="text-[9px] text-text-tertiary">EPS (TTM)</p>
                                                <p className="text-xs font-bold text-text-primary">₹{selectedAsset.eps}</p>
                                            </div>
                                        )}
                                        {selectedAsset.yearHigh && selectedAsset.yearLow && (
                                            <div className="col-span-2">
                                                <p className="text-[9px] text-text-tertiary">52-Week Range</p>
                                                <p className="text-xs font-bold text-text-primary">
                                                    ₹{selectedAsset.yearLow.toLocaleString("en-IN")} — ₹{selectedAsset.yearHigh.toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* AI Summary */}
                            {selectedAsset.aiSummary && (
                                <div className="p-4 rounded-xl bg-wealth-600/5 border border-wealth-500/15">
                                    <p className="text-[10px] uppercase font-bold text-wealth-400 tracking-wider mb-2 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI Teller Analysis
                                    </p>
                                    <p className="text-xs text-text-secondary leading-relaxed">{selectedAsset.aiSummary}</p>

                                    {/* Strengths & Risks */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        {selectedAsset.strengths && selectedAsset.strengths.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-positive-500 mb-1">✅ Strengths</p>
                                                <ul className="space-y-1">
                                                    {selectedAsset.strengths.map((s, i) => (
                                                        <li key={i} className="text-[11px] text-text-secondary">• {s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedAsset.risks && selectedAsset.risks.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-negative-400 mb-1">⚠️ Risks</p>
                                                <ul className="space-y-1">
                                                    {selectedAsset.risks.map((r, i) => (
                                                        <li key={i} className="text-[11px] text-text-secondary">• {r}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recommendation */}
                                    {selectedAsset.recommendation && (
                                        <div className="mt-3 pt-3 border-t border-wealth-500/10">
                                            <p className="text-[10px] font-bold text-wealth-400 mb-1">💡 Recommendation</p>
                                            <p className="text-[11px] text-text-secondary leading-relaxed">{selectedAsset.recommendation}</p>
                                        </div>
                                    )}

                                    {/* Assessment badges */}
                                    <div className="flex gap-2 mt-3">
                                        {selectedAsset.fairValueAssessment && (
                                            <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-surface-100 text-text-secondary border border-border-subtle">
                                                {selectedAsset.fairValueAssessment}
                                            </span>
                                        )}
                                        {selectedAsset.sipSuitability && (
                                            <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-wealth-500/10 text-wealth-400 border border-wealth-500/20">
                                                SIP: {selectedAsset.sipSuitability}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => {
                                        const asset = selectedAsset;
                                        setSelectedAsset(null);
                                        handleAssetAsk(asset.name);
                                    }}
                                    className="flex-1 group"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Deep AI Analysis Chat
                                </Button>
                                <Button
                                    onClick={() => {
                                        const asset = selectedAsset;
                                        setSelectedAsset(null);
                                        handleAssetCompare(asset);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Compare SIP Performance
                                </Button>
                                <Button
                                    onClick={() => {
                                        const asset = selectedAsset;
                                        setSelectedAsset(null);
                                        handleSimulateMonteCarlo(asset);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <LineChart className="h-4 w-4 mr-2" />
                                    Monte Carlo Simulation
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
