"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Glass Panel ──────────────────────────────────────────────
interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
    intensity?: "light" | "medium" | "strong";
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
    ({ className, intensity = "medium", children, ...props }, ref) => {
        const intensityClasses = {
            light: "glass",
            medium: "glass",
            strong: "glass-strong",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    intensityClasses[intensity],
                    "rounded-xl",
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    },
);
GlassPanel.displayName = "GlassPanel";

// ── Section Wrapper ──────────────────────────────────────────
interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
    as?: "section" | "div" | "article";
}

const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
    ({ className, as: Tag = "section", children, ...props }, ref) => (
        <Tag
            ref={ref as any}
            className={cn("py-section", className)}
            {...props}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </Tag>
    ),
);
SectionWrapper.displayName = "SectionWrapper";

// ── Page Header ──────────────────────────────────────────────
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

function PageHeader({
    title,
    description,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex items-start justify-between mb-8", className)}>
            <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">{actions}</div>
            )}
        </div>
    );
}

// ── Widget Grid ──────────────────────────────────────────────
interface WidgetGridProps extends HTMLAttributes<HTMLDivElement> {
    columns?: 1 | 2 | 3 | 4;
}

function WidgetGrid({
    columns = 3,
    className,
    children,
    ...props
}: WidgetGridProps) {
    const colClasses = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return (
        <div
            className={cn("grid gap-5", colClasses[columns], className)}
            {...props}
        >
            {children}
        </div>
    );
}

// ── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 text-center",
                className,
            )}
        >
            {icon && <div className="mb-4 text-text-tertiary">{icon}</div>}
            <h3 className="text-lg font-semibold text-text-primary mb-2">
                {title}
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-6">
                {description}
            </p>
            {action}
        </div>
    );
}

// ── Badge ────────────────────────────────────────────────────
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "positive" | "negative" | "warning" | "outline";
}

function Badge({ variant = "default", className, ...props }: BadgeProps) {
    const variantClasses = {
        default: "bg-wealth-500/15 text-wealth-400 border-wealth-500/20",
        positive: "bg-positive-500/15 text-positive-400 border-positive-500/20",
        negative: "bg-negative-500/15 text-negative-400 border-negative-500/20",
        warning: "bg-caution-500/15 text-caution-400 border-caution-500/20",
        outline: "bg-transparent text-text-secondary border-border-default",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                variantClasses[variant],
                className,
            )}
            {...props}
        />
    );
}

export {
    GlassPanel,
    SectionWrapper,
    PageHeader,
    WidgetGrid,
    EmptyState,
    Badge,
};
