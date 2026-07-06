"use client";

import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    type KeyboardEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { useMounted } from "./use-mounted";

// ── Context ──────────────────────────────────────────────────
interface DialogContextValue {
    onOpenChange: (open: boolean) => void;
    titleId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error(`<${component}> must be used within <Dialog>`);
    }
    return context;
}

// ── Dialog root ──────────────────────────────────────────────
interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}

/**
 * Controlled modal dialog.
 *
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Confirm</DialogTitle>
 *     </DialogHeader>
 *     …
 *     <DialogFooter>…</DialogFooter>
 *   </DialogContent>
 * </Dialog>
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
    const mounted = useMounted();
    const titleId = useId();

    // Body scroll lock while open.
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    if (!mounted) return null;

    return createPortal(
        <DialogContext.Provider value={{ onOpenChange, titleId }}>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            className="absolute inset-0 bg-surface-0/60 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={transitions.fast}
                            onClick={() => onOpenChange(false)}
                            aria-hidden
                        />
                        {children}
                    </div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>,
        document.body,
    );
}

// ── Dialog content (panel with focus trap) ───────────────────
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface DialogContentProps {
    children: ReactNode;
    className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
    const { onOpenChange, titleId } = useDialogContext("DialogContent");
    const panelRef = useRef<HTMLDivElement>(null);

    // Move focus into the dialog on open; restore it on close.
    useEffect(() => {
        const panel = panelRef.current;
        const previouslyFocused =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const focusables =
            panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusables?.[0] ?? panel)?.focus();

        return () => previouslyFocused?.focus();
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.stopPropagation();
            onOpenChange(false);
            return;
        }

        // Focus trap — loop Tab within the panel.
        if (event.key === "Tab") {
            const panel = panelRef.current;
            if (!panel) return;
            const focusables = Array.from(
                panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            );
            if (focusables.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;

            if (event.shiftKey && (active === first || active === panel)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    return (
        <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
                "relative z-10 w-full max-w-md glass-strong rounded-2xl p-6 shadow-2xl",
                "focus:outline-none",
                className,
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
                opacity: 0,
                scale: 0.97,
                y: 8,
                transition: transitions.fast,
            }}
            transition={transitions.smooth}
            onKeyDown={handleKeyDown}
        >
            {children}
        </motion.div>
    );
}

// ── Sub-components ───────────────────────────────────────────
interface DialogSectionProps {
    children: ReactNode;
    className?: string;
}

export function DialogHeader({ children, className }: DialogSectionProps) {
    return <div className={cn("mb-4 space-y-1.5", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: DialogSectionProps) {
    const { titleId } = useDialogContext("DialogTitle");
    return (
        <h2
            id={titleId}
            className={cn(
                "text-lg font-semibold text-text-primary tracking-tight",
                className,
            )}
        >
            {children}
        </h2>
    );
}

export function DialogDescription({
    children,
    className,
}: DialogSectionProps) {
    return (
        <p className={cn("text-sm text-text-secondary", className)}>
            {children}
        </p>
    );
}

export function DialogFooter({ children, className }: DialogSectionProps) {
    return (
        <div
            className={cn(
                "mt-6 flex items-center justify-end gap-3",
                className,
            )}
        >
            {children}
        </div>
    );
}
