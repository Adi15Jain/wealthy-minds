"use client";

import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { Tooltip } from "./tooltip";
import { useMounted } from "./use-mounted";

type ThemeMode = "dark" | "light" | "system";

const CYCLE: Record<ThemeMode, ThemeMode> = {
    dark: "light",
    light: "system",
    system: "dark",
};

const ICONS: Record<ThemeMode, LucideIcon> = {
    dark: Moon,
    light: Sun,
    system: Monitor,
};

const LABELS: Record<ThemeMode, string> = {
    dark: "Dark",
    light: "Light",
    system: "System",
};

function isThemeMode(value: string | undefined): value is ThemeMode {
    return value === "dark" || value === "light" || value === "system";
}

/**
 * Theme cycle button (dark → light → system) with animated icon crossfade.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();

    const mode: ThemeMode = isThemeMode(theme) ? theme : "dark";
    const Icon = ICONS[mode];

    const buttonClasses = cn(
        "h-10 w-10 inline-flex items-center justify-center rounded-lg",
        "text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
        className,
    );

    // Avoid hydration mismatch — theme is unknown until mounted.
    if (!mounted) {
        return (
            <button
                type="button"
                aria-label="Toggle theme"
                className={buttonClasses}
                disabled
            >
                <Moon className="h-[18px] w-[18px]" aria-hidden />
            </button>
        );
    }

    return (
        <Tooltip content={`Theme: ${LABELS[mode]}`}>
            <button
                type="button"
                onClick={() => setTheme(CYCLE[mode])}
                aria-label={`Switch theme (current: ${LABELS[mode]})`}
                className={buttonClasses}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={mode}
                        className="inline-flex"
                        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                        transition={transitions.fast}
                    >
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </motion.span>
                </AnimatePresence>
            </button>
        </Tooltip>
    );
}
