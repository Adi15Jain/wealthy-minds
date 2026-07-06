"use client";

import { useEffect } from "react";
import {
    motion,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
    /** Target value — the component smoothly interpolates on change. */
    value: number;
    /** Formats the interpolated value for display. Defaults to en-IN locale integer. */
    format?: (value: number) => string;
    className?: string;
}

const defaultFormat = (value: number): string =>
    Math.round(value).toLocaleString("en-IN");

/**
 * Smoothly animated numeric display for metrics.
 * Uses a spring so value changes glide instead of jumping.
 * Renders with tabular-nums to prevent layout shift between frames.
 */
export function AnimatedNumber({
    value,
    format = defaultFormat,
    className,
}: AnimatedNumberProps) {
    const prefersReducedMotion = useReducedMotion();

    const spring = useSpring(value, {
        stiffness: 90,
        damping: 24,
        mass: 0.6,
    });

    const display = useTransform(spring, (latest) => format(latest));

    useEffect(() => {
        if (prefersReducedMotion) {
            spring.jump(value);
        } else {
            spring.set(value);
        }
    }, [spring, value, prefersReducedMotion]);

    return (
        <motion.span className={cn("tabular-nums", className)}>
            {display}
        </motion.span>
    );
}
