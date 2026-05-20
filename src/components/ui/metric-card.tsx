"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { widgetEntrance } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
    label: string;
    value: number;
    format?: "currency" | "percentage" | "number";
    change?: number;
    changeLabel?: string;
    icon?: LucideIcon;
    trend?: "up" | "down" | "neutral";
    compact?: boolean;
    className?: string;
    delay?: number;
}

export function MetricCard({
    label,
    value,
    format = "currency",
    change,
    changeLabel,
    icon: Icon,
    trend,
    compact = false,
    className,
    delay = 0,
}: MetricCardProps) {
    const formattedValue =
        format === "currency"
            ? formatCurrency(value, { compact })
            : format === "percentage"
              ? formatPercentage(value)
              : value.toLocaleString("en-IN");

    const trendColor =
        trend === "up"
            ? "text-positive-500"
            : trend === "down"
              ? "text-negative-500"
              : "text-text-tertiary";

    return (
        <motion.div
            className={cn(
                "card-surface p-5 flex flex-col gap-3 group",
                className,
            )}
            variants={widgetEntrance}
            initial="hidden"
            animate="visible"
            transition={{ delay }}
        >
            <div className="flex items-center justify-between">
                <span className="metric-label">{label}</span>
                {Icon && (
                    <div className="h-9 w-9 rounded-lg bg-surface-200 flex items-center justify-center group-hover:bg-wealth-600/10 transition-colors">
                        <Icon className="h-4 w-4 text-text-tertiary group-hover:text-wealth-500 transition-colors" />
                    </div>
                )}
            </div>

            <div className="metric-value">{formattedValue}</div>

            {change !== undefined && (
                <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", trendColor)}>
                        {formatPercentage(change)}
                    </span>
                    {changeLabel && (
                        <span className="text-xs text-text-tertiary">
                            {changeLabel}
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    );
}
