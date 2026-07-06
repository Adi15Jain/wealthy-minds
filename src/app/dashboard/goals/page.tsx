"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AnimatedNumber,
    Badge,
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
    WidgetGrid,
    toast,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Target,
    Plus,
    GraduationCap,
    Home,
    Palmtree,
    ShieldCheck,
    Car,
    Umbrella,
    Heart,
    AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── API types & client ───────────────────────────────────────
const GOAL_TYPES = [
    { value: "RETIREMENT", label: "Retirement" },
    { value: "EDUCATION", label: "Education" },
    { value: "HOUSE", label: "House" },
    { value: "EMERGENCY_FUND", label: "Emergency Fund" },
    { value: "TRAVEL", label: "Travel" },
    { value: "VEHICLE", label: "Vehicle" },
    { value: "WEDDING", label: "Wedding" },
    { value: "CUSTOM", label: "Custom" },
] as const;

type GoalType = (typeof GOAL_TYPES)[number]["value"];
type GoalStatus = "ON_TRACK" | "BEHIND" | "AHEAD" | "COMPLETED";
type GoalPriority = "HIGH" | "MEDIUM" | "LOW";

interface Goal {
    id: string;
    name: string;
    type: GoalType;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    monthlyContribution: number;
    progress: number;
    status: GoalStatus;
    priority: GoalPriority;
    createdAt: string;
}

interface GoalPayload {
    name: string;
    type: GoalType;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    monthlyContribution: number;
    priority: GoalPriority;
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

// ── Presentation maps ────────────────────────────────────────
const typeIcons: Record<GoalType, LucideIcon> = {
    RETIREMENT: ShieldCheck,
    EDUCATION: GraduationCap,
    HOUSE: Home,
    EMERGENCY_FUND: Umbrella,
    TRAVEL: Palmtree,
    VEHICLE: Car,
    WEDDING: Heart,
    CUSTOM: Target,
};

type BadgeVariant = "default" | "positive" | "negative" | "warning" | "outline";

const statusBadge: Record<GoalStatus, { variant: BadgeVariant; label: string }> = {
    ON_TRACK: { variant: "positive", label: "On track" },
    AHEAD: { variant: "default", label: "Ahead" },
    BEHIND: { variant: "warning", label: "Behind" },
    COMPLETED: { variant: "outline", label: "Completed" },
};

// ── Form state ───────────────────────────────────────────────
interface GoalForm {
    name: string;
    type: GoalType;
    targetAmount: string;
    currentAmount: string;
    deadline: string;
    monthlyContribution: string;
    priority: GoalPriority;
}

const emptyForm: GoalForm = {
    name: "",
    type: "CUSTOM",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    monthlyContribution: "",
    priority: "MEDIUM",
};

function formFromGoal(goal: Goal): GoalForm {
    return {
        name: goal.name,
        type: goal.type,
        targetAmount: String(goal.targetAmount),
        currentAmount: String(goal.currentAmount),
        deadline: goal.deadline.slice(0, 10),
        monthlyContribution: String(goal.monthlyContribution),
        priority: goal.priority,
    };
}

const inputClass =
    "w-full h-10 px-3 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none";
const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

export default function GoalsPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [form, setForm] = useState<GoalForm>(emptyForm);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const {
        data: goals,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery<Goal[], Error>({
        queryKey: ["goals"],
        queryFn: () => api<Goal[]>("/api/goals"),
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setConfirmingDelete(false);
    };

    const openCreate = () => {
        setEditingGoal(null);
        setForm(emptyForm);
        setConfirmingDelete(false);
        setDialogOpen(true);
    };

    const openEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setForm(formFromGoal(goal));
        setConfirmingDelete(false);
        setDialogOpen(true);
    };

    const saveMutation = useMutation<Goal, Error, GoalPayload>({
        mutationFn: (payload) =>
            editingGoal
                ? api<Goal>(`/api/goals/${editingGoal.id}`, jsonInit("PATCH", payload))
                : api<Goal>("/api/goals", jsonInit("POST", payload)),
        onSuccess: (goal) => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success(editingGoal ? "Goal updated" : "Goal created", {
                description: goal.name,
            });
            closeDialog();
        },
        onError: (err) => {
            toast.error(
                editingGoal ? "Could not update goal" : "Could not create goal",
                { description: err.message },
            );
        },
    });

