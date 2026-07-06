"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Button,
    Card,
    CardTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    EmptyState,
    PageHeader,
    SkeletonCard,
    toast,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils";
import {
    FileText,
    Download,
    Calendar,
    Plus,
    Trash2,
    AlertCircle,
    TrendingUp,
    PieChart,
    Target,
} from "lucide-react";

// ── API types & client ───────────────────────────────────────
const REPORT_TYPES = [
    { value: "MONTHLY_SUMMARY", label: "Monthly Summary" },
    { value: "QUARTERLY_PERFORMANCE", label: "Quarterly Performance" },
    { value: "ANNUAL_TAX", label: "Annual Tax Statement" },
    { value: "CUSTOM", label: "Custom Report" },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];

interface ReportSummary {
    portfolioCount: number;
    holdingsCount: number;
    totalValue: number;
    totalInvested: number;
    totalReturns: number;
    returnPercentage: number;
}

interface ReportAllocation {
    assetClass: string;
    value: number;
    percentage: number;
}

interface ReportGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    status: string;
}

interface ReportData {
    generatedAt: string;
    summary: ReportSummary;
    allocation: ReportAllocation[];
    goals: ReportGoal[];
}

interface Report {
    id: string;
    title: string;
    type: ReportType;
    createdAt: string;
    data: ReportData | null;
}

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    let envelope: ApiEnvelope<T>;
    try {
        envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
        throw new Error("Unexpected server response");
    }
    if (!envelope.success) throw new Error(envelope.error.message);
    return envelope.data;
}

