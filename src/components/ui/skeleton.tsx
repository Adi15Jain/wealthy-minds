"use client";

import { cn } from "@/lib/utils";

// ── Skeleton Base ────────────────────────────────────────────
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-surface-200/60",
                className,
            )}
            {...props}
        />
    );
}

// ── Skeleton Card ────────────────────────────────────────────
export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn("card-surface p-6 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
    );
}

// ── Skeleton Chart ───────────────────────────────────────────
export function SkeletonChart({ className }: SkeletonProps) {
    return (
        <div className={cn("card-surface p-6 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <div className="flex items-end gap-2 h-40">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Skeleton Text Lines ──────────────────────────────────────
export function SkeletonLines({
    lines = 3,
    className,
}: SkeletonProps & { lines?: number }) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4"
                    style={{ width: `${70 + Math.random() * 30}%` }}
                />
            ))}
        </div>
    );
}

// ── Skeleton Table ───────────────────────────────────────────
export function SkeletonTable({
    rows = 5,
    cols = 4,
    className,
}: SkeletonProps & { rows?: number; cols?: number }) {
    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex gap-4 pb-3 border-b border-border-subtle">
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} className="h-5 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
