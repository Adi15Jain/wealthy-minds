"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    Badge,
    EmptyState,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import {
    Grid3X3,
    AlertCircle,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
    { label: "Large Cap", color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Mid Cap", color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Small Cap", color: "text-pink-400", bg: "bg-pink-500/10" },
    { label: "Flexi Cap", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "ELSS (Tax Saving)", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Index Fund", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Debt / Bond", color: "text-slate-400", bg: "bg-slate-500/10" },
    { label: "International", color: "text-rose-400", bg: "bg-rose-500/10" },
];

interface Fund {
    name: string;
    symbol: string;
    amc: string;
    cagr1y: number;
    cagr3y: number;
    cagr5y: number;
    expenseRatio: number;
    aum: string;
    riskLabel: string;
    rating: number;
    minSIP: number;
}

export default function FundExplorerPage() {
    const [selectedCategory, setSelectedCategory] = useState("Large Cap");
    const [funds, setFunds] = useState<Fund[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchFunds = async () => {
            setLoading(true);
            setError("");
            setFunds([]);
            try {
                const res = await fetch(`/api/market/funds-by-category?category=${encodeURIComponent(selectedCategory)}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setFunds(data.data);
                } else {
                    setError("Failed to load funds for this category.");
                }
            } catch {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchFunds();
    }, [selectedCategory]);

    const selectedCat = CATEGORIES.find(c => c.label === selectedCategory);

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" className="space-y-8">
            <PageHeader
                title="Mutual Fund Explorer"
                description="Browse top-performing mutual funds by category. All data is fetched live — rankings reflect current market performance."
            />

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.label}
                        onClick={() => setSelectedCategory(cat.label)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                            selectedCategory === cat.label
                                ? `${cat.bg} ${cat.color} border border-current/20 shadow-sm`
                                : "bg-surface-50 text-text-secondary border border-border-subtle hover:bg-surface-100"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card-surface p-5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 bg-surface-200 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-surface-200 rounded" />
                                    <div className="h-3 w-1/3 bg-surface-200 rounded" />
                                </div>
                                <div className="h-6 w-20 bg-surface-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <Card padding="lg" className="text-center space-y-3">
                    <AlertCircle className="h-10 w-10 mx-auto text-negative-400" />
                    <p className="text-sm text-text-secondary">{error}</p>
                </Card>
            )}

            {/* Fund Cards */}
            {!loading && !error && funds.length > 0 && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                    {funds.map((fund, idx) => (
                        <motion.div key={fund.symbol || idx} variants={staggerItem}>
                            <Card padding="md" className="hover:border-wealth-500/20 transition-all duration-200 group">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Rank */}
                                    <div className={`h-10 w-10 rounded-xl ${selectedCat?.bg} flex items-center justify-center flex-shrink-0`}>
                                        <span className={`text-lg font-extrabold ${selectedCat?.color}`}>#{idx + 1}</span>
                                    </div>

                                    {/* Fund Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-wealth-400 transition-colors">
                                            {fund.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-text-tertiary">{fund.amc}</span>
                                            <span className="text-[10px] text-text-tertiary">•</span>
                                            <span className="text-[10px] text-text-tertiary">AUM: {fund.aum}</span>
                                            {fund.rating && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                                                    {"★".repeat(Math.min(5, fund.rating))}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Returns */}
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="text-center">
                                            <p className="text-[9px] uppercase text-text-tertiary">1Y</p>
                                            <p className={`text-sm font-bold ${fund.cagr1y >= 0 ? "text-positive-500" : "text-negative-400"}`}>
                                                {fund.cagr1y >= 0 ? "+" : ""}{fund.cagr1y}%
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] uppercase text-text-tertiary">3Y</p>
                                            <p className="text-sm font-extrabold text-positive-500">+{fund.cagr3y}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] uppercase text-text-tertiary">5Y</p>
                                            <p className={`text-sm font-bold ${fund.cagr5y >= 0 ? "text-positive-500" : "text-text-secondary"}`}>
                                                {fund.cagr5y ? `+${fund.cagr5y}%` : "N/A"}
                                            </p>
                                        </div>
                                        <div className="text-center hidden sm:block">
                                            <p className="text-[9px] uppercase text-text-tertiary">Expense</p>
                                            <p className="text-xs font-bold text-text-primary">{fund.expenseRatio}%</p>
                                        </div>
                                        <div className="text-center hidden sm:block">
                                            <p className="text-[9px] uppercase text-text-tertiary">Min SIP</p>
                                            <p className="text-xs font-bold text-text-primary">
                                                {fund.minSIP ? formatCurrency(fund.minSIP, { decimals: 0 }) : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant={fund.riskLabel === "Conservative" ? "positive" : fund.riskLabel === "Moderate" ? "warning" : "default"} className="text-[9px]">
                                            {fund.riskLabel}
                                        </Badge>
                                        <Link
                                            href={`/dashboard/sip-tracking?compare=${encodeURIComponent(fund.symbol)}&name=${encodeURIComponent(fund.name)}&type=Mutual%20Fund`}
                                            className="p-2 rounded-lg bg-wealth-600/10 text-wealth-400 hover:bg-wealth-600/20 transition-colors"
                                            title="Compare in SIP Analyzer"
                                        >
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Empty state — API succeeded but returned no funds */}
            {!loading && !error && funds.length === 0 && (
                <Card padding="lg">
                    <EmptyState
                        icon={<Grid3X3 className="h-10 w-10" />}
                        title="No funds found"
                        description={`No ${selectedCategory} funds are available right now. Try a different category or check back later.`}
                    />
                </Card>
            )}

            {/* Min SIP Info */}
            {!loading && funds.length > 0 && (
                <Card padding="sm" className="bg-wealth-600/5 border-wealth-500/10">
                    <p className="text-[11px] text-text-secondary text-center">
                        <span className="font-bold text-wealth-400">💡</span> Click the arrow on any fund to open it in the SIP Comparative Analyzer for deeper analysis.
                    </p>
                </Card>
            )}
        </motion.div>
    );
}