function jsonInit(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

const typeLabel: Record<ReportType, string> = {
    MONTHLY_SUMMARY: "Monthly",
    QUARTERLY_PERFORMANCE: "Quarterly",
    ANNUAL_TAX: "Annual · Tax",
    CUSTOM: "Custom",
};

const inputClass =
    "w-full h-10 px-3 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none";
const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

function downloadReport(report: Report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.title.replace(/[^\w-]+/g, "_")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const queryClient = useQueryClient();
    const [generateOpen, setGenerateOpen] = useState(false);
    const [reportType, setReportType] = useState<ReportType>("MONTHLY_SUMMARY");
    const [reportTitle, setReportTitle] = useState("");
    const [viewing, setViewing] = useState<Report | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState<Report | null>(null);

    const {
        data: reports,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery<Report[], Error>({
        queryKey: ["reports"],
        queryFn: () => api<Report[]>("/api/reports"),
    });

    const generateMutation = useMutation<Report, Error, { type: ReportType; title?: string }>({
        mutationFn: (payload) => api<Report>("/api/reports", jsonInit("POST", payload)),
        onSuccess: (report) => {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            toast.success("Report generated", { description: report.title });
            setGenerateOpen(false);
            setReportTitle("");
            setViewing(report);
        },
        onError: (err) =>
            toast.error("Could not generate report", { description: err.message }),
    });

    const deleteMutation = useMutation<{ id: string; deleted: boolean }, Error, string>({
        mutationFn: (id) => api(`/api/reports/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reports"] });
            toast.success("Report deleted");
            setConfirmingDelete(null);
        },
        onError: (err) =>
            toast.error("Could not delete report", { description: err.message }),
    });

    const openView = async (report: Report) => {
        // The list omits the heavy `data` blob; fetch the full report on demand.
        if (report.data) {
            setViewing(report);
            return;
        }
        try {
            const full = await api<Report>(`/api/reports/${report.id}`);
            setViewing(full);
        } catch (err) {
            toast.error("Could not open report", {
                description: err instanceof Error ? err.message : undefined,
            });
        }
    };

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate">
            <PageHeader
                title="Reports"
                description="Generate portfolio summaries, performance reviews, and tax statements — snapshotted from your live data."
                actions={
                    <Button size="sm" onClick={() => setGenerateOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Generate Report
                    </Button>
                }
            />

            {isPending && (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

            {isError && (
                <Card padding="lg" className="max-w-xl mx-auto text-center">
                    <AlertCircle className="h-8 w-8 text-negative-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                        Couldn&apos;t load your reports
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">{error.message}</p>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>
                        Try again
                    </Button>
                </Card>
            )}

            {reports && reports.length === 0 && (
                <EmptyState
                    icon={<FileText className="h-10 w-10" />}
                    title="No reports yet"
                    description="Generate your first report to snapshot your portfolio, goals, and allocation into a downloadable statement."
                    action={
                        <Button size="sm" onClick={() => setGenerateOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Generate your first report
                        </Button>
                    }
                />
            )}

            {reports && reports.length > 0 && (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    {reports.map((report) => (
                        <motion.div key={report.id} variants={staggerItem}>
                            <Card
                                padding="md"
                                animate
                                role="button"
                                tabIndex={0}
                                aria-label={`Open report: ${report.title}`}
                                className="group cursor-pointer flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50"
                                onClick={() => openView(report)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openView(report);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-lg bg-wealth-600/10 flex items-center justify-center group-hover:bg-wealth-600/20 transition-colors shrink-0">
                                        <FileText className="h-5 w-5 text-wealth-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle>{report.title}</CardTitle>
                                        <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(report.createdAt)} ·{" "}
                                            {typeLabel[report.type] ?? report.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Download report"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            downloadReport(report);
                                        }}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Delete report"
                                        className="text-text-tertiary hover:text-negative-400"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setConfirmingDelete(report);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ── Generate dialog ──────────────────────────── */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate report</DialogTitle>
                        <DialogDescription>
                            We&apos;ll snapshot your current portfolio, goals, and
                            allocation into a saved, downloadable report.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            generateMutation.mutate({
                                type: reportType,
                                title: reportTitle.trim() || undefined,
                            });
                        }}
                    >
                        <div>
                            <label htmlFor="report-type" className={labelClass}>
                                Report type
                            </label>
                            <select
                                id="report-type"
                                value={reportType}
                                onChange={(e) =>
                                    setReportType(e.target.value as ReportType)
                                }
                                className={inputClass}
                            >
                                {REPORT_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="report-title" className={labelClass}>
                                Title{" "}
                                <span className="text-text-tertiary font-normal">
                                    (optional)
                                </span>
                            </label>
                            <input
                                id="report-title"
                                type="text"
                                maxLength={200}
                                placeholder="Auto-generated if left blank"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <DialogFooter className="mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGenerateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                isLoading={generateMutation.isPending}
                            >
                                Generate
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── View dialog ──────────────────────────────── */}
            <Dialog
                open={viewing !== null}
                onOpenChange={(open) => !open && setViewing(null)}
            >
                <DialogContent className="max-w-2xl">
                    {viewing && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{viewing.title}</DialogTitle>
                                <DialogDescription>
                                    Generated{" "}
                                    {viewing.data
                                        ? formatDate(viewing.data.generatedAt)
                                        : formatDate(viewing.createdAt)}
                                </DialogDescription>
                            </DialogHeader>

                            {viewing.data ? (
                                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                                    <section>
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3 flex items-center gap-1.5">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            Summary
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <SummaryTile
                                                label="Total value"
                                                value={formatCurrency(
                                                    viewing.data.summary.totalValue,
                                                    { compact: true },
                                                )}
                                            />
                                            <SummaryTile
                                                label="Invested"
                                                value={formatCurrency(
                                                    viewing.data.summary.totalInvested,
                                                    { compact: true },
                                                )}
                                            />
                                            <SummaryTile
                                                label="Returns"
                                                value={formatCurrency(
                                                    viewing.data.summary.totalReturns,
                                                    { compact: true },
                                                )}
                                                accent={
                                                    viewing.data.summary.totalReturns >= 0
                                                        ? "positive"
                                                        : "negative"
                                                }
                                                sub={formatPercentage(
                                                    viewing.data.summary.returnPercentage,
                                                )}
                                            />
                                            <SummaryTile
                                                label="Holdings"
                                                value={String(
                                                    viewing.data.summary.holdingsCount,
                                                )}
                                            />
                                            <SummaryTile
                                                label="Portfolios"
                                                value={String(
                                                    viewing.data.summary.portfolioCount,
                                                )}
                                            />
                                        </div>
                                    </section>

                                    {viewing.data.allocation.length > 0 && (
                                        <section>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3 flex items-center gap-1.5">
                                                <PieChart className="h-3.5 w-3.5" />
                                                Allocation
                                            </h4>
                                            <div className="space-y-2">
                                                {viewing.data.allocation.map((a) => (
                                                    <div
                                                        key={a.assetClass}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <span className="text-sm text-text-secondary w-28 capitalize">
                                                            {a.assetClass.toLowerCase()}
                                                        </span>
                                                        <div className="flex-1 h-2 rounded-full bg-surface-200 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-wealth-600 to-wealth-400"
                                                                style={{
                                                                    width: `${Math.min(a.percentage, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-text-tertiary w-24 text-right tabular-nums">
                                                            {formatCurrency(a.value, {
                                                                compact: true,
                                                            })}{" "}
                                                            · {a.percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {viewing.data.goals.length > 0 && (
                                        <section>
                                            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-3 flex items-center gap-1.5">
                                                <Target className="h-3.5 w-3.5" />
                                                Goals
                                            </h4>
                                            <div className="space-y-2">
                                                {viewing.data.goals.map((g) => (
                                                    <div
                                                        key={g.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-text-secondary">
                                                            {g.name}
                                                        </span>
                                                        <span className="text-text-primary font-medium tabular-nums">
                                                            {g.progress.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-text-secondary">
                                    This report has no stored snapshot data.
                                </p>
                            )}

                            <DialogFooter className="mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewing(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => downloadReport(viewing)}
                                >
                                    <Download className="h-3.5 w-3.5 mr-1.5" />
                                    Download JSON
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete confirm ───────────────────────────── */}
            <Dialog
                open={confirmingDelete !== null}
                onOpenChange={(open) => !open && setConfirmingDelete(null)}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete report?</DialogTitle>
                        <DialogDescription>
                            {confirmingDelete?.title} will be permanently removed.
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmingDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            isLoading={deleteMutation.isPending}
                            onClick={() =>
                                confirmingDelete &&
                                deleteMutation.mutate(confirmingDelete.id)
                            }
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

function SummaryTile({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub?: string;
    accent?: "positive" | "negative";
}) {
    const accentClass =
        accent === "positive"
            ? "text-positive-400"
            : accent === "negative"
              ? "text-negative-400"
              : "text-text-primary";
    return (
        <div className="rounded-lg bg-surface-100 border border-border-subtle p-3">
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1">
                {label}
            </p>
            <p className={`text-lg font-bold tabular-nums ${accentClass}`}>{value}</p>
            {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
        </div>
    );
}
