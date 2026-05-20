"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Featured Real Indian Market Assets ────────────────────────
interface Asset {
    symbol: string;
    name: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    cagr3y: number;
    volatility: "Low" | "Medium" | "High";
    consistency: number; // Sharpe score out of 100
    drawdown: number; // Max drawdown %
    sector: string;
}

const FEATURED_ASSETS: Asset[] = [
    {
        symbol: "PPFAS_FLEXI",
        name: "Parag Parikh Flexi Cap Fund",
        type: "Mutual Fund",
        cagr3y: 19.4,
        volatility: "Medium",
        consistency: 88,
        drawdown: -14.2,
        sector: "Multi-Sector Equity & US Tech",
    },
    {
        symbol: "HDFC_MIDCAP",
        name: "HDFC Mid-Cap Opportunities Fund",
        type: "Mutual Fund",
        cagr3y: 24.8,
        volatility: "High",
        consistency: 91,
        drawdown: -19.5,
        sector: "Mid-Cap Equities",
    },
    {
        symbol: "NIFTY_INDEX",
        name: "UTI Nifty 50 Index Fund",
        type: "Mutual Fund",
        cagr3y: 14.1,
        volatility: "Medium",
        consistency: 82,
        drawdown: -11.8,
        sector: "Top 50 Indian Corporations",
    },
    {
        symbol: "RELIANCE",
        name: "Reliance Industries Ltd.",
        type: "Stock",
        cagr3y: 16.5,
        volatility: "Medium",
        consistency: 79,
        drawdown: -15.8,
        sector: "Energy, Retail & Digital",
    },
    {
        symbol: "TCS",
        name: "Tata Consultancy Services Ltd.",
        type: "Stock",
        cagr3y: 12.8,
        volatility: "Low",
        consistency: 84,
        drawdown: -10.2,
        sector: "Global IT Services",
    },
    {
        symbol: "GOI_BOND_715",
        name: "Govt of India 7.15% Bond",
        type: "Bond",
        cagr3y: 7.15,
        volatility: "Low",
        consistency: 98,
        drawdown: 0.0,
        sector: "Sovereign Debt",
    },
];

const SUGGESTED_ASKS = [
    "Which Mid Cap SIP is best for the next 10 years?",
    "Compare Parag Parikh Flexi Cap vs UTI Nifty 50 Index",
    "Analyze Reliance Industries share long-term risk",
    "Is HDFC Mid-Cap Opportunities too risky for a 5-year SIP?",
];

