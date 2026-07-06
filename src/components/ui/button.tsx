"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonHover, buttonTap } from "@/lib/motion";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                primary:
                    "bg-wealth-600 text-white hover:bg-wealth-500 shadow-lg shadow-wealth-600/20",
                secondary:
                    "bg-surface-200 text-text-primary hover:bg-surface-300 border border-border-subtle",
                ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-100",
                outline:
                    "border border-border-default text-text-primary hover:bg-surface-100 hover:border-border-strong",
                danger: "bg-negative-600 text-white hover:bg-negative-500 shadow-lg shadow-negative-600/20",
                accent: "bg-accent-500 text-surface-0 hover:bg-accent-400 shadow-lg shadow-accent-500/20",
                glass: "glass text-text-primary hover:bg-surface-200/60",
            },
            size: {
                sm: "h-8 px-3 text-xs rounded-md",
                md: "h-10 px-4 text-sm",
                lg: "h-12 px-6 text-base",
                xl: "h-14 px-8 text-lg",
                icon: "h-10 w-10",
                "icon-sm": "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

/**
 * Native button attributes minus the handlers whose names collide with
 * framer-motion's MotionProps — lets the same props spread safely into
 * both <button> and <motion.button>.
 */
type SafeButtonAttributes = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

export interface ButtonProps
    extends SafeButtonAttributes, VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    motionless?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, isLoading, motionless, children, ...props },
        ref,
    ) => {
        const classes = cn(buttonVariants({ variant, size, className }));

        if (motionless) {
            return (
                <button
                    ref={ref}
                    className={classes}
                    disabled={isLoading || props.disabled}
                    {...props}
                >
                    {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                            <svg
                                className="animate-spin h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Loading...
                        </span>
                    ) : (
                        children
                    )}
                </button>
            );
        }

        return (
            <motion.button
                ref={ref}
                className={classes}
                disabled={isLoading || props.disabled}
                whileHover={buttonHover}
                whileTap={buttonTap}
                {...props}
            >
                {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Loading...
                    </span>
                ) : (
                    children
                )}
            </motion.button>
        );
    },
);

Button.displayName = "Button";

export { Button, buttonVariants };
