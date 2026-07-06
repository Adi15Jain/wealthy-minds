"use client";

import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { useMounted } from "./use-mounted";

type TooltipSide = "top" | "right" | "bottom";

interface TooltipProps {
    /** Tooltip body — keep it short. */
    content: ReactNode;
    children: ReactNode;
    /** Preferred placement. Flips automatically when clipped by the viewport. */
    side?: TooltipSide;
    /** Delay in ms before the tooltip opens on hover/focus. */
    delay?: number;
    className?: string;
    /** Class for the inline trigger wrapper (e.g. "flex w-full" for block triggers). */
    wrapperClassName?: string;
}

interface TooltipPosition {
    x: number;
    y: number;
    side: TooltipSide;
}

const GAP = 8;
const EDGE = 12;

function computePosition(rect: DOMRect, side: TooltipSide): TooltipPosition {
    let resolved: TooltipSide = side;

    // Flip when the preferred side would be clipped by the viewport.
    if (side === "top" && rect.top < 48) resolved = "bottom";
    if (side === "bottom" && rect.bottom > window.innerHeight - 48) {
        resolved = "top";
    }
    if (side === "right" && rect.right > window.innerWidth - 160) {
        resolved = "top";
    }

    switch (resolved) {
        case "right":
            return {
                x: rect.right + GAP,
                y: rect.top + rect.height / 2,
                side: resolved,
            };
        case "bottom":
            return {
                x: Math.min(
                    Math.max(rect.left + rect.width / 2, EDGE),
                    window.innerWidth - EDGE,
                ),
                y: rect.bottom + GAP,
                side: resolved,
            };
        case "top":
        default:
            return {
                x: Math.min(
                    Math.max(rect.left + rect.width / 2, EDGE),
                    window.innerWidth - EDGE,
                ),
                y: rect.top - GAP,
                side: resolved,
            };
    }
}

const sideStyles: Record<
    TooltipSide,
    { transform: string; initial: { x?: number; y?: number } }
> = {
    top: { transform: "translate(-50%, -100%)", initial: { y: 4 } },
    bottom: { transform: "translate(-50%, 0)", initial: { y: -4 } },
    right: { transform: "translate(0, -50%)", initial: { x: -4 } },
};

/**
 * Lightweight hover/focus tooltip.
 * Positioned via a portal so it never clips inside overflow containers.
 *
 * Usage: <Tooltip content="Dashboard"><button>…</button></Tooltip>
 */
export function Tooltip({
    content,
    children,
    side = "top",
    delay = 300,
    className,
    wrapperClassName,
}: TooltipProps) {
    const id = useId();
    const mounted = useMounted();
    const triggerRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [position, setPosition] = useState<TooltipPosition | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const open = useCallback(
        (immediate = false) => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(
                () => {
                    const rect = triggerRef.current?.getBoundingClientRect();
                    if (rect) setPosition(computePosition(rect, side));
                },
                immediate ? 0 : delay,
            );
        },
        [delay, side],
    );

    const close = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setPosition(null);
    }, []);

    // Escape dismisses an open tooltip (WCAG 1.4.13).
    useEffect(() => {
        if (!position) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [position, close]);

    const isOpen = position !== null;

    return (
        <>
            <span
                ref={triggerRef}
                className={cn("inline-flex min-w-0", wrapperClassName)}
                onMouseEnter={() => open()}
                onMouseLeave={close}
                onFocus={() => open(true)}
                onBlur={close}
                aria-describedby={isOpen ? id : undefined}
            >
                {children}
            </span>
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {position && (
                            <div
                                key="tooltip"
                                className="fixed z-[120] pointer-events-none"
                                style={{
                                    left: position.x,
                                    top: position.y,
                                    transform:
                                        sideStyles[position.side].transform,
                                }}
                            >
                                <motion.div
                                    id={id}
                                    role="tooltip"
                                    className={cn(
                                        "px-2.5 py-1.5 rounded-md glass-strong shadow-lg",
                                        "text-xs font-medium text-text-primary whitespace-nowrap",
                                        className,
                                    )}
                                    initial={{
                                        opacity: 0,
                                        ...sideStyles[position.side].initial,
                                    }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    exit={{
                                        opacity: 0,
                                        ...sideStyles[position.side].initial,
                                    }}
                                    transition={transitions.fast}
                                >
                                    {content}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
}
