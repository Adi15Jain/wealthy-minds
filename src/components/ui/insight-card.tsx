"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type InsightSeverity = "info" | "warning" | "action" | "positive";

interface InsightCardProps {
    title: string;
    summary: string;
    severity: InsightSeverity;
    icon?: LucideIcon;
    timestamp?: string;
    isRead?: boolean;
    onClick?: () => void;
    className?: string;
}

const severityStyles: Record<InsightSeverity, string> = {
    info: "border-l-wealth-500 bg-wealth-500/5",
    warning: "border-l-caution-500 bg-caution-500/5",
    action: "border-l-accent-500 bg-accent-500/5",
    positive: "border-l-positive-500 bg-positive-500/5",
};

const severityDot: Record<InsightSeverity, string> = {
    info: "bg-wealth-500",
    warning: "bg-caution-500",
    action: "bg-accent-500",
    positive: "bg-positive-500",
};

export function InsightCard({
    title,
    summary,
    severity,
    icon: Icon,
    timestamp,
    isRead = false,
    onClick,
    className,
}: InsightCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 rounded-xl border-l-4 transition-all duration-200 hover:scale-[1.01] cursor-pointer",
                severityStyles[severity],
                !isRead && "border border-border-subtle",
                isRead && "opacity-70",
                className,
            )}
        >
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-text-secondary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {!isRead && (
                            <span
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    severityDot[severity],
                                )}
                            />
                        )}
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                            {title}
                        </h4>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                        {summary}
                    </p>
                    {timestamp && (
                        <p className="text-xs text-text-tertiary mt-2">
                            {timestamp}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}
