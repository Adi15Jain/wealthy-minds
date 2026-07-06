"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    PageHeader,
    WidgetGrid,
    Card,
    CardHeader,
    CardTitle,
    AnimatedNumber,
    Button,
    EmptyState,
    Skeleton,
    SkeletonCard,
    SkeletonChart,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import {
    Wallet,
    Home,
    Landmark,
    Coins,
    Globe,
    PiggyBank,
    Sparkles,
    AlertCircle,
    ArrowRight,
    PieChart as PieChartIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// ── API types ────────────────────────────────────────────────
interface AssetAllocationSlice {
    assetClass: string;
    value: number;
    percentage: number;
}

interface PortfolioData {
    portfolios: { id: string; name: string }[];
    summary: {
        totalValue: number;
        totalInvested: number;
        totalReturns: number;
        returnPercentage: number;
        holdingsCount: number;
        assetAllocation: AssetAllocationSlice[];
    };
}

interface ApiEnvelope<T> {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
}

async function fetchPortfolio(): Promise<PortfolioData> {
    const res = await fetch("/api/portfolio");
    const json = (await res
        .json()
        .catch(() => null)) as ApiEnvelope<PortfolioData> | null;
    if (!res.ok || !json?.success || json.data === undefined) {
        throw new Error(
            json?.error?.message ?? `Request failed (${res.status})`,
        );
    }
    return json.data;
}

// ── Asset-class presentation (validated palette) ─────────────
interface AssetClassMeta {
    label: string;
    color: string;
    icon: LucideIcon;
    iconClass: string;
}

const ASSET_CLASS_META: Record<string, AssetClassMeta> = {
    equity: {
        label: "Equity",
        color: "#3B82F6",
        icon: Wallet,
        iconClass: "text-wealth-400",
    },
    debt: {
        label: "Debt",
        color: "#059669",
        icon: Landmark,
        iconClass: "text-positive-500",
    },
    gold: {
        label: "Gold",
        color: "#D97706",
        icon: Coins,
        iconClass: "text-caution-500",
    },
    real_estate: {
        label: "Real Estate",
        color: "#8B5CF6",
        icon: Home,
        iconClass: "text-accent-500",
    },
    cash: {
        label: "Cash",
        color: "#0891B2",
        icon: PiggyBank,
        iconClass: "text-text-secondary",
    },
    international: {
        label: "International",
        color: "#EC4899",
        icon: Globe,
        iconClass: "text-wealth-400",
    },
    alternative: {
        label: "Alternative",
        color: "#EA580C",
        icon: Sparkles,
        iconClass: "text-accent-400",
    },
};

const TOOLTIP_STYLE = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
} as const;

