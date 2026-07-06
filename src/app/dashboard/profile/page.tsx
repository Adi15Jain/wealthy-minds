"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import {
    PageHeader,
    Card,
    CardTitle,
    Button,
    Badge,
    Skeleton,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { Mail, Shield, Target, FileText, LogOut, User } from "lucide-react";

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

async function api<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const envelope = (await response.json()) as ApiEnvelope<T>;
    if (!envelope.success) throw new Error(envelope.error.message);
    return envelope.data;
}

const RISK_LABELS: Record<string, string> = {
    CONSERVATIVE: "Conservative",
    MODERATE: "Moderate",
    BALANCED: "Balanced",
    GROWTH: "Growth",
    AGGRESSIVE: "Aggressive",
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const user = session?.user;

    const { data: risk } = useQuery<{ riskProfile: string | null }, Error>({
        queryKey: ["risk-profile"],
        queryFn: () => api("/api/user/risk-profile"),
    });

    const { data: goals } = useQuery<{ id: string }[], Error>({
        queryKey: ["goals"],
        queryFn: () => api("/api/goals"),
    });

    const { data: reports } = useQuery<{ id: string }[], Error>({
        queryKey: ["reports"],
        queryFn: () => api("/api/reports"),
    });

    const name = user?.name ?? "Investor";
    const email = user?.email ?? "";
    const initial = (name || email || "U").charAt(0).toUpperCase();
    const riskProfile = risk?.riskProfile ?? null;

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate">
            <PageHeader
                title="Profile"
                description="Your account details and investment posture."
            />

            <div className="max-w-2xl space-y-4">
                <Card padding="lg">
                    {/* Avatar & name */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-subtle">
                        {status === "loading" ? (
                            <Skeleton className="h-20 w-20 rounded-2xl" />
                        ) : user?.image ? (
                            <Image
                                src={user.image}
                                alt={name}
                                width={80}
                                height={80}
                                referrerPolicy="no-referrer"
                                className="h-20 w-20 rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center text-white text-2xl font-bold">
                                {initial}
                            </div>
                        )}
                        <div className="min-w-0">
                            {status === "loading" ? (
                                <>
                                    <Skeleton className="h-6 w-40 mb-2" />
                                    <Skeleton className="h-4 w-56" />
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-text-primary truncate">
                                        {name}
                                    </h2>
                                    <p className="text-sm text-text-secondary truncate">
                                        {email}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-5">
                        <InfoRow icon={Mail} label="Email" value={email || "—"} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-text-tertiary" />
                                <span className="text-sm text-text-secondary">
                                    Risk profile
                                </span>
                            </div>
                            {riskProfile ? (
                                <Badge variant="default">
                                    {RISK_LABELS[riskProfile] ?? riskProfile}
                                </Badge>
                            ) : (
                                <Link
                                    href="/dashboard/risk-profile"
                                    className="text-sm font-medium text-wealth-400 hover:text-wealth-300 transition-colors"
                                >
                                    Take the assessment →
                                </Link>
                            )}
                        </div>
                        <InfoRow
                            icon={User}
                            label="Account status"
                            value="Active"
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-border-subtle flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-negative-400 hover:text-negative-300"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            <LogOut className="h-3.5 w-3.5 mr-1.5" />
                            Sign out
                        </Button>
                    </div>
                </Card>

                {/* Quick stats from real data */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/goals">
                        <Card padding="md" animate className="group cursor-pointer h-full">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-wealth-600/10 flex items-center justify-center group-hover:bg-wealth-600/20 transition-colors">
                                    <Target className="h-5 w-5 text-wealth-400" />
                                </div>
                                <div>
                                    <CardTitle>{goals?.length ?? "—"}</CardTitle>
                                    <p className="text-xs text-text-tertiary">
                                        Active goals
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/dashboard/reports">
                        <Card padding="md" animate className="group cursor-pointer h-full">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-wealth-600/10 flex items-center justify-center group-hover:bg-wealth-600/20 transition-colors">
                                    <FileText className="h-5 w-5 text-wealth-400" />
                                </div>
                                <div>
                                    <CardTitle>{reports?.length ?? "—"}</CardTitle>
                                    <p className="text-xs text-text-tertiary">
                                        Saved reports
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-text-tertiary" />
                <span className="text-sm text-text-secondary">{label}</span>
            </div>
            <span className="text-sm font-medium text-text-primary truncate max-w-[60%]">
                {value}
            </span>
        </div>
    );
}
