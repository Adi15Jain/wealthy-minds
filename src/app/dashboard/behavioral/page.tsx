"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    PageHeader,
    Card,
    CardTitle,
    WidgetGrid,
    Badge,
    Button,
    EmptyState,
    AnimatedNumber,
    Skeleton,
    SkeletonCard,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import {
    Brain,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertCircle,
    ArrowRight,
} from "lucide-react";

// ── API types ────────────────────────────────────────────────
interface ApiHolding {
    id: string;
    assetClass: string;
    currentValue: number;
}

interface PortfolioData {
    portfolios: { id: string; holdings: ApiHolding[] }[];
    summary: { holdingsCount: number };
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

interface BehavioralMetricResult {
    id: string;
    metric: string;
    score: number;
    trend: "improving" | "stable" | "declining";
    observations: string[];
    period: string;
}

async function computeBehavioral(
    holdings: { value: number; asset_class: string }[],
): Promise<BehavioralMetricResult[]> {
    const res = await fetch("/api/analytics/behavioral/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: [], sips: [], holdings }),
    });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(json)) {
        const record =
            json !== null && typeof json === "object"
                ? (json as Record<string, unknown>)
                : null;
        const message =
            record && typeof record.detail === "string"
                ? record.detail
                : (record?.error as { message?: string } | undefined)?.message;
        throw new Error(message ?? "Behavioral analytics is unavailable.");
    }
    return json as BehavioralMetricResult[];
}

const trendIcons = {
    improving: { icon: TrendingUp, color: "text-positive-500" },
    declining: { icon: TrendingDown, color: "text-negative-500" },
    stable: { icon: Minus, color: "text-text-tertiary" },
} as const;

export default function BehavioralPage() {
    const portfolioQuery = useQuery({
        queryKey: ["portfolio"],
        queryFn: fetchPortfolio,
    });

    const behavioralHoldings = useMemo(
        () =>
            (portfolioQuery.data?.portfolios.flatMap((p) => p.holdings) ?? [])
                .filter((h) => h.currentValue > 0)
                .map((h) => ({
                    value: h.currentValue,
                    asset_class: h.assetClass.toLowerCase(),
                })),
        [portfolioQuery.data],
    );

    const behavioralQuery = useQuery({
        queryKey: ["behavioral-compute", behavioralHoldings],
        queryFn: () => computeBehavioral(behavioralHoldings),
        enabled:
            portfolioQuery.isSuccess && behavioralHoldings.length > 0,
    });

    const metrics = behavioralQuery.data ?? [];
    const compositeScore =
        metrics.length > 0
            ? metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
            : 0;
    const period = metrics[0]?.period;
    const hasData = behavioralHoldings.length > 0;

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Behavioral Analytics"
                description="Understand your investing psychology. Track decision patterns, emotional triggers, and discipline scores."
            />

            {portfolioQuery.isPending ||
            (hasData && behavioralQuery.isPending) ? (
                <div className="space-y-6">
                    <Card padding="lg">
                        <div className="flex items-center gap-6">
                            <Skeleton className="h-20 w-20 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-9 w-28" />
                            </div>
                        </div>
                    </Card>
                    <WidgetGrid columns={2}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </WidgetGrid>
                </div>
            ) : portfolioQuery.isError || behavioralQuery.isError ? (
                <Card padding="lg">
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                        <AlertCircle className="h-8 w-8 text-negative-500" />
                        <p className="text-sm font-semibold text-text-primary">
                            Couldn&apos;t compute behavioral analytics
                        </p>
                        <p className="text-xs text-text-secondary max-w-sm">
                            {portfolioQuery.error?.message ??
                                behavioralQuery.error?.message}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (portfolioQuery.isError) {
                                    void portfolioQuery.refetch();
                                }
                                if (behavioralQuery.isError) {
                                    void behavioralQuery.refetch();
                                }
                            }}
                        >
                            Retry
                        </Button>
                    </div>
                </Card>
            ) : !hasData ? (
                <Card padding="lg">
                    <EmptyState
                        icon={<Brain className="h-10 w-10" />}
                        title="No activity to analyze"
                        description="Behavioral scores are derived from your holdings, transactions and SIP history. Add investments to your portfolio to start tracking your investing psychology."
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
            ) : metrics.length > 0 ? (
                <>
                    {/* Composite score */}
                    <Card padding="lg" className="mb-6 border-gradient">
                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-wealth-500/20 to-wealth-700/20 flex items-center justify-center">
                                <Brain className="h-10 w-10 text-wealth-400" />
                            </div>
                            <div>
                                <p className="metric-label mb-1">
                                    Behavioral Intelligence Score
                                </p>
                                <p className="text-4xl font-bold gradient-text tabular-nums">
                                    <AnimatedNumber
                                        value={compositeScore}
                                        format={(v) => `${Math.round(v)} / 100`}
                                    />
                                </p>
                                <p className="text-sm text-text-tertiary mt-1">
                                    Composite of {metrics.length} behavioral
                                    metrics
                                    {period ? ` · ${period}` : ""}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        <WidgetGrid columns={2}>
                            {metrics.map((metric) => {
                                const { icon: TrendIcon, color } =
                                    trendIcons[metric.trend];
                                return (
                                    <motion.div
                                        key={metric.id}
                                        variants={staggerItem}
                                    >
                                        <Card padding="md" animate>
                                            <div className="flex items-start justify-between mb-4">
                                                <CardTitle>
                                                    {metric.metric}
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5">
                                                    <TrendIcon
                                                        className={`h-3.5 w-3.5 ${color}`}
                                                    />
                                                    <Badge
                                                        variant={
                                                            metric.trend ===
                                                            "improving"
                                                                ? "positive"
                                                                : metric.trend ===
                                                                    "declining"
                                                                  ? "negative"
                                                                  : "outline"
                                                        }
                                                    >
                                                        {metric.trend}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-end gap-3 mb-3">
                                                <span className="text-3xl font-bold text-text-primary tabular-nums">
                                                    <AnimatedNumber
                                                        value={metric.score}
                                                        format={(v) =>
                                                            String(
                                                                Math.round(v),
                                                            )
                                                        }
                                                    />
                                                </span>
                                                <span className="text-sm text-text-tertiary mb-1">
                                                    / 100
                                                </span>
                                            </div>

                                            <div className="h-2 rounded-full bg-surface-200 overflow-hidden mb-3">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-wealth-600 to-wealth-400"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${metric.score}%`,
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        delay: 0.3,
                                                    }}
                                                />
                                            </div>

                                            <ul className="space-y-1.5">
                                                {metric.observations.map(
                                                    (observation) => (
                                                        <li
                                                            key={observation}
                                                            className="flex items-start gap-2 text-xs text-text-secondary"
                                                        >
                                                            <span className="h-1 w-1 rounded-full bg-wealth-400 mt-1.5 flex-shrink-0" />
                                                            <span>
                                                                {observation}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </WidgetGrid>
                    </motion.div>
                </>
            ) : null}
        </motion.div>
    );
}
