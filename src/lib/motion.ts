/**
 * Framer Motion animation presets.
 * Premium, calm, cinematic motion system for WealthyMinds.
 *
 * Philosophy: Smooth, intelligent, calm, premium.
 * Avoid: Excessive bouncing, gimmicky effects, noisy animations.
 *
 * Reduced motion: the app is wrapped in
 * `<MotionConfig reducedMotion="user">` (src/components/providers.tsx),
 * so framer-motion automatically disables transform/layout animations for
 * users with `prefers-reduced-motion`. Prefer motion components over
 * hand-rolled CSS animation so this guarantee holds; for imperative or
 * conditional effects (e.g. mounting heavy visuals), gate on
 * `useReducedMotion()` instead.
 */
import type { Variants, Transition } from "framer-motion";

// ── Base Transitions ─────────────────────────────────────────
export const transitions = {
    smooth: {
        type: "spring",
        stiffness: 200,
        damping: 30,
        mass: 0.8,
    } satisfies Transition,

    gentle: {
        type: "spring",
        stiffness: 120,
        damping: 25,
        mass: 1,
    } satisfies Transition,

    cinematic: {
        type: "tween",
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
    } satisfies Transition,

    fast: {
        type: "tween",
        duration: 0.15,
        ease: "easeOut",
    } satisfies Transition,

    calm: {
        type: "tween",
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
    } satisfies Transition,
};

// ── Fade Variants ────────────────────────────────────────────
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: transitions.smooth,
    },
};

// ── Scale Variants ───────────────────────────────────────────
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: transitions.smooth,
    },
};

// ── Stagger Container ────────────────────────────────────────
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: transitions.smooth,
    },
};

// ── Page Transition ──────────────────────────────────────────
export const pageTransition: Variants = {
    initial: { opacity: 0, y: 8 },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            type: "tween",
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: {
            type: "tween",
            duration: 0.2,
            ease: "easeIn",
        },
    },
};

// ── Widget Entrance ──────────────────────────────────────────
export const widgetEntrance: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 180,
            damping: 24,
        },
    },
};

// ── Sidebar Animation ────────────────────────────────────────
export const sidebarVariants: Variants = {
    expanded: {
        width: 260,
        transition: transitions.smooth,
    },
    collapsed: {
        width: 72,
        transition: transitions.smooth,
    },
};

// ── Hover Animations ─────────────────────────────────────────
export const buttonHover = {
    scale: 1.02,
    transition: transitions.fast,
};

export const buttonTap = {
    scale: 0.98,
};

// ── Scroll-linked helpers ────────────────────────────────────
export const scrollFadeUp: Variants = {
    offscreen: { opacity: 0, y: 60 },
    onscreen: {
        opacity: 1,
        y: 0,
        transition: {
            type: "tween",
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

