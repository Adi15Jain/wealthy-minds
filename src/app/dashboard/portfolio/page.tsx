"use client";

import { useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    PageHeader,
    WidgetGrid,
    Card,
    CardHeader,
    CardTitle,
    MetricCard,
    Badge,
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    EmptyState,
    SkeletonCard,
    SkeletonTable,
    SkeletonChart,
    toast,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import {
    Briefcase,
    Plus,
    Pencil,
    Trash2,
    Wallet,
    TrendingUp,
    Layers,
    AlertCircle,
    PieChart as PieChartIcon,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// ── API types ────────────────────────────────────────────────
const INVESTMENT_TYPES = [
    { value: "MUTUAL_FUND", label: "Mutual Fund" },
    { value: "STOCK", label: "Stock" },
    { value: "ETF", label: "ETF" },
    { value: "FIXED_DEPOSIT", label: "Fixed Deposit" },
    { value: "PPF", label: "PPF" },
    { value: "NPS", label: "NPS" },
    { value: "GOLD", label: "Gold" },
    { value: "BOND", label: "Bond" },
    { value: "REIT", label: "REIT" },
] as const;

const ASSET_CLASSES = [
    { value: "EQUITY", label: "Equity" },
    { value: "DEBT", label: "Debt" },
    { value: "GOLD", label: "Gold" },
    { value: "REAL_ESTATE", label: "Real Estate" },
    { value: "CASH", label: "Cash" },
    { value: "INTERNATIONAL", label: "International" },
    { value: "ALTERNATIVE", label: "Alternative" },
] as const;

type InvestmentTypeApi = (typeof INVESTMENT_TYPES)[number]["value"];
type AssetClassApi = (typeof ASSET_CLASSES)[number]["value"];

interface ApiHolding {
    id: string;
    portfolioId: string;
    name: string;
    ticker: string;
    type: InvestmentTypeApi;
    assetClass: AssetClassApi;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    currentValue: number;
    investedValue: number;
    returns: number;
    returnPercentage: number;
    allocation: number;
    sector?: string | null;
}

interface AssetAllocationSlice {
    assetClass: string;
    value: number;
    percentage: number;
}

interface PortfolioData {
    portfolios: { id: string; name: string; holdings: ApiHolding[] }[];
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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
    if (!res.ok || !json?.success || json.data === undefined) {
        throw new Error(
            json?.error?.message ?? `Request failed (${res.status})`,
        );
    }
    return json.data;
}

// ── Asset-class palette (validated for CVD + contrast) ───────
const ASSET_CLASS_COLORS: Record<string, string> = {
    equity: "#3B82F6",
    debt: "#059669",
    gold: "#D97706",
    real_estate: "#8B5CF6",
    cash: "#0891B2",
    international: "#EC4899",
    alternative: "#EA580C",
};

const ASSET_CLASS_LABELS: Record<string, string> = {
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

const TYPE_LABELS: Record<InvestmentTypeApi, string> = Object.fromEntries(
    INVESTMENT_TYPES.map((t) => [t.value, t.label]),
) as Record<InvestmentTypeApi, string>;

// ── Form state ───────────────────────────────────────────────
interface HoldingFormState {
    name: string;
    ticker: string;
    type: InvestmentTypeApi;
    assetClass: AssetClassApi;
    quantity: string;
    avgBuyPrice: string;
    currentPrice: string;
    sector: string;
}

const EMPTY_FORM: HoldingFormState = {
    name: "",
    ticker: "",
    type: "MUTUAL_FUND",
    assetClass: "EQUITY",
    quantity: "",
    avgBuyPrice: "",
    currentPrice: "",
    sector: "",
};

const inputClass =
    "w-full px-3 py-2 rounded-lg bg-surface-50 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-all";

function FormField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────
export default function PortfolioPage() {
    const queryClient = useQueryClient();
    const [addOpen, setAddOpen] = useState(false);
    const [editHolding, setEditHolding] = useState<ApiHolding | null>(null);
    const [deleteHolding, setDeleteHolding] = useState<ApiHolding | null>(
        null,
    );
    const [form, setForm] = useState<HoldingFormState>(EMPTY_FORM);
    const [formError, setFormError] = useState("");

    const portfolioQuery = useQuery({
        queryKey: ["portfolio"],
        queryFn: () => requestJson<PortfolioData>("/api/portfolio"),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });

    const addMutation = useMutation({
        mutationFn: (input: Record<string, unknown>) =>
            requestJson<ApiHolding>("/api/portfolio/holdings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            }),
        onSuccess: () => {
            invalidate();
            toast.success("Holding added");
            setAddOpen(false);
            setForm(EMPTY_FORM);
        },
        onError: (error: Error) =>
            toast.error("Could not add holding", {
                description: error.message,
            }),
    });

    const editMutation = useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: Record<string, unknown>;
        }) =>
            requestJson<ApiHolding>(`/api/portfolio/holdings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            }),
        onSuccess: () => {
            invalidate();
            toast.success("Holding updated");
            setEditHolding(null);
        },
        onError: (error: Error) =>
            toast.error("Could not update holding", {
                description: error.message,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            requestJson<{ id: string; deleted: boolean }>(
                `/api/portfolio/holdings/${id}`,
                { method: "DELETE" },
            ),
        onSuccess: () => {
            invalidate();
            toast.success("Holding deleted");
            setDeleteHolding(null);
        },
        onError: (error: Error) =>
            toast.error("Could not delete holding", {
                description: error.message,
            }),
    });

    const holdings = useMemo(
        () =>
            portfolioQuery.data?.portfolios.flatMap((p) => p.holdings) ?? [],
        [portfolioQuery.data],
    );
    const summary = portfolioQuery.data?.summary;

    const donutData = useMemo(
        () =>
            (summary?.assetAllocation ?? [])
                .filter((slice) => slice.value > 0)
                .map((slice) => {
                    const key = slice.assetClass.toLowerCase();
                    return {
                        key,
                        name: ASSET_CLASS_LABELS[key] ?? slice.assetClass,
                        value: slice.value,
                        percentage: slice.percentage,
                        color: ASSET_CLASS_COLORS[key] ?? "#94A3B8",
                    };
                }),
        [summary],
    );

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setFormError("");
        setAddOpen(true);
    };

    const openEdit = (holding: ApiHolding) => {
        setForm({
            name: holding.name,
            ticker: holding.ticker,
            type: holding.type,
            assetClass: holding.assetClass,
            quantity: String(holding.quantity),
            avgBuyPrice: String(holding.avgBuyPrice),
            currentPrice: holding.currentPrice
                ? String(holding.currentPrice)
                : "",
            sector: holding.sector ?? "",
        });
        setFormError("");
        setEditHolding(holding);
    };

    const handleAddSubmit = (event: FormEvent) => {
        event.preventDefault();
        const quantity = Number(form.quantity);
        const avgBuyPrice = Number(form.avgBuyPrice);
        if (!form.name.trim() || !form.ticker.trim()) {
            setFormError("Name and ticker are required.");
            return;
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            setFormError("Quantity must be a number greater than 0.");
            return;
        }
        if (!Number.isFinite(avgBuyPrice) || avgBuyPrice < 0) {
            setFormError("Average buy price must be a number ≥ 0.");
            return;
        }
        setFormError("");
        addMutation.mutate({
            name: form.name.trim(),
            ticker: form.ticker.trim(),
            type: form.type,
            assetClass: form.assetClass,
            quantity,
            avgBuyPrice,
            ...(form.currentPrice.trim() !== ""
                ? { currentPrice: Number(form.currentPrice) }
                : {}),
            ...(form.sector.trim() !== ""
                ? { sector: form.sector.trim() }
                : {}),
        });
    };

    const handleEditSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!editHolding) return;
        const quantity = Number(form.quantity);
        const avgBuyPrice = Number(form.avgBuyPrice);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            setFormError("Quantity must be a number greater than 0.");
            return;
        }
        if (!Number.isFinite(avgBuyPrice) || avgBuyPrice < 0) {
            setFormError("Average buy price must be a number ≥ 0.");
            return;
        }
        setFormError("");
        editMutation.mutate({
            id: editHolding.id,
            input: {
                quantity,
                avgBuyPrice,
                ...(form.currentPrice.trim() !== ""
                    ? { currentPrice: Number(form.currentPrice) }
                    : {}),
                ...(form.sector.trim() !== ""
                    ? { sector: form.sector.trim() }
                    : {}),
            },
        });
    };

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Portfolio"
                description="Deep-dive into your complete portfolio landscape with AI-powered analysis."
                actions={
                    <Button size="sm" onClick={openAdd}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Holding
                    </Button>
                }
            />

            {portfolioQuery.isPending ? (
                <div className="space-y-6">
                    <WidgetGrid columns={4}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </WidgetGrid>
                    <Card padding="md">
                        <SkeletonTable rows={5} cols={6} />
                    </Card>
                    <SkeletonChart />
                </div>
            ) : portfolioQuery.isError ? (
                <Card padding="lg">
                    <div className="flex flex-col items-center text-center gap-3 py-8">
                        <AlertCircle className="h-8 w-8 text-negative-500" />
                        <p className="text-sm font-semibold text-text-primary">
                            Couldn&apos;t load your portfolio
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
                        icon={<Briefcase className="h-10 w-10" />}
                        title="No holdings yet"
                        description="Track your mutual funds, stocks, FDs and more in one place. Add your first holding to unlock live analytics across the dashboard."
                        action={
                            <Button onClick={openAdd}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add your first holding
                            </Button>
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
                    {/* Summary metrics */}
                    <WidgetGrid columns={4}>
                        <motion.div variants={staggerItem}>
                            <MetricCard
                                label="Current Value"
                                value={summary.totalValue}
                                format="currency"
                                compact
                                icon={Wallet}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <MetricCard
                                label="Total Invested"
                                value={summary.totalInvested}
                                format="currency"
                                compact
                                icon={Briefcase}
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <MetricCard
                                label="Total Returns"
                                value={summary.totalReturns}
                                format="currency"
                                compact
                                icon={TrendingUp}
                                change={summary.returnPercentage}
                                changeLabel="overall"
                                trend={
                                    summary.totalReturns >= 0 ? "up" : "down"
                                }
                            />
                        </motion.div>
                        <motion.div variants={staggerItem}>
                            <MetricCard
                                label="Holdings"
                                value={summary.holdingsCount}
                                format="number"
                                icon={Layers}
                            />
                        </motion.div>
                    </WidgetGrid>

                    {/* Holdings list */}
                    <motion.div variants={staggerItem}>
                        <Card padding="md">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-text-tertiary" />
                                    <CardTitle>Holdings</CardTitle>
                                    <Badge>
                                        {summary.holdingsCount}{" "}
                                        {summary.holdingsCount === 1
                                            ? "asset"
                                            : "assets"}
                                    </Badge>
                                </div>
                            </CardHeader>

                            {/* Desktop table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-subtle text-left">
                                            {[
                                                "Asset",
                                                "Type",
                                                "Qty",
                                                "Avg Price",
                                                "Current Value",
                                                "Returns",
                                                "Allocation",
                                                "",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="metric-label pb-3 pr-4 font-bold"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {holdings.map((holding) => (
                                            <tr
                                                key={holding.id}
                                                className="border-b border-border-subtle/50 last:border-0 hover:bg-surface-100/50 transition-colors"
                                            >
                                                <td className="py-3 pr-4">
                                                    <p className="font-medium text-text-primary">
                                                        {holding.name}
                                                    </p>
                                                    <p className="text-xs text-text-tertiary font-mono">
                                                        {holding.ticker}
                                                    </p>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <Badge variant="outline">
                                                        {
                                                            TYPE_LABELS[
                                                                holding.type
                                                            ]
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="py-3 pr-4 text-text-secondary tabular-nums">
                                                    {holding.quantity.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-text-secondary tabular-nums">
                                                    {formatCurrency(
                                                        holding.avgBuyPrice,
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 font-medium text-text-primary tabular-nums">
                                                    {formatCurrency(
                                                        holding.currentValue,
                                                        { decimals: 0 },
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span
                                                        className={cn(
                                                            "font-medium tabular-nums",
                                                            holding.returns >=
                                                                0
                                                                ? "text-positive-500"
                                                                : "text-negative-500",
                                                        )}
                                                    >
                                                        {formatCurrency(
                                                            holding.returns,
                                                            { decimals: 0 },
                                                        )}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "block text-xs tabular-nums",
                                                            holding.returns >=
                                                                0
                                                                ? "text-positive-500/80"
                                                                : "text-negative-500/80",
                                                        )}
                                                    >
                                                        {formatPercentage(
                                                            holding.returnPercentage,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-text-secondary tabular-nums">
                                                    {holding.allocation.toFixed(
                                                        1,
                                                    )}
                                                    %
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label={`Edit ${holding.name}`}
                                                            onClick={() =>
                                                                openEdit(
                                                                    holding,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            aria-label={`Delete ${holding.name}`}
                                                            onClick={() =>
                                                                setDeleteHolding(
                                                                    holding,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-negative-400" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="lg:hidden space-y-3">
                                {holdings.map((holding) => (
                                    <div
                                        key={holding.id}
                                        className="p-4 rounded-xl bg-surface-100 border border-border-subtle"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">
                                                    {holding.name}
                                                </p>
                                                <p className="text-xs text-text-tertiary font-mono">
                                                    {holding.ticker}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {TYPE_LABELS[holding.type]}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                            <div>
                                                <p className="metric-label">
                                                    Qty
                                                </p>
                                                <p className="text-text-secondary tabular-nums">
                                                    {holding.quantity.toLocaleString(
                                                        "en-IN",
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="metric-label">
                                                    Avg Price
                                                </p>
                                                <p className="text-text-secondary tabular-nums">
                                                    {formatCurrency(
                                                        holding.avgBuyPrice,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="metric-label">
                                                    Value
                                                </p>
                                                <p className="text-text-primary font-medium tabular-nums">
                                                    {formatCurrency(
                                                        holding.currentValue,
                                                        { decimals: 0 },
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="metric-label">
                                                    Returns
                                                </p>
                                                <p
                                                    className={cn(
                                                        "font-medium tabular-nums",
                                                        holding.returns >= 0
                                                            ? "text-positive-500"
                                                            : "text-negative-500",
                                                    )}
                                                >
                                                    {formatCurrency(
                                                        holding.returns,
                                                        { decimals: 0 },
                                                    )}{" "}
                                                    (
                                                    {formatPercentage(
                                                        holding.returnPercentage,
                                                    )}
                                                    )
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                                            <span className="text-xs text-text-tertiary tabular-nums">
                                                {holding.allocation.toFixed(1)}
                                                % of portfolio
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Edit ${holding.name}`}
                                                    onClick={() =>
                                                        openEdit(holding)
                                                    }
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Delete ${holding.name}`}
                                                    onClick={() =>
                                                        setDeleteHolding(
                                                            holding,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-negative-400" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>

                    {/* Allocation donut */}
                    <motion.div variants={staggerItem}>
                        <Card padding="md">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <PieChartIcon className="h-4 w-4 text-text-tertiary" />
                                    <CardTitle>Asset Allocation</CardTitle>
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
                                                data={donutData}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius="62%"
                                                outerRadius="88%"
                                                paddingAngle={2}
                                                strokeWidth={0}
                                            >
                                                {donutData.map((slice) => (
                                                    <Cell
                                                        key={slice.key}
                                                        fill={slice.color}
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
                                    {donutData.map((slice) => (
                                        <div
                                            key={slice.key}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        backgroundColor:
                                                            slice.color,
                                                    }}
                                                />
                                                <span className="text-sm text-text-secondary truncate">
                                                    {slice.name}
                                                </span>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className="text-sm font-medium text-text-primary tabular-nums">
                                                    {formatCurrency(
                                                        slice.value,
                                                        {
                                                            decimals: 0,
                                                        },
                                                    )}
                                                </span>
                                                <span className="text-xs text-text-tertiary tabular-nums ml-2">
                                                    {slice.percentage.toFixed(
                                                        1,
                                                    )}
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

            {/* Add holding dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Holding</DialogTitle>
                        <DialogDescription>
                            Record a new investment in your portfolio.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Name" htmlFor="add-name">
                                <input
                                    id="add-name"
                                    className={inputClass}
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Nifty 50 Index Fund"
                                    required
                                />
                            </FormField>
                            <FormField label="Ticker" htmlFor="add-ticker">
                                <input
                                    id="add-ticker"
                                    className={inputClass}
                                    value={form.ticker}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            ticker: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. NIFTYBEES"
                                    required
                                />
                            </FormField>
                            <FormField label="Type" htmlFor="add-type">
                                <select
                                    id="add-type"
                                    className={inputClass}
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target
                                                .value as InvestmentTypeApi,
                                        }))
                                    }
                                >
                                    {INVESTMENT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField
                                label="Asset Class"
                                htmlFor="add-asset-class"
                            >
                                <select
                                    id="add-asset-class"
                                    className={inputClass}
                                    value={form.assetClass}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            assetClass: e.target
                                                .value as AssetClassApi,
                                        }))
                                    }
                                >
                                    {ASSET_CLASSES.map((a) => (
                                        <option key={a.value} value={a.value}>
                                            {a.label}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Quantity" htmlFor="add-qty">
                                <input
                                    id="add-qty"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            quantity: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. 100"
                                    required
                                />
                            </FormField>
                            <FormField
                                label="Avg Buy Price (₹)"
                                htmlFor="add-avg-price"
                            >
                                <input
                                    id="add-avg-price"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.avgBuyPrice}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            avgBuyPrice: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. 250.50"
                                    required
                                />
                            </FormField>
                            <FormField
                                label="Current Price (₹) — optional"
                                htmlFor="add-current-price"
                            >
                                <input
                                    id="add-current-price"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.currentPrice}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            currentPrice: e.target.value,
                                        }))
                                    }
                                    placeholder="Defaults to 0"
                                />
                            </FormField>
                            <FormField
                                label="Sector — optional"
                                htmlFor="add-sector"
                            >
                                <input
                                    id="add-sector"
                                    className={inputClass}
                                    value={form.sector}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            sector: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Financial Services"
                                />
                            </FormField>
                        </div>
                        {formError && (
                            <p
                                role="alert"
                                className="text-xs text-negative-400"
                            >
                                {formError}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setAddOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={addMutation.isPending}
                            >
                                Add Holding
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit holding dialog */}
            <Dialog
                open={editHolding !== null}
                onOpenChange={(open) => {
                    if (!open) setEditHolding(null);
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Holding</DialogTitle>
                        <DialogDescription>
                            {editHolding
                                ? `Update ${editHolding.name} (${editHolding.ticker}).`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Quantity" htmlFor="edit-qty">
                                <input
                                    id="edit-qty"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            quantity: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </FormField>
                            <FormField
                                label="Avg Buy Price (₹)"
                                htmlFor="edit-avg-price"
                            >
                                <input
                                    id="edit-avg-price"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.avgBuyPrice}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            avgBuyPrice: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </FormField>
                            <FormField
                                label="Current Price (₹)"
                                htmlFor="edit-current-price"
                            >
                                <input
                                    id="edit-current-price"
                                    className={inputClass}
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={form.currentPrice}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            currentPrice: e.target.value,
                                        }))
                                    }
                                />
                            </FormField>
                            <FormField label="Sector" htmlFor="edit-sector">
                                <input
                                    id="edit-sector"
                                    className={inputClass}
                                    value={form.sector}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            sector: e.target.value,
                                        }))
                                    }
                                />
                            </FormField>
                        </div>
                        {formError && (
                            <p
                                role="alert"
                                className="text-xs text-negative-400"
                            >
                                {formError}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setEditHolding(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                isLoading={editMutation.isPending}
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteHolding !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteHolding(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Holding</DialogTitle>
                        <DialogDescription>
                            {deleteHolding
                                ? `This will permanently remove ${deleteHolding.name} (${deleteHolding.ticker}) and its value from your portfolio. This action cannot be undone.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteHolding(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            isLoading={deleteMutation.isPending}
                            onClick={() => {
                                if (deleteHolding) {
                                    deleteMutation.mutate(deleteHolding.id);
                                }
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