export default function NetWorthPage() {
    const portfolioQuery = useQuery({
        queryKey: ["portfolio"],
        queryFn: fetchPortfolio,
    });

    const summary = portfolioQuery.data?.summary;

    const categories = useMemo(
        () =>
            (summary?.assetAllocation ?? [])
                .filter((slice) => slice.value > 0)
                .sort((a, b) => b.value - a.value)
                .map((slice) => {
                    const key = slice.assetClass.toLowerCase();
                    const meta = ASSET_CLASS_META[key];
                    return {
                        key,
                        label: meta?.label ?? slice.assetClass,
                        color: meta?.color ?? "#94A3B8",
                        icon: meta?.icon ?? Wallet,
                        iconClass: meta?.iconClass ?? "text-text-secondary",
                        value: slice.value,
                        percentage: slice.percentage,
                    };
                }),
        [summary],
    );

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Net Worth"
                description="A holistic view of your total financial standing — assets minus liabilities."
            />

            {portfolioQuery.isPending ? (
                <div className="space-y-6">
                    <Card padding="lg">
                        <Skeleton className="h-3 w-28 mb-3" />
                        <Skeleton className="h-10 w-56 mb-3" />
                        <Skeleton className="h-4 w-40" />
                    </Card>
                    <WidgetGrid columns={3}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </WidgetGrid>
                    <SkeletonChart />
                </div>
            ) : portfolioQuery.isError ? (
                <Card padding="lg">
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                        <AlertCircle className="h-8 w-8 text-negative-500" />
                        <p className="text-sm font-semibold text-text-primary">
                            Couldn&apos;t load your net worth
                        </p>
                        <p className="text-xs text-text-secondary max-w-sm">
                            {portfolioQuery.error.message}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => portfolioQuery.refetch()}
                        >
                            Retry
                        </Button>
                    </div>
                </Card>
            ) : summary && summary.holdingsCount === 0 ? (
                <Card padding="lg">
                    <EmptyState
                        icon={<Wallet className="h-10 w-10" />}
                        title="Nothing to total up yet"
                        description="Your net worth is computed from the holdings in your portfolio. Add your investments to see the full picture."
                        action={
                            <Link href="/dashboard/portfolio">
                                <Button>
                                    Go to Portfolio
                                    <ArrowRight className="h-4 w-4 ml-1.5" />
                                </Button>
                            </Link>
                        }
                    />
                </Card>
            ) : summary ? (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Headline */}
                    <motion.div variants={staggerItem}>
                        <Card padding="lg" className="border-gradient">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                                <div>
                                    <p className="metric-label mb-2">
                                        Total Net Worth
                                    </p>
                                    <p className="text-4xl font-bold tracking-tight gradient-text">
                                        <AnimatedNumber
                                            value={summary.totalValue}
                                            format={(v) =>
                                                formatCurrency(v, {
                                                    decimals: 0,
                                                })
                                            }
                                        />
                                    </p>
                                    <p
                                        className={cn(
                                            "text-sm mt-2",
                                            summary.totalReturns >= 0
                                                ? "text-positive-500"
                                                : "text-negative-500",
                                        )}
                                    >
                                        {formatCurrency(summary.totalReturns, {
                                            decimals: 0,
                                        })}{" "}
                                        (
                                        {formatPercentage(
                                            summary.returnPercentage,
                                        )}
                                        ) overall returns
                                    </p>
                                </div>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="metric-label mb-1">
                                            Invested
                                        </p>
                                        <p className="text-lg font-bold text-text-primary tabular-nums">
                                            <AnimatedNumber
                                                value={summary.totalInvested}
                                                format={(v) =>
                                                    formatCurrency(v, {
                                                        decimals: 0,
                                                    })
                                                }
                                            />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="metric-label mb-1">
                                            Returns
                                        </p>
                                        <p
                                            className={cn(
                                                "text-lg font-bold tabular-nums",
                                                summary.totalReturns >= 0
                                                    ? "text-positive-500"
                                                    : "text-negative-500",
                                            )}
                                        >
                                            <AnimatedNumber
                                                value={summary.totalReturns}
                                                format={(v) =>
                                                    formatCurrency(v, {
                                                        decimals: 0,
                                                    })
                                                }
                                            />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Asset-class categories */}
                    <WidgetGrid columns={3}>
                        {categories.map((cat) => (
                            <motion.div key={cat.key} variants={staggerItem}>
                                <Card padding="md" animate>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-lg bg-surface-200 flex items-center justify-center">
                                            <cat.icon
                                                className={cn(
                                                    "h-5 w-5",
                                                    cat.iconClass,
                                                )}
                                            />
                                        </div>
                                        <CardTitle>{cat.label}</CardTitle>
                                    </div>
                                    <p className="text-xl font-bold text-text-primary tabular-nums">
                                        <AnimatedNumber
                                            value={cat.value}
                                            format={(v) =>
                                                formatCurrency(v, {
                                                    decimals: 0,
                                                })
                                            }
                                        />
                                    </p>
                                    <p className="text-xs text-text-tertiary mt-1 tabular-nums">
                                        {cat.percentage.toFixed(1)}% of net
                                        worth
                                    </p>
                                    <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden mt-3">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                backgroundColor: cat.color,
                                            }}
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${cat.percentage}%`,
                                            }}
                                            transition={{
                                                duration: 0.8,
                                                delay: 0.2,
                                            }}
                                        />
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </WidgetGrid>

                    {/* Composition chart */}
                    <motion.div variants={staggerItem}>
                        <Card padding="md">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4 text-text-tertiary" />
                                    <CardTitle>Composition</CardTitle>
                                </div>
                            </CardHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="h-64">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={categories}
                                                dataKey="value"
                                                nameKey="label"
                                                innerRadius="62%"
                                                outerRadius="88%"
                                                paddingAngle={2}
                                                strokeWidth={0}
                                            >
                                                {categories.map((cat) => (
                                                    <Cell
                                                        key={cat.key}
                                                        fill={cat.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(
                                                    value:
                                                        | number
                                                        | string
                                                        | readonly (
                                                              | number
                                                              | string
                                                          )[]
                                                        | undefined,
                                                ) =>
                                                    formatCurrency(
                                                        Number(value),
                                                        { decimals: 0 },
                                                    )
                                                }
                                                contentStyle={TOOLTIP_STYLE}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2.5">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.key}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            cat.color,
                                                    }}
                                                />
                                                <span className="text-sm text-text-secondary truncate">
                                                    {cat.label}
                                                </span>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className="text-sm font-medium text-text-primary tabular-nums">
                                                    {formatCurrency(cat.value, {
                                                        decimals: 0,
                                                    })}
                                                </span>
                                                <span className="text-xs text-text-tertiary tabular-nums ml-2">
                                                    {cat.percentage.toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </motion.div>
            ) : null}
        </motion.div>
    );
}
