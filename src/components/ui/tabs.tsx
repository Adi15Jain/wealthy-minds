"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";

export interface TabItem {
    value: string;
    label: string;
}

interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    items: TabItem[];
    /** Accessible name for the tablist. */
    "aria-label"?: string;
    className?: string;
}

/**
 * Segmented tabs with an animated active indicator (shared-layout pill).
 * Arrow keys move selection (automatic activation); Home/End jump.
 *
 * <Tabs value={tab} onValueChange={setTab} items={[{ value: "a", label: "A" }]} />
 */
export function Tabs({
    value,
    onValueChange,
    items,
    className,
    "aria-label": ariaLabel,
}: TabsProps) {
    const id = useId();
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const selectByIndex = (index: number) => {
        const item = items[(index + items.length) % items.length];
        onValueChange(item.value);
        tabRefs.current.get(item.value)?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const currentIndex = items.findIndex((item) => item.value === value);
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault();
                selectByIndex(currentIndex + 1);
                break;
            case "ArrowLeft":
                event.preventDefault();
                selectByIndex(currentIndex - 1);
                break;
            case "Home":
                event.preventDefault();
                selectByIndex(0);
                break;
            case "End":
                event.preventDefault();
                selectByIndex(items.length - 1);
                break;
        }
    };

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn(
                "inline-flex items-center gap-1 rounded-lg bg-surface-100 border border-border-subtle p-1",
                className,
            )}
            onKeyDown={handleKeyDown}
        >
            {items.map((item) => {
                const isSelected = item.value === value;
                return (
                    <button
                        key={item.value}
                        ref={(node) => {
                            if (node) tabRefs.current.set(item.value, node);
                            else tabRefs.current.delete(item.value);
                        }}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${item.value}`}
                        aria-selected={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => onValueChange(item.value)}
                        className={cn(
                            "relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                            isSelected
                                ? "text-text-primary"
                                : "text-text-tertiary hover:text-text-secondary",
                        )}
                    >
                        {isSelected && (
                            <motion.span
                                layoutId={`${id}-indicator`}
                                className="absolute inset-0 rounded-md bg-surface-200 border border-border-subtle shadow-sm"
                                transition={transitions.smooth}
                            />
                        )}
                        <span className="relative z-10">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