export default function DashboardPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [watchlist, setWatchlist] = useState<string[]>([]);

    // Load persistent watchlist from local storage
    useEffect(() => {
        const saved = localStorage.getItem("wealthyminds_watchlist");
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load watchlist", e);
            }
        } else {
            // Seed defaults
            const defaults = ["PPFAS_FLEXI", "NIFTY_INDEX"];
            setWatchlist(defaults);
            localStorage.setItem("wealthyminds_watchlist", JSON.stringify(defaults));
        }
    }, []);

    const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        let updated: string[];
        if (watchlist.includes(symbol)) {
            updated = watchlist.filter(s => s !== symbol);
        } else {
            updated = [...watchlist, symbol];
        }
        setWatchlist(updated);
        localStorage.setItem("wealthyminds_watchlist", JSON.stringify(updated));
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        // Pass search query directly to the AI Chat Teller page via URL params
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(searchQuery)}`);
    };

    const triggerSuggestedAsk = (ask: string) => {
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(ask)}`);
    };

    const handleAssetAsk = (assetName: string) => {
        router.push(`/dashboard/ai-insights?ask=${encodeURIComponent(`Analyze the past performance, volatility, and long-term future prospects of ${assetName}`)}`);
    };

    const handleAssetCompare = (asset: Asset) => {
        // Redirect to SIP Analyzer and pre-select this asset in comparisons
        router.push(`/dashboard/sip-tracking?compare=${asset.symbol}`);
    };

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
                        AI Wealth intelligence Operating System
                    </span>
                </motion.div>
                <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">
                    Ask WealthyMinds
                </h1>
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                    Get predictions, long-term projections, risk analysis, and comparative intelligence on shares, mutual funds, or bonds.
                </p>
            </div>

            {/* Central Search Section */}
            <Card className="border-gradient shadow-2xl relative overflow-hidden" padding="lg">
                <div className="absolute inset-0 bg-gradient-to-r from-wealth-500/5 via-transparent to-wealth-600/5 -z-10 animate-glow-pulse" />
                <div className="absolute inset-0 dot-pattern opacity-10 -z-20" />

                <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto space-y-4 py-4">
                    <h2 className="text-xl font-bold text-text-primary text-center mb-1">
                        Predict Long-Term SIP & Investment Performance
                    </h2>
                    <p className="text-xs text-text-tertiary text-center mb-6 max-w-lg mx-auto">
                        Ask natural questions like "Which SIP is better for a 15 year timeframe?" or enter a share/fund name.
                    </p>

                    <div className="relative flex items-center">
                        <Search className="absolute left-4 h-5 w-5 text-text-tertiary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search or ask anything (e.g. Parag Parikh vs UTI Index fund)..."
                            className="w-full pl-12 pr-32 py-4 rounded-xl bg-surface-50 border border-border-subtle text-text-primary placeholder:text-text-tertiary text-base focus:border-wealth-500 focus:outline-none transition-all duration-300 shadow-inner"
                        />
                        <div className="absolute right-2">
                            <Button type="submit" size="md" className="shadow-lg group">
                                Ask AI Teller
                                <ArrowRight className="h-3.5 w-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Suggested Asks List */}
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

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Watchlist & Favorites (Col-span 1) */}
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
                                <p className="text-xs">Star any featured asset below to track it.</p>
                            </div>
                        ) : (
                            FEATURED_ASSETS.filter(a => watchlist.includes(a.symbol)).map((asset) => (
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
                                            onClick={(e) => toggleWatchlist(asset.symbol, e)}
                                            className="text-accent-400 hover:text-text-tertiary transition-colors"
                                        >
                                            <Star className="h-4 w-4 fill-accent-400" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </Card>

                    {/* Quick Simulation Link */}
                    <Card padding="md" className="bg-gradient-to-br from-wealth-600/10 to-transparent border border-wealth-500/20 relative overflow-hidden group">
                        <div className="relative z-10 space-y-2">
                            <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-wealth-400" />
                                Simulate Future Projections
                            </h4>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Run compound variance algorithms and Monte Carlo models to forecast your exact long-term SIP path.
                            </p>
                            <Link href="/dashboard/wealth-projection" className="inline-flex items-center text-xs font-semibold text-wealth-400 group-hover:text-wealth-300 transition-colors mt-1">
                                Launch Monte Carlo Simulator
                                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Featured Indian Assets (Col-span 2) */}
                <div className="lg:col-span-2 space-y-5">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-wealth-400" />
                        Featured Asset Intelligence
                    </h3>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {FEATURED_ASSETS.map((asset) => {
                            const isStarred = watchlist.includes(asset.symbol);
                            return (
                                <motion.div
                                    key={asset.symbol}
                                    variants={staggerItem}
                                    onClick={() => setSelectedAsset(asset)}
                                    className="group card-surface p-5 hover:border-wealth-500/30 transition-all duration-300 cursor-pointer relative"
                                >
                                    {/* Star Button */}
                                    <button
                                        onClick={(e) => toggleWatchlist(asset.symbol, e)}
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
                                        <span className="text-[11px] text-text-tertiary">{asset.sector}</span>
                                    </div>

                                    <h4 className="text-sm font-bold text-text-primary group-hover:text-wealth-400 transition-colors truncate pr-6">
                                        {asset.name}
                                    </h4>
                                    <p className="text-[10px] text-text-tertiary font-mono mt-0.5">{asset.symbol}</p>

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
                </div>
            </div>

            {/* Asset Detail Audit Modal */}
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
                            className="glass-strong rounded-2xl border border-border-subtle max-w-xl w-full p-6 shadow-2xl space-y-6"
                        >
                            {/* Modal Header */}
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-50 border border-border-subtle">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Expected Return</p>
                                    <p className="text-lg font-extrabold text-positive-500 flex items-center gap-0.5">
                                        <Percent className="h-4 w-4" />
                                        {selectedAsset.cagr3y}
                                    </p>
                                    <p className="text-[9px] text-text-tertiary">3-Year CAGR</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Risk Volatility</p>
                                    <p className="text-base font-bold text-text-primary mt-0.5">
                                        {selectedAsset.volatility}
                                    </p>
                                    <p className="text-[9px] text-text-tertiary">Based on Std Dev</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Consistency</p>
                                    <p className="text-lg font-bold text-wealth-400 mt-0.5">
                                        {selectedAsset.consistency}/100
                                    </p>
                                    <p className="text-[9px] text-text-tertiary">Sharpe Consistency</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-text-tertiary uppercase font-medium">Max Historical Drop</p>
                                    <p className="text-lg font-bold text-negative-400 mt-0.5 flex items-center gap-0.5">
                                        <Shield className="h-4 w-4 text-negative-500" />
                                        {selectedAsset.drawdown}%
                                    </p>
                                    <p className="text-[9px] text-text-tertiary">Drawdown Peak-to-Trough</p>
                                </div>
                            </div>

                            {/* Interactive actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => {
                                        setSelectedAsset(null);
                                        handleAssetAsk(selectedAsset.name);
                                    }}
                                    className="flex-1 group"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate AI Teller Audit
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedAsset(null);
                                        handleAssetCompare(selectedAsset);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Run comparative SIP models
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
