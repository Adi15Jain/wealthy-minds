"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { widgetEntrance } from "@/lib/motion";

const cardVariants = cva("rounded-xl transition-all duration-200", {
    variants: {
        variant: {
            default: "card-surface",
            elevated: "card-elevated",
            glass: "glass rounded-xl",
            outline: "border border-border-subtle bg-transparent rounded-xl",
            ghost: "bg-transparent",
            gradient:
                "bg-gradient-to-br from-surface-50 to-surface-100 border border-border-subtle rounded-xl",
        },
        padding: {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        },
    },
    defaultVariants: {
        variant: "default",
        padding: "md",
    },
});

/**
 * Div attributes minus the handlers whose names collide with
 * framer-motion's MotionProps — lets props spread safely into
 * both <div> and <motion.div>.
 */
type SafeDivAttributes = Omit<
    HTMLAttributes<HTMLDivElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

export interface CardProps
    extends SafeDivAttributes, VariantProps<typeof cardVariants> {
    animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        { className, variant, padding, animate = false, children, ...props },
        ref,
    ) => {
        if (animate) {
            return (
                <motion.div
                    ref={ref}
                    className={cn(
                        cardVariants({ variant, padding, className }),
                    )}
                    variants={widgetEntrance}
                    initial="hidden"
                    animate="visible"
                    {...props}
                >
                    {children}
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(cardVariants({ variant, padding, className }))}
                {...props}
            >
                {children}
            </div>
        );
    },
);

Card.displayName = "Card";

// ── Card Sub-components ──────────────────────────────────────
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center justify-between mb-4", className)}
            {...props}
        />
    ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-base font-semibold text-text-primary", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-text-tertiary", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("", className)} {...props} />
    ),
);
CardContent.displayName = "CardContent";

export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    cardVariants,
};
