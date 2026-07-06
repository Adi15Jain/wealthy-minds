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
    WidgetGrid,
    Badge,
    Button,
    EmptyState,
    AnimatedNumber,
    SkeletonCard,
    SkeletonChart,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import {
    ShieldAlert,
    Activity,
    BarChart3,
    TrendingDown,
    Gauge,
    Target,
    AlertCircle,
    ArrowRight,
    LineChart as LineChartIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

// ── API types ────────────────────────────────────────────────
interface ApiHolding {
    id: string;
    name: string;
    assetClass: string;
    currentValue: number;
    sector?: string | null;
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

interface RiskResult {
    overall_risk_score: number;
    volatility: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    beta: number;
    alpha: number;
    concentration: {
        top_holding_weight: number;
        top_5_weight: number;
        hhi: number;
        level: "low" | "medium" | "high";
    };
    asset_allocation: {
        asset_class: string;
        weight: number;
        target_weight: number;
    }[];
    sector_exposure: { sector: string; weight: number }[];
    data_source: "computed" | "estimated";
    risk_free_rate: number;
}

interface MonteCarloResult {
    simulations: number;
    years: number;
    total_invested: number;
    expected_value: number;
    median: number;
    best_case: number;
    worst_case: number;
    percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
    probability_of_loss: number;
    median_real_value: number;
    median_max_drawdown: number;
    yearly: {
        year: number;
        invested: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        mean: number;
    }[];
}

async function postAnalytics<T>(
    path: string,
    body: unknown,
    expectKey: string,
): Promise<T> {
    const res = await fetch(`/api/analytics/${path}`, {
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
        !(expectKey in record)
    ) {
        const message =
            record && typeof record.detail === "string"
                ? record.detail
                : (record?.error as { message?: string } | undefined)?.message;
        throw new Error(message ?? "Analytics service is unavailable.");
    }
    return record as unknown as T;
}

// ── Presentation helpers ─────────────────────────────────────
const ASSET_LABELS: Record<string, string> = {
    equity: "Equity",
    debt: "Debt",
    gold: "Gold",
    real_estate: "Real Estate",
    cash: "Cash",
    international: "International",
    alternative: "Alternative",
};

const TOOLTIP_STYLE = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
} as const;

const AXIS_TICK = { fill: "#94A3B8", fontSize: 10 } as const;

const percentFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
) => `${Number(value).toFixed(1)}%`;

const currencyFormatter = (
    value: number | string | readonly (number | string)[] | undefined,
) => formatCurrency(Number(value), { decimals: 0 });

const LEVEL_BADGE: Record<
    "low" | "medium" | "high",
    "positive" | "warning" | "negative"
> = { low: "positive", medium: "warning", high: "negative" };

function RiskMetricTile({
    label,
    value,
    format,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    format: (v: number) => string;
    icon: LucideIcon;
    tone?: "positive" | "negative" | "neutral";
}) {
    return (
        <div className="card-surface p-5 flex flex-col gap-3 group">
            <div className="flex items-center justify-between">
                <span className="metric-label">{label}</span>
                <div className="h-9 w-9 rounded-lg bg-surface-200 flex items-center justify-center group-hover:bg-wealth-600/10 transition-colors">
                    <Icon className="h-4 w-4 text-text-tertiary group-hover:text-wealth-500 transition-colors" />
                </div>
            </div>
            <div
                className={cn(
                    "metric-value",
                    tone === "positive" && "text-positive-500",
                    tone === "negative" && "text-negative-500",
                )}
            >
                <AnimatedNumber value={value} format={format} />
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────
export default function RiskAnalyticsPage() {
    const portfolioQuery = useQuery({
        queryKey: ["portfolio"],
        queryFn: fetchPortfolio,
    });

    const riskProfileQuery = useQuery({
        queryKey: ["risk-profile"],
        queryFn: fetchRiskProfile,
    });

    const riskHoldings = useMemo(
        () =>
            (portfolioQuery.data?.portfolios.flatMap((p) => p.holdings) ?? [])
                .filter((h) => h.currentValue > 0)
                .map((h) => ({
                    name: h.name,
                    value: h.currentValue,
                    asset_class: h.assetClass.toLowerCase(),
                    ...(h.sector ? { sector: h.sector } : {}),
                })),
        [portfolioQuery.data],
    );

    const riskQuery = useQuery({
        queryKey: ["risk-compute", riskHoldings],
        queryFn: () =>
            postAnalytics<RiskResult>(
                "risk/compute",
                { holdings: riskHoldings },
                "overall_risk_score",
            ),
        enabled: portfolioQuery.isSuccess && riskHoldings.length > 0,
    });

    const totalValue = portfolioQuery.data?.summary.totalValue ?? 0;
    const effectiveProfile = riskProfileQuery.data
        ? riskProfileQuery.data.toLowerCase()
        : "balanced";

    const monteCarloQuery = useQuery({
        queryKey: ["risk-monte-carlo", totalValue, effectiveProfile],
        queryFn: () =>
            postAnalytics<MonteCarloResult>(
                "projection/monte-carlo",
                {
                    initial_investment: totalValue,
                    monthly_sip: 0,
                    years: 10,
                    risk_profile: effectiveProfile,
                },
                "percentiles",
            ),
        enabled:
            portfolioQuery.isSuccess &&
            !riskProfileQuery.isPending &&
            totalValue > 0,
    });

    const risk = riskQuery.data;
    const monteCarlo = monteCarloQuery.data;

    const allocationBars = useMemo(
        () =>
            (risk?.asset_allocation ?? []).map((entry) => ({
                name: ASSET_LABELS[entry.asset_class] ?? entry.asset_class,
                Current: entry.weight,
                Target: entry.target_weight,
            })),
        [risk],
    );

    const sectors = useMemo(
        () =>
            [...(risk?.sector_exposure ?? [])].sort(
                (a, b) => b.weight - a.weight,
            ),
        [risk],
    );

    const hasData = riskHoldings.length > 0;

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Risk Analytics"
                description="Deep risk intelligence — volatility, concentration, drawdown analysis, and Monte Carlo stress testing."
                actions={
                    risk?.data_source === "estimated" ? (
                        <Badge variant="warning">
                            Estimated from asset-class assumptions
                        </Badge>
                    ) : risk?.data_source === "computed" ? (
                        <Badge variant="positive">
                            Computed from return history
                        </Badge>
                    ) : undefined
                }
            />

            {portfolioQuery.isPending ||
            (hasData && riskQuery.isPending) ? (
                <div className="space-y-6">
                    <WidgetGrid columns={3}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </WidgetGrid>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <SkeletonChart />
                        <SkeletonChart />
                    </div>
                </div>
            ) : portfolioQuery.isError || riskQuery.isError ? (
                <Card padding="lg">
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                        <AlertCircle className="h-8 w-8 text-negative-500" />
                        <p className="text-sm font-semibold text-text-primary">
                            Couldn&apos;t compute risk analytics
                        </p>
                        <p className="text-xs text-text-secondary max-w-sm">
                            {portfolioQuery.error?.message ??
                                riskQuery.error?.message}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (portfolioQuery.isError) {
                                    void portfolioQuery.refetch();
                                }
                                if (riskQuery.isError) {
                                    void riskQuery.refetch();
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
                        icon={<ShieldAlert className="h-10 w-10" />}
                        title="No holdings to analyze"
                        description="Risk analytics are computed from your actual holdings. Add investments with a current value to see volatility, concentration and drawdown intelligence."
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
            ) : risk ? (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {/* Core metrics */}
                    <WidgetGrid columns={3}>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Risk Score"
                                value={risk.overall_risk_score}
                                format={(v) => `${Math.round(v)} / 100`}
                                icon={ShieldAlert}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Volatility (annualized)"
                                value={risk.volatility}
                                format={(v) => `${v.toFixed(1)}%`}
                                icon={Activity}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Sharpe Ratio"
                                value={risk.sharpe_ratio}
                                format={(v) => v.toFixed(2)}
                                icon={BarChart3}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Sortino Ratio"
                                value={risk.sortino_ratio}
                                format={(v) => v.toFixed(2)}
                                icon={Gauge}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Max Drawdown"
                                value={risk.max_drawdown}
                                format={(v) => `${v.toFixed(1)}%`}
                                icon={TrendingDown}
                                tone="negative"
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <RiskMetricTile
                                label="Beta (vs benchmark)"
                                value={risk.beta}
                                format={(v) => v.toFixed(2)}
                                icon={Target}
                            />
                        </motion.div>
                    </WidgetGrid>

                    {/* Concentration + allocation vs target */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <motion.div variants={staggerItem}>
                            <Card padding="md" className="h-full">
                                <CardHeader>
                                    <CardTitle>Concentration Risk</CardTitle>
                                    <Badge
                                        variant={
                                            LEVEL_BADGE[
                                                risk.concentration.level
                                            ]
                                        }
                                        className="capitalize"
                                    >
                                        {risk.concentration.level}
                                    </Badge>
                                </CardHeader>
                                <div className="space-y-4 mt-4">
                                    {[
                                        {
                                            label: "Top Holding Weight",
                                            value: `${risk.concentration.top_holding_weight.toFixed(1)}%`,
                                        },
                                        {
                                            label: "Top 5 Holdings",
                                            value: `${risk.concentration.top_5_weight.toFixed(1)}%`,
                                        },
                                        {
                                            label: "HHI Score",
                                            value: risk.concentration.hhi.toFixed(
                                                3,
                                            ),
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-center justify-between p-3 rounded-lg bg-surface-100"
                                        >
                                            <span className="text-sm text-text-secondary">
                                                {item.label}
                                            </span>
                                            <span className="text-sm font-medium text-text-primary tabular-nums">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {sectors.length > 0 && (
                                    <div className="mt-6">
                                        <p className="metric-label mb-3">
                                            Sector Exposure
                                        </p>
                                        <div className="space-y-3">
                                            {sectors.map((sector) => (
                                                <div key={sector.sector}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-text-secondary">
                                                            {sector.sector}
                                                        </span>
                                                        <span className="text-xs font-medium text-text-primary tabular-nums">
                                                            {sector.weight.toFixed(
                                                                1,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-wealth-500"
                                                            initial={{
                                                                width: 0,
                                                            }}
                                                            animate={{
                                                                width: `${sector.weight}%`,
                                                            }}
                                                            transition={{
                                                                duration: 0.8,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </motion.div>

                        <motion.div variants={staggerItem}>
                            <Card padding="md" className="h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle>
                                        Allocation vs Target
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 min-h-[280px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={allocationBars}
                                            margin={{
                                                top: 10,
                                                right: 10,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                                stroke="rgba(255,255,255,0.05)"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                axisLine={false}
                                                tick={AXIS_TICK}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(v: number) =>
                                                    `${v}%`
                                                }
                                                tick={AXIS_TICK}
                                            />
                                            <Tooltip
                                                formatter={percentFormatter}
                                                contentStyle={TOOLTIP_STYLE}
                                                cursor={{
                                                    fill: "rgba(255,255,255,0.04)",
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={32}
                                                iconType="circle"
                                                wrapperStyle={{
                                                    fontSize: "11px",
                                                }}
                                            />
                                            <Bar
                                                dataKey="Current"
                                                fill="#3B82F6"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={28}
                                            />
                                            <Bar
                                                dataKey="Target"
                                                fill="#94A3B8"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={28}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Monte Carlo stress test */}
                    <motion.div variants={staggerItem}>
                        <Card padding="md">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <LineChartIcon className="h-4 w-4 text-wealth-400" />
                                    <CardTitle>
                                        Monte Carlo Stress Test
                                    </CardTitle>
                                </div>
                                {monteCarlo && (
                                    <Badge variant="outline">
                                        {monteCarlo.simulations.toLocaleString(
                                            "en-IN",
                                        )}{" "}
                                        simulations · 10 years ·{" "}
                                        {effectiveProfile} profile
                                    </Badge>
                                )}
                            </CardHeader>

                            {monteCarloQuery.isPending ? (
                                <SkeletonChart className="border-0 p-0" />
                            ) : monteCarloQuery.isError ? (
                                <div className="flex flex-col items-center text-center gap-3 py-8">
                                    <AlertCircle className="h-6 w-6 text-negative-500" />
                                    <p className="text-xs text-text-secondary max-w-sm">
                                        {monteCarloQuery.error.message}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            monteCarloQuery.refetch()
                                        }
                                    >
                                        Retry
                                    </Button>
                                </div>
                            ) : monteCarlo ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-lg bg-surface-100 border-l-4 border-l-negative-500/50">
                                            <p className="metric-label mb-1">
                                                Pessimistic (p10)
                                            </p>
                                            <p className="text-lg font-bold text-negative-400 tabular-nums">
                                                {formatCurrency(
                                                    monteCarlo.percentiles.p10,
                                                    { decimals: 0 },
                                                )}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-surface-100 border-l-4 border-l-wealth-500">
                                            <p className="metric-label mb-1">
                                                Median (p50)
                                            </p>
                                            <p className="text-lg font-bold text-wealth-400 tabular-nums">
                                                {formatCurrency(
                                                    monteCarlo.percentiles.p50,
                                                    { decimals: 0 },
                                                )}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-surface-100 border-l-4 border-l-positive-500">
                                            <p className="metric-label mb-1">
                                                Optimistic (p90)
                                            </p>
                                            <p className="text-lg font-bold text-positive-500 tabular-nums">
                                                {formatCurrency(
                                                    monteCarlo.percentiles.p90,
                                                    { decimals: 0 },
                                                )}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-surface-100">
                                            <p className="metric-label mb-1">
                                                Probability of Loss
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-lg font-bold tabular-nums",
                                                    monteCarlo.probability_of_loss >
                                                        0.2
                                                        ? "text-negative-400"
                                                        : "text-text-primary",
                                                )}
                                            >
                                                {(
                                                    monteCarlo.probability_of_loss *
                                                    100
                                                ).toFixed(1)}
                                                %
                                            </p>
                                            <p className="text-[10px] text-text-tertiary mt-0.5">
                                                vs{" "}
                                                {formatCurrency(
                                                    monteCarlo.total_invested,
                                                    {
                                                        compact: true,
                                                    },
                                                )}{" "}
                                                held today
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-64">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <AreaChart
                                                data={monteCarlo.yearly}
                                                margin={{
                                                    top: 10,
                                                    right: 10,
                                                    left: 10,
                                                    bottom: 0,
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="mcP90"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor="#10B981"
                                                            stopOpacity={0.15}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="#10B981"
                                                            stopOpacity={0.01}
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="mcP50"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor="#3B82F6"
                                                            stopOpacity={0.25}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="#3B82F6"
                                                            stopOpacity={0.02}
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="mcP10"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1"
                                                    >
                                                        <stop
                                                            offset="5%"
                                                            stopColor="#EF4444"
                                                            stopOpacity={0.12}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="#EF4444"
                                                            stopOpacity={0.01}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="rgba(255,255,255,0.05)"
                                                />
                                                <XAxis
                                                    dataKey="year"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={AXIS_TICK}
                                                    tickFormatter={(
                                                        v: number,
                                                    ) => `Yr ${v}`}
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(
                                                        v: number,
                                                    ) =>
                                                        formatCurrency(v, {
                                                            compact: true,
                                                        })
                                                    }
                                                    tick={AXIS_TICK}
                                                />
                                                <Tooltip
                                                    formatter={
                                                        currencyFormatter
                                                    }
                                                    labelFormatter={(
                                                        label,
                                                    ) => `Year ${label}`}
                                                    contentStyle={
                                                        TOOLTIP_STYLE
                                                    }
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={32}
                                                    iconType="circle"
                                                    wrapperStyle={{
                                                        fontSize: "11px",
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="p90"
                                                    name="Optimistic (p90)"
                                                    stroke="#10B981"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#mcP90)"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="p50"
                                                    name="Median (p50)"
                                                    stroke="#3B82F6"
                                                    strokeWidth={2.5}
                                                    fillOpacity={1}
                                                    fill="url(#mcP50)"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="p10"
                                                    name="Pessimistic (p10)"
                                                    stroke="#EF4444"
                                                    strokeWidth={1.5}
                                                    fillOpacity={1}
                                                    fill="url(#mcP10)"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="invested"
                                                    name="Invested Value"
                                                    stroke="rgba(148, 163, 184, 0.5)"
                                                    strokeWidth={1}
                                                    fill="none"
                                                    strokeDasharray="4 4"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <p className="text-[11px] text-text-tertiary">
                                        Projection of your current{" "}
                                        {formatCurrency(totalValue, {
                                            decimals: 0,
                                        })}{" "}
                                        portfolio with no further
                                        contributions, median max drawdown{" "}
                                        {formatPercentage(
                                            monteCarlo.median_max_drawdown *
                                                100,
                                        )}{" "}
                                        along the way.
                                    </p>
                                </div>
                            ) : null}
                        </Card>
                    </motion.div>
                </motion.div>
            ) : null}
        </motion.div>
    );
}
