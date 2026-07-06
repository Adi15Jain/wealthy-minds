"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { useMounted } from "./use-mounted";

// ── Store ────────────────────────────────────────────────────
export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
    description?: string;
    /** Auto-dismiss duration in ms. Defaults to 5000. */
    duration?: number;
}

export interface ToastItem {
    id: string;
    variant: ToastVariant;
    message: string;
    description?: string;
    duration: number;
}

interface ToastState {
    toasts: ToastItem[];
    add: (toast: ToastItem) => void;
    dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    add: (toast) =>
        set((state) => ({
            // Keep at most 5 stacked toasts.
            toasts: [...state.toasts, toast].slice(-5),
        })),
    dismiss: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));

let toastCount = 0;

function push(
    variant: ToastVariant,
    message: string,
    options?: ToastOptions,
): string {
    toastCount += 1;
    const id = `toast-${toastCount}`;
    useToastStore.getState().add({
        id,
        variant,
        message,
        description: options?.description,
        duration: options?.duration ?? 5000,
    });
    return id;
}

/**
 * Imperative toast API — usable from any client module:
 *   toast.success("Portfolio saved", { description: "Synced just now" });
 */
export const toast = {
    success: (message: string, options?: ToastOptions) =>
        push("success", message, options),
    error: (message: string, options?: ToastOptions) =>
        push("error", message, options),
    info: (message: string, options?: ToastOptions) =>
        push("info", message, options),
    dismiss: (id: string) => useToastStore.getState().dismiss(id),
};

// ── Presentation ─────────────────────────────────────────────
const variantConfig: Record<
    ToastVariant,
    { icon: LucideIcon; iconClass: string; borderClass: string }
> = {
    success: {
        icon: CheckCircle2,
        iconClass: "text-positive-500",
        borderClass: "border-l-positive-500",
    },
    error: {
        icon: AlertCircle,
        iconClass: "text-negative-500",
        borderClass: "border-l-negative-500",
    },
    info: {
        icon: Info,
        iconClass: "text-accent-400",
        borderClass: "border-l-accent-400",
    },
};

function ToastCard({ item }: { item: ToastItem }) {
    const dismiss = useToastStore((state) => state.dismiss);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const config = variantConfig[item.variant];
    const Icon = config.icon;

    // Auto-dismiss with hover pause (timer restarts on mouse leave).
    useEffect(() => {
        timerRef.current = setTimeout(() => dismiss(item.id), item.duration);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [item.id, item.duration, dismiss]);

    const pause = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const resume = () => {
        pause();
        timerRef.current = setTimeout(() => dismiss(item.id), item.duration);
    };

    return (
        <motion.div
            layout
            role={item.variant === "error" ? "alert" : "status"}
            className={cn(
                "pointer-events-auto w-80 glass-strong rounded-xl border-l-2 shadow-2xl",
                "flex items-start gap-3 p-4",
                config.borderClass,
            )}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, transition: transitions.fast }}
            transition={transitions.smooth}
            onMouseEnter={pause}
            onMouseLeave={resume}
        >
            <Icon
                className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconClass)}
                aria-hidden
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary leading-snug">
                    {item.message}
                </p>
                {item.description && (
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {item.description}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className={cn(
                    "flex-shrink-0 -m-1 p-1 rounded-md text-text-tertiary",
                    "hover:text-text-primary hover:bg-surface-200 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                )}
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </motion.div>
    );
}

/**
 * Global toast outlet — mount once (done in Providers).
 * Renders bottom-right stacked cards via portal.
 */
export function ToastViewport() {
    const toasts = useToastStore((state) => state.toasts);
    const mounted = useMounted();

    if (!mounted) return null;

    return createPortal(
        <div
            aria-live="polite"
            aria-label="Notifications"
            className="fixed bottom-4 right-4 z-[130] flex flex-col items-end gap-2 pointer-events-none"
        >
            <AnimatePresence mode="popLayout">
                {toasts.map((item) => (
                    <ToastCard key={item.id} item={item} />
                ))}
            </AnimatePresence>
        </div>,
        document.body,
    );
}
