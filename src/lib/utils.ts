import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with intelligent conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 */
export function formatCurrency(
    amount: number,
    options?: { compact?: boolean; decimals?: number },
): string {
    const { compact = false, decimals = 2 } = options ?? {};

    if (compact) {
        if (amount >= 1_00_00_000) {
            return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
        }
        if (amount >= 1_00_000) {
            return `₹${(amount / 1_00_000).toFixed(1)}L`;
        }
        if (amount >= 1_000) {
            return `₹${(amount / 1_000).toFixed(1)}K`;
        }
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

/**
 * Format a percentage value.
 */
export function formatPercentage(value: number, decimals = 2): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format a date to locale string.
 */
export function formatDate(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions,
): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options,
    });
}

/**
 * Generate a unique ID for client-side use.
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Delay execution for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a value between a minimum and maximum.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Safely parse JSON with a fallback.
 */
export function safeJsonParse<T>(value: string, fallback: T): T {
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}
