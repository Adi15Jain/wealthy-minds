"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    EmptyState,
    InsightCard,
    SkeletonChart,
    SkeletonLines,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import {
    PieChart as PieChartIcon,
    Sparkles,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Scale,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// ── API types ────────────────────────────────────────────────
interface ApiHolding {
    id: string;
    assetClass: string;
    currentValue: number;
}

interface PortfolioData {
    portfolios: { id: string; holdings: ApiHolding[] }[];
    summary: { totalValue: number; holdingsCount: number };
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

type RiskProfileEnum =
    | "CONSERVATIVE"
    | "MODERATE"
    | "BALANCED"
    | "GROWTH"
    | "AGGRESSIVE";

async function fetchRiskProfile(): Promise<RiskProfileEnum | null> {
    const res = await fetch("/api/user/risk-profile");
    const json = (await res.json().catch(() => null)) as ApiEnvelope<{
        riskProfile: RiskProfileEnum | null;
    }> | null;
    if (!res.ok || !json?.success || json.data === undefined) {
        throw new Error(
            json?.error?.message ?? `Request failed (${res.status})`,
        );
    }
    return json.data.riskProfile;
}

interface AllocationAction {
    action: "reduce" | "increase" | "add";
    asset: string;
    from_pct: number;
    to_pct: number;
    drift_pct: number;
}

interface AllocationResult {
    current: Record<string, number>;
    suggested: Record<string, number>;
    risk_profile: string;
    reasoning: string;
    actions: AllocationAction[];
    rebalance_needed: boolean;
}

async function computeAllocation(body: {
    current: Record<string, number>;
    risk_profile: string;
}): Promise<AllocationResult> {
    const res = await fetch("/api/analytics/allocation/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const json: unknown = await res.json().catch(() => null);
    const record =
        json !== null && typeof json === "object"
            ? (json as Record<string, unknown>)
            : null;
    if (
        !res.ok ||
        record === null ||
        record.success === false ||
        !("suggested" in record)
    ) {
        const message =
            record && typeof record.detail === "string"
                ? record.detail
                : (
                        record?.error as
                            | { message?: string }
                            | undefined
                  )?.message;
        throw new Error(message ?? "Allocation analysis is unavailable.");
    }
    return record as unknown as AllocationResult;
}

// ── Asset presentation (validated palette) ───────────────────
const ASSET_COLORS: Record<string, string> = {
    equity: "#3B82F6",
    debt: "#059669",
    gold: "#D97706",
    real_estate: "#8B5CF6",
    cash: "#0891B2",
    international: "#EC4899",
    alternative: "#EA580C",
};

const ASSET_LABELS: Record<string, string> = {
    equity: "Equity",
    debt: "Debt",
    gold: "Gold",
    real_estate: "Real Estate",
    cash: "Cash",
    international: "International",
    alternative: "Alternative",
};

const ASSET_ORDER = [
    "equity",
    "debt",
    "gold",
    "real_estate",
    "cash",
    "international",
    "alternative",
];

const TOOLTIP_STYLE = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
} as const;

const percentFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
) => `${Number(value).toFixed(1)}%`;

function assetRank(key: string): number {
    const index = ASSET_ORDER.indexOf(key);
    return index === -1 ? ASSET_ORDER.length : index;
}

function toSlices(map: Record<string, number>) {
    return Object.entries(map)
        .filter(([, pct]) => pct > 0)
        .sort(([a], [b]) => assetRank(a) - assetRank(b))
        .map(([asset, pct]) => ({
            key: asset,
            name: ASSET_LABELS[asset] ?? asset,
            value: pct,
            color: ASSET_COLORS[asset] ?? "#94A3B8",
        }));
}

function AllocationDonut({
    title,
    slices,
    icon,
}: {
    title: string;
    slices: ReturnType<typeof toSlices>;
    icon: React.ReactNode;
}) {
    return (
        <Card padding="md">
            <CardHeader>
                <div className="flex items-center gap-2">
                    {icon}
                    <CardTitle>{title}</CardTitle>
                </div>
            </CardHeader>
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="88%"
                            paddingAngle={2}
                            strokeWidth={0}
                        >
                            {slices.map((slice) => (
                                <Cell key={slice.key} fill={slice.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={percentFormatter}
                            contentStyle={TOOLTIP_STYLE}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
                {slices.map((slice) => (
                    <div
                        key={slice.key}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span className="text-sm text-text-secondary">
                                {slice.name}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-text-primary tabular-nums">
                            {slice.value.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ── Page ─────────────────────────────────────────────────────
export default function AllocationPage() {
    const portfolioQuery = useQuery({
        queryKey: ["portfolio"],
        queryFn: fetchPortfolio,
    });

    const riskProfileQuery = useQuery({
        queryKey: ["risk-profile"],
        queryFn: fetchRiskProfile,
    });

    const currentAllocation = useMemo(() => {
        const holdings =
            portfolioQuery.data?.portfolios.flatMap((p) => p.holdings) ?? [];
        const byClass: Record<string, number> = {};
        for (const holding of holdings) {
            if (holding.currentValue <= 0) continue;
            const key = holding.assetClass.toLowerCase();
            byClass[key] = (byClass[key] ?? 0) + holding.currentValue;
        }
        return byClass;
    }, [portfolioQuery.data]);

    const hasAllocatableValue = Object.keys(currentAllocation).length > 0;
    const riskProfileValue = riskProfileQuery.data ?? null;
    const effectiveProfile = riskProfileValue
        ? riskProfileValue.toLowerCase()
        : "balanced";

    const allocationQuery = useQuery({
        queryKey: ["allocation-compute", currentAllocation, effectiveProfile],
        queryFn: () =>
            computeAllocation({
                current: currentAllocation,
                risk_profile: effectiveProfile,
            }),
        enabled:
            portfolioQuery.isSuccess &&
            !riskProfileQuery.isPending &&
            hasAllocatableValue,
    });

    const result = allocationQuery.data;
    const currentSlices = useMemo(
        () => (result ? toSlices(result.current) : []),
        [result],
    );
    const suggestedSlices = useMemo(
        () => (result ? toSlices(result.suggested) : []),
        [result],
    );

    const isLoading =
        portfolioQuery.isPending ||
        (portfolioQuery.isSuccess &&
            hasAllocatableValue &&
            (riskProfileQuery.isPending || allocationQuery.isPending));

    const error = portfolioQuery.isError
        ? portfolioQuery.error
        : allocationQuery.isError
          ? allocationQuery.error
          : null;

    const retry = () => {
        if (portfolioQuery.isError) void portfolioQuery.refetch();
        if (riskProfileQuery.isError) void riskProfileQuery.refetch();
        if (allocationQuery.isError) void allocationQuery.refetch();
    };

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Allocation Intelligence"
                description="AI-optimized asset allocation analysis with rebalancing recommendations."
            />

            {/* Risk-profile hint */}
            {riskProfileQuery.isSuccess && riskProfileValue === null && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-wealth-500/10 border border-wealth-500/20">
                    <AlertCircle className="h-4 w-4 text-wealth-400 flex-shrink-0" />
                    <p className="text-xs text-text-secondary">
                        You haven&apos;t set a risk profile yet, so
                        recommendations use the{" "}
                        <span className="font-semibold text-wealth-400">
                            balanced
                        </span>{" "}
                        model portfolio.{" "}
                        <Link
                            href="/dashboard/risk-profile"
                            className="font-semibold text-wealth-400 underline underline-offset-2 hover:text-wealth-500 transition-colors"
                        >
                            Take the risk assessment
                        </Link>{" "}
                        for personalized targets.
                    </p>
                </div>
            )}

            {error ? (
                <Card padding="lg">
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                        <AlertCircle className="h-8 w-8 text-negative-500" />
                        <p className="text-sm font-semibold text-text-primary">
                            Couldn&apos;t analyze your allocation
                        </p>
                        <p className="text-xs text-text-secondary max-w-sm">
                            {error.message}
                        </p>
                        <Button variant="outline" size="sm" onClick={retry}>
                            Retry
                        </Button>
                    </div>
                </Card>
            ) : isLoading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <SkeletonChart />
                        <SkeletonChart />
                    </div>
                    <Card padding="md">
                        <SkeletonLines lines={4} />
                    </Card>
                </div>
            ) : portfolioQuery.isSuccess && !hasAllocatableValue ? (
                <Card padding="lg">
                    <EmptyState
                        icon={<PieChartIcon className="h-10 w-10" />}
                        title="No allocation to analyze"
                        description="Allocation intelligence needs holdings with a current value. Add your investments to compare against your risk-profile model portfolio."
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
            ) : result ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <AllocationDonut
                            title="Current Allocation"
                            slices={currentSlices}
                            icon={
                                <PieChartIcon className="h-4 w-4 text-text-tertiary" />
                            }
                        />
                        <AllocationDonut
                            title={`Recommended (${
                                result.risk_profile.charAt(0).toUpperCase() +
                                result.risk_profile.slice(1)
                            } profile)`}
                            slices={suggestedSlices}
                            icon={
                                <Sparkles className="h-4 w-4 text-wealth-400" />
                            }
                        />
                    </div>

                    <InsightCard
                        title="Why this recommendation"
                        summary={result.reasoning}
                        severity={result.rebalance_needed ? "info" : "positive"}
                        icon={Scale}
                        className="[&_p]:line-clamp-none"
                    />

                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Rebalancing Actions</CardTitle>
                        </CardHeader>
                        {result.rebalance_needed ? (
                            <div className="space-y-3 mt-4">
                                {result.actions.map((item) => (
                                    <div
                                        key={`${item.action}-${item.asset}`}
                                        className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-100"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Badge
                                                variant={
                                                    item.action === "reduce"
                                                        ? "warning"
                                                        : "positive"
                                                }
                                                className="capitalize flex-shrink-0"
                                            >
                                                {item.action}
                                            </Badge>
                                            <p className="text-sm font-medium text-text-primary truncate">
                                                {item.asset}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm text-text-secondary tabular-nums">
                                                {item.from_pct.toFixed(1)}%{" "}
                                                →{" "}
                                                <span className="font-semibold text-wealth-400">
                                                    {item.to_pct.toFixed(1)}%
                                                </span>
                                            </p>
                                            <p className="text-[11px] text-text-tertiary tabular-nums">
                                                drift{" "}
                                                {item.drift_pct > 0 ? "+" : ""}
                                                {item.drift_pct.toFixed(1)} pp
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mt-4 p-4 rounded-lg bg-positive-500/10 border border-positive-500/20">
                                <CheckCircle2 className="h-5 w-5 text-positive-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-positive-500">
                                        You&apos;re in balance
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        Every asset class is within 3% of the{" "}
                                        {result.risk_profile} model portfolio.
                                        No action needed right now.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Portfolio value context */}
                    {portfolioQuery.data && (
                        <p className="text-xs text-text-tertiary">
                            Analysis based on{" "}
                            {formatCurrency(
                                portfolioQuery.data.summary.totalValue,
                                { decimals: 0 },
                            )}{" "}
                            across {portfolioQuery.data.summary.holdingsCount}{" "}
                            holdings.
                        </p>
                    )}
                </div>
            ) : null}
        </motion.div>
    );
}
