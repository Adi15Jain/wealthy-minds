"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { useUIStore } from "@/store";
import {
    navigation,
    bottomNavItems,
    type NavItem,
} from "@/components/layout/sidebar";
import { useMounted } from "./use-mounted";

// ── Command model ────────────────────────────────────────────
interface CommandGroup {
    title: string;
    items: NavItem[];
}

const COMMAND_GROUPS: CommandGroup[] = [
    ...navigation.map((section) => ({
        title: section.title,
        items: section.items,
    })),
    { title: "Account", items: bottomNavItems },
];

function matches(item: NavItem, query: string): boolean {
    if (!query) return true;
    const haystack = [item.label, item.href, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
    // Every whitespace-separated term must match somewhere.
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => haystack.includes(term));
}

/**
 * Global command palette (⌘K / Ctrl+K).
 * Mounted once in Providers; open state lives in the UI store so the
 * Topbar trigger and the keyboard shortcut share it. Search state lives
 * in the panel, which unmounts on close — so it resets naturally.
 */
export function CommandPalette() {
    const mounted = useMounted();
    const { commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette } =
        useUIStore();

    // Global ⌘K / Ctrl+K shortcut.
    useEffect(() => {
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "k") {
                event.preventDefault();
                toggleCommandPalette();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [toggleCommandPalette]);

    // Body scroll lock while open.
    useEffect(() => {
        if (!commandPaletteOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [commandPaletteOpen]);

    const close = useCallback(
        () => setCommandPaletteOpen(false),
        [setCommandPaletteOpen],
    );

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {commandPaletteOpen && <PalettePanel onClose={close} />}
        </AnimatePresence>,
        document.body,
    );
}

// ── Panel (mounted only while open) ──────────────────────────
function PalettePanel({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const filteredGroups = useMemo(
        () =>
            COMMAND_GROUPS.map((group) => ({
                title: group.title,
                items: group.items.filter((item) => matches(item, query)),
            })).filter((group) => group.items.length > 0),
        [query],
    );

    const flatItems = useMemo(
        () => filteredGroups.flatMap((group) => group.items),
        [filteredGroups],
    );

    const select = useCallback(
        (item: NavItem) => {
            onClose();
            router.push(item.href);
        },
        [onClose, router],
    );

    // Keep the active option visible while arrowing through results.
    useEffect(() => {
        const active = listRef.current?.querySelector('[data-active="true"]');
        active?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                onClose();
                break;
            case "ArrowDown":
                event.preventDefault();
                setActiveIndex((index) =>
                    flatItems.length === 0 ? 0 : (index + 1) % flatItems.length,
                );
                break;
            case "ArrowUp":
                event.preventDefault();
                setActiveIndex((index) =>
                    flatItems.length === 0
                        ? 0
                        : (index - 1 + flatItems.length) % flatItems.length,
                );
                break;
            case "Enter": {
                event.preventDefault();
                const item = flatItems[activeIndex];
                if (item) select(item);
                break;
            }
        }
    };

    let flatIndex = -1;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[18vh]">
            <motion.div
                className="absolute inset-0 bg-surface-0/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transitions.fast}
                onClick={onClose}
                aria-hidden
            />
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="relative z-10 w-full max-w-lg glass-strong rounded-2xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                    opacity: 0,
                    scale: 0.98,
                    y: -8,
                    transition: transitions.fast,
                }}
                transition={transitions.smooth}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 border-b border-border-subtle">
                    <Search
                        className="h-4 w-4 text-text-tertiary flex-shrink-0"
                        aria-hidden
                    />
                    <input
                        autoFocus
                        type="text"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="command-palette-results"
                        aria-activedescendant={
                            flatItems[activeIndex]
                                ? `command-item-${flatItems[activeIndex].href}`
                                : undefined
                        }
                        aria-label="Search commands"
                        placeholder="Where to?"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 h-12 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center rounded border border-border-subtle bg-surface-200 text-[10px] font-mono text-text-tertiary">
                        esc
                    </kbd>
                </div>

                {/* Results */}
                <div
                    ref={listRef}
                    id="command-palette-results"
                    role="listbox"
                    aria-label="Navigation results"
                    className="max-h-[320px] overflow-y-auto py-2"
                >
                    {flatItems.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-text-tertiary">
                            No results for &ldquo;{query}&rdquo;
                        </p>
                    ) : (
                        filteredGroups.map((group) => (
                            <div key={group.title} className="mb-1">
                                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                                    {group.title}
                                </p>
                                {group.items.map((item) => {
                                    flatIndex += 1;
                                    const index = flatIndex;
                                    const isActive = index === activeIndex;
                                    return (
                                        <button
                                            key={item.href}
                                            type="button"
                                            id={`command-item-${item.href}`}
                                            role="option"
                                            aria-selected={isActive}
                                            data-active={isActive}
                                            tabIndex={-1}
                                            onClick={() => select(item)}
                                            onMouseMove={() =>
                                                setActiveIndex(index)
                                            }
                                            className={cn(
                                                "w-[calc(100%-1rem)] mx-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                                                isActive
                                                    ? "bg-surface-200 text-text-primary"
                                                    : "text-text-secondary",
                                            )}
                                        >
                                            <item.icon
                                                className={cn(
                                                    "h-4 w-4 flex-shrink-0",
                                                    isActive
                                                        ? "text-wealth-400"
                                                        : "text-text-tertiary",
                                                )}
                                                aria-hidden
                                            />
                                            <span className="flex-1 truncate">
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-wealth-600/20 text-wealth-400">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {isActive && (
                                                <CornerDownLeft
                                                    className="h-3.5 w-3.5 text-text-tertiary"
                                                    aria-hidden
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border-subtle text-[11px] text-text-tertiary">
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="h-4 px-1 inline-flex items-center rounded border border-border-subtle bg-surface-200 font-mono text-[10px]">
                            ↑↓
                        </kbd>
                        Navigate
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="h-4 px-1 inline-flex items-center rounded border border-border-subtle bg-surface-200 font-mono text-[10px]">
                            ↵
                        </kbd>
                        Open
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