    const deleteMutation = useMutation<{ id: string; deleted: boolean }, Error, string>({
        mutationFn: (id) => api(`/api/goals/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
            toast.success("Goal deleted");
            closeDialog();
        },
        onError: (err) => {
            toast.error("Could not delete goal", { description: err.message });
        },
    });

    const handleSubmit = () => {
        const name = form.name.trim();
        const targetAmount = Number(form.targetAmount);
        const deadlineDate = new Date(form.deadline);

        if (!name) {
            toast.error("Please give your goal a name");
            return;
        }
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
            toast.error("Target amount must be greater than zero");
            return;
        }
        if (!form.deadline || Number.isNaN(deadlineDate.getTime())) {
            toast.error("Please pick a deadline");
            return;
        }

        saveMutation.mutate({
            name,
            type: form.type,
            targetAmount,
            currentAmount: Number(form.currentAmount) || 0,
            deadline: deadlineDate.toISOString(),
            monthlyContribution: Number(form.monthlyContribution) || 0,
            priority: form.priority,
        });
    };

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Goals"
                description="Map every financial milestone and track your progress with intelligent projections."
                actions={
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Goal
                    </Button>
                }
            />

            {isPending && (
                <WidgetGrid columns={2}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </WidgetGrid>
            )}

            {isError && (
                <Card padding="lg" className="max-w-xl mx-auto text-center">
                    <AlertCircle className="h-8 w-8 text-negative-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                        Couldn&apos;t load your goals
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                        {error.message}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>
                        Try again
                    </Button>
                </Card>
            )}

            {goals && goals.length === 0 && (
                <EmptyState
                    icon={<Target className="h-10 w-10" />}
                    title="No goals yet"
                    description="Set your first financial milestone — retirement, a home, education — and track how your investments carry you toward it."
                    action={
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Create your first goal
                        </Button>
                    }
                />
            )}

            {goals && goals.length > 0 && (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    <WidgetGrid columns={2}>
                        {goals.map((goal) => {
                            const Icon = typeIcons[goal.type] ?? Target;
                            const badge =
                                statusBadge[goal.status] ?? statusBadge.ON_TRACK;
                            const progress = Math.min(
                                Math.max(goal.progress, 0),
                                100,
                            );
                            return (
                                <motion.div key={goal.id} variants={staggerItem}>
                                    <Card
                                        padding="md"
                                        animate
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Edit goal: ${goal.name}`}
                                        className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50"
                                        onClick={() => openEdit(goal)}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                openEdit(goal);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-wealth-600/10 flex items-center justify-center group-hover:bg-wealth-600/20 transition-colors">
                                                    <Icon className="h-5 w-5 text-wealth-400" />
                                                </div>
                                                <div>
                                                    <CardTitle>
                                                        {goal.name}
                                                    </CardTitle>
                                                    <p className="text-xs text-text-tertiary">
                                                        Target:{" "}
                                                        {formatDate(goal.deadline)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={badge.variant}>
                                                {badge.label}
                                            </Badge>
                                        </div>

                                        <div className="flex items-end justify-between mb-3">
                                            <div>
                                                <p className="text-2xl font-bold text-text-primary">
                                                    {formatCurrency(
                                                        goal.currentAmount,
                                                        { compact: true },
                                                    )}
                                                </p>
                                                <p className="text-xs text-text-tertiary">
                                                    of{" "}
                                                    {formatCurrency(
                                                        goal.targetAmount,
                                                        { compact: true },
                                                    )}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-wealth-400">
                                                <AnimatedNumber
                                                    value={progress}
                                                    format={(v) =>
                                                        `${v.toFixed(1)}%`
                                                    }
                                                />
                                            </span>
                                        </div>

                                        <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-wealth-600 to-wealth-400"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${progress}%`,
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    delay: 0.3,
                                                    ease: "easeOut",
                                                }}
                                            />
                                        </div>

                                        {goal.monthlyContribution > 0 && (
                                            <p className="text-xs text-text-tertiary mt-3">
                                                Contributing{" "}
                                                {formatCurrency(
                                                    goal.monthlyContribution,
                                                    { compact: true },
                                                )}
                                                /month
                                            </p>
                                        )}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </WidgetGrid>
                </motion.div>
            )}

            {/* ── Create / Edit dialog ─────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGoal ? "Edit goal" : "New goal"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGoal
                                ? "Adjust the details of this milestone."
                                : "Define a milestone and how you plan to fund it."}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <div>
                            <label htmlFor="goal-name" className={labelClass}>
                                Name
                            </label>
                            <input
                                id="goal-name"
                                type="text"
                                maxLength={500}
                                placeholder="e.g. Retirement corpus"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="goal-type"
                                    className={labelClass}
                                >
                                    Type
                                </label>
                                <select
                                    id="goal-type"
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target.value as GoalType,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    {GOAL_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="goal-priority"
                                    className={labelClass}
                                >
                                    Priority
                                </label>
                                <select
                                    id="goal-priority"
                                    value={form.priority}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            priority: e.target
                                                .value as GoalPriority,
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="goal-target"
                                    className={labelClass}
                                >
                                    Target amount (₹)
                                </label>
                                <input
                                    id="goal-target"
                                    type="number"
                                    min={1}
                                    max={1e12}
                                    placeholder="5000000"
                                    value={form.targetAmount}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            targetAmount: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="goal-current"
                                    className={labelClass}
                                >
                                    Current amount (₹)
                                </label>
                                <input
                                    id="goal-current"
                                    type="number"
                                    min={0}
                                    max={1e12}
                                    placeholder="0"
                                    value={form.currentAmount}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            currentAmount: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="goal-deadline"
                                    className={labelClass}
                                >
                                    Deadline
                                </label>
                                <input
                                    id="goal-deadline"
                                    type="date"
                                    value={form.deadline}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            deadline: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="goal-monthly"
                                    className={labelClass}
                                >
                                    Monthly contribution (₹)
                                </label>
                                <input
                                    id="goal-monthly"
                                    type="number"
                                    min={0}
                                    max={1e12}
                                    placeholder="0"
                                    value={form.monthlyContribution}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            monthlyContribution: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {confirmingDelete && editingGoal ? (
                            <div className="rounded-lg border border-negative-500/30 bg-negative-500/10 p-4">
                                <p className="text-sm text-text-primary mb-3">
                                    Delete{" "}
                                    <span className="font-semibold">
                                        {editingGoal.name}
                                    </span>
                                    ? This cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setConfirmingDelete(false)
                                        }
                                    >
                                        Keep goal
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        isLoading={deleteMutation.isPending}
                                        onClick={() =>
                                            deleteMutation.mutate(
                                                editingGoal.id,
                                            )
                                        }
                                    >
                                        Delete goal
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <DialogFooter className="mt-2">
                                {editingGoal && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mr-auto text-negative-400 hover:text-negative-300"
                                        onClick={() =>
                                            setConfirmingDelete(true)
                                        }
                                    >
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={closeDialog}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    isLoading={saveMutation.isPending}
                                >
                                    {editingGoal ? "Save changes" : "Create goal"}
                                </Button>
                            </DialogFooter>
                        )}
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
