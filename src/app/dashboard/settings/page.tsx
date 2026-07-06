"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    PageHeader,
    Card,
    CardTitle,
    Button,
    Tooltip,
    toast,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import {
    Bell,
    Shield,
    Database,
    Palette,
    Globe,
    Monitor,
    Moon,
    Sun,
    Download,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";

// ── API ──────────────────────────────────────────────────────
interface Preferences {
    theme: string;
    currency: string;
    language: string;
    emailNotifs: boolean;
    pushNotifs: boolean;
    sipReminders: boolean;
    goalMilestones: boolean;
    marketAlerts: boolean;
    aiInsightNotifs: boolean;
    dashboardLayout: string[];
}

type NotifKey =
    | "emailNotifs"
    | "pushNotifs"
    | "sipReminders"
    | "goalMilestones"
    | "marketAlerts"
    | "aiInsightNotifs";

const NOTIF_FIELDS: { key: NotifKey; label: string; description: string }[] = [
    { key: "sipReminders", label: "SIP reminders", description: "Nudges before each scheduled instalment" },
    { key: "goalMilestones", label: "Goal milestones", description: "Alerts when a goal crosses a threshold" },
    { key: "aiInsightNotifs", label: "AI insights", description: "New personalized wealth insights" },
    { key: "marketAlerts", label: "Market alerts", description: "Significant moves in your watchlist" },
    { key: "emailNotifs", label: "Email notifications", description: "Receive the above by email" },
    { key: "pushNotifs", label: "Push notifications", description: "Receive the above as push" },
];

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const envelope = (await response.json()) as ApiEnvelope<T>;
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

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const [exporting, setExporting] = useState(false);

    const { data: prefs } = useQuery<Preferences, Error>({
        queryKey: ["preferences"],
        queryFn: () => api("/api/user/preferences"),
    });

    const patchMutation = useMutation<Preferences, Error, Partial<Preferences>, { previous?: Preferences }>({
        mutationFn: (patch) =>
            api<Preferences>("/api/user/preferences", jsonInit("PATCH", patch)),
        onMutate: async (patch) => {
            await queryClient.cancelQueries({ queryKey: ["preferences"] });
            const previous = queryClient.getQueryData<Preferences>(["preferences"]);
            if (previous) {
                queryClient.setQueryData<Preferences>(["preferences"], {
                    ...previous,
                    ...patch,
                });
            }
            return { previous };
        },
        onError: (err, _patch, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["preferences"], context.previous);
            }
            toast.error("Couldn't save preference", { description: err.message });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["preferences"] });
        },
    });

    const handleTheme = (value: string) => {
        setTheme(value);
        patchMutation.mutate({ theme: value });
    };

    const toggleNotif = (key: NotifKey) => {
        if (!prefs) return;
        patchMutation.mutate({ [key]: !prefs[key] } as Partial<Preferences>);
    };

    const exportData = async () => {
        setExporting(true);
        try {
            const [goals, journal, reports, preferences] = await Promise.all([
                api("/api/goals"),
                api("/api/journal"),
                api("/api/reports"),
                api("/api/user/preferences"),
            ]);
            const bundle = {
                exportedAt: new Date().toISOString(),
                goals,
                journal,
                reports,
                preferences,
            };
            const blob = new Blob([JSON.stringify(bundle, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "wealthyminds-export.json";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            toast.success("Data exported");
        } catch (err) {
            toast.error("Export failed", {
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate">
            <PageHeader
                title="Settings"
                description="Configure your WealthyMinds experience."
            />

            <div className="max-w-3xl space-y-4">
                {/* Appearance */}
                <SettingsCard icon={Palette} title="Appearance">
                    <p className="text-sm text-text-secondary mb-4">
                        Choose how WealthyMinds looks. System follows your device.
                    </p>
                    <div
                        role="radiogroup"
                        aria-label="Theme"
                        className="grid grid-cols-3 gap-2 max-w-md"
                    >
                        {THEME_OPTIONS.map((opt) => {
                            const active = (theme ?? "system") === opt.value;
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => handleTheme(opt.value)}
                                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50 ${
                                        active
                                            ? "border-wealth-500/50 bg-wealth-600/10 text-wealth-400"
                                            : "border-border-subtle text-text-secondary hover:border-border-default"
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-xs font-medium">
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </SettingsCard>

                {/* Notifications */}
                <SettingsCard icon={Bell} title="Notifications">
                    <div className="divide-y divide-border-subtle">
                        {NOTIF_FIELDS.map((field) => (
                            <div
                                key={field.key}
                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {field.label}
                                    </p>
                                    <p className="text-xs text-text-tertiary">
                                        {field.description}
                                    </p>
                                </div>
                                <Switch
                                    checked={prefs?.[field.key] ?? false}
                                    disabled={!prefs}
                                    label={field.label}
                                    onChange={() => toggleNotif(field.key)}
                                />
                            </div>
                        ))}
                    </div>
                </SettingsCard>

                {/* Regional */}
                <SettingsCard icon={Globe} title="Regional">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                Currency
                            </p>
                            <p className="text-xs text-text-tertiary">
                                Display currency for all amounts
                            </p>
                        </div>
                        <Tooltip content="More currencies coming soon">
                            <select
                                disabled
                                value="INR"
                                aria-label="Currency"
                                className="h-9 px-3 rounded-lg bg-surface-200 border border-border-subtle text-sm text-text-secondary outline-none cursor-not-allowed"
                            >
                                <option value="INR">₹ INR</option>
                            </select>
                        </Tooltip>
                    </div>
                </SettingsCard>

                {/* Security */}
                <SettingsCard icon={Shield} title="Security">
                    <p className="text-sm text-text-secondary mb-3">
                        Your account is secured through Google sign-in or an
                        email &amp; password. Sessions use encrypted JWTs.
                    </p>
                    <Link
                        href="/auth/forgot-password"
                        className="text-sm font-medium text-wealth-400 hover:text-wealth-300 transition-colors inline-flex items-center gap-1"
                    >
                        Reset password
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </SettingsCard>

                {/* Data */}
                <SettingsCard icon={Database} title="Data">
                    <p className="text-sm text-text-secondary mb-4">
                        Download a complete copy of your goals, journal, reports,
                        and preferences as JSON.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        isLoading={exporting}
                        onClick={exportData}
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export my data
                    </Button>
                </SettingsCard>

                {/* About */}
                <SettingsCard icon={Monitor} title="About">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Version</span>
                        <span className="text-text-primary font-medium tabular-nums">
                            0.1.0
                        </span>
                    </div>
                </SettingsCard>
            </div>
        </motion.div>
    );
}

function SettingsCard({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof Bell;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-surface-200 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-text-tertiary" />
                </div>
                <CardTitle>{title}</CardTitle>
            </div>
            {children}
        </Card>
    );
}

function Switch({
    checked,
    disabled,
    label,
    onChange,
}: {
    checked: boolean;
    disabled?: boolean;
    label: string;
    onChange: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={onChange}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50 disabled:opacity-50 ${
                checked ? "bg-wealth-600" : "bg-surface-300"
            }`}
        >
            <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${
                    checked ? "right-0.5" : "left-0.5"
                }`}
            />
        </button>
    );
}
