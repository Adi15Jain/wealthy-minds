"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { sidebarVariants, transitions } from "@/lib/motion";
import { Tooltip } from "@/components/ui/tooltip";
import {
    LayoutDashboard,
    TrendingUp,
    Target,
    Sparkles,
    LineChart,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    Receipt,
    Shield,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Navigation Model ─────────────────────────────────────────
export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
    /** Extra terms for command-palette matching. */
    keywords?: string[];
    /** Only highlight on exact pathname match (for section roots). */
    exact?: boolean;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export const navigation: NavSection[] = [
    {
        title: "Overview",
        items: [
            {
                label: "Dashboard",
                href: ROUTES.DASHBOARD,
                icon: LayoutDashboard,
                keywords: ["home", "overview"],
                exact: true,
            },
        ],
    },
    {
        title: "Intelligence Tools",
        items: [
            {
                label: "SIP Analyzer",
                href: ROUTES.SIP_TRACKING,
                icon: TrendingUp,
                keywords: ["sip", "tracking", "invest"],
            },
            {
                label: "SIP Projections",
                href: ROUTES.WEALTH_PROJECTION,
                icon: LineChart,
                keywords: ["wealth", "projection", "forecast", "growth"],
            },
            {
                label: "Goal Calculator",
                href: ROUTES.GOAL_CALCULATOR,
                icon: Target,
                badge: "NEW",
                keywords: ["reverse sip", "target", "plan"],
            },
            {
                label: "Fund Explorer",
                href: ROUTES.FUND_EXPLORER,
                icon: Grid3X3,
                badge: "NEW",
                keywords: ["mutual funds", "browse", "categories"],
            },
        ],
    },
    {
        title: "Planning Tools",
        items: [
            {
                label: "Tax Calculator",
                href: ROUTES.TAX_CALCULATOR,
                icon: Receipt,
                keywords: ["tax", "capital gains", "ltcg"],
            },
            {
                label: "Risk Profile",
                href: ROUTES.RISK_PROFILE,
                icon: Shield,
                keywords: ["risk", "quiz", "tolerance"],
            },
            {
                label: "AI Chat Teller",
                href: ROUTES.AI_INSIGHTS,
                icon: Sparkles,
                badge: "AI",
                keywords: ["ai", "chat", "insights", "assistant"],
            },
        ],
    },
];

export const bottomNavItems: NavItem[] = [
    {
        label: "Settings",
        href: ROUTES.SETTINGS,
        icon: Settings,
        keywords: ["preferences", "account"],
    },
    {
        label: "Profile",
        href: ROUTES.PROFILE,
        icon: User,
        keywords: ["account", "user"],
    },
];

const allNavItems: NavItem[] = [
    ...navigation.flatMap((section) => section.items),
    ...bottomNavItems,
];

// Mobile bottom bar — explicit hrefs, resolved against the nav model.
const MOBILE_NAV_HREFS: string[] = [
    ROUTES.DASHBOARD,
    ROUTES.SIP_TRACKING,
    ROUTES.WEALTH_PROJECTION,
    ROUTES.AI_INSIGHTS,
    ROUTES.SETTINGS,
];

const mobileNavItems: NavItem[] = MOBILE_NAV_HREFS.map((href) =>
    allNavItems.find((item) => item.href === href),
).filter((item): item is NavItem => item !== undefined);

// ── Helpers ──────────────────────────────────────────────────
export function isActiveRoute(pathname: string, item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// ── Sidebar Component ────────────────────────────────────────
export function Sidebar() {
    const pathname = usePathname();
    const { sidebarExpanded, toggleSidebar } = useUIStore();

    const renderNavLink = (item: NavItem) => {
        const isActive = isActiveRoute(pathname, item);
        const link = (
            <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                    isActive
                        ? "bg-wealth-600/10 text-wealth-400"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-100",
                )}
            >
                {isActive && (
                    <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-wealth-500 rounded-r-full"
                        transition={transitions.smooth}
                    />
                )}
                <item.icon
                    className={cn(
                        "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                        isActive
                            ? "text-wealth-400"
                            : "text-text-tertiary group-hover:text-text-secondary",
                    )}
                    aria-hidden
                />
                <AnimatePresence>
                    {sidebarExpanded && (
                        <motion.span
                            className="whitespace-nowrap"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={transitions.fast}
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>
                {item.badge && sidebarExpanded && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-wealth-600/20 text-wealth-400">
                        {item.badge}
                    </span>
                )}
            </Link>
        );

        // Linear-style detail: label tooltip on collapsed icon links.
        if (!sidebarExpanded) {
            return (
                <Tooltip
                    key={item.href}
                    content={item.label}
                    side="right"
                    wrapperClassName="flex w-full [&>a]:flex-1"
                >
                    {link}
                </Tooltip>
            );
        }
        return link;
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                aria-label="Primary navigation"
                className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface-50 border-r border-border-subtle"
                variants={sidebarVariants}
                animate={sidebarExpanded ? "expanded" : "collapsed"}
                initial={false}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-border-subtle">
                    <Link
                        href={ROUTES.DASHBOARD}
                        className="flex items-center gap-3 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50"
                    >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                                W
                            </span>
                        </div>
                        <AnimatePresence>
                            {sidebarExpanded && (
                                <motion.span
                                    className="font-bold text-text-primary text-base tracking-tight whitespace-nowrap"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={transitions.fast}
                                >
                                    {APP_NAME}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title}>
                            <AnimatePresence>
                                {sidebarExpanded && (
                                    <motion.p
                                        className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary px-3 mb-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={transitions.fast}
                                    >
                                        {section.title}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            <div className="space-y-0.5">
                                {section.items.map(renderNavLink)}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom navigation */}
                <div className="border-t border-border-subtle px-3 py-3 space-y-0.5">
                    {bottomNavItems.map(renderNavLink)}

                    {/* Collapse toggle */}
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        aria-label={
                            sidebarExpanded
                                ? "Collapse sidebar"
                                : "Expand sidebar"
                        }
                        aria-expanded={sidebarExpanded}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full",
                            "text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-all duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                        )}
                    >
                        {sidebarExpanded ? (
                            <ChevronLeft
                                className="h-[18px] w-[18px] flex-shrink-0"
                                aria-hidden
                            />
                        ) : (
                            <ChevronRight
                                className="h-[18px] w-[18px] flex-shrink-0"
                                aria-hidden
                            />
                        )}
                        <AnimatePresence>
                            {sidebarExpanded && (
                                <motion.span
                                    className="whitespace-nowrap"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={transitions.fast}
                                >
                                    Collapse
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Drawer */}
            <MobileDrawer />

            {/* Mobile Bottom Bar */}
            <nav
                aria-label="Primary mobile navigation"
                className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border-subtle"
            >
                <div className="flex items-center justify-around h-16 px-2">
                    {mobileNavItems.map((item) => {
                        const isActive = isActiveRoute(pathname, item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                                    isActive
                                        ? "text-wealth-400"
                                        : "text-text-tertiary",
                                )}
                            >
                                <item.icon className="h-5 w-5" aria-hidden />
                                <span className="text-[10px] font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

// ── Mobile Drawer ────────────────────────────────────────────
function MobileDrawer() {
    const pathname = usePathname();
    const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
    const panelRef = useRef<HTMLElement>(null);

    // Close the drawer on navigation.
    useEffect(() => {
        setSidebarMobileOpen(false);
    }, [pathname, setSidebarMobileOpen]);

    // Escape closes; body scroll locks; focus moves into the drawer.
    useEffect(() => {
        if (!sidebarMobileOpen) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.focus();

        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") setSidebarMobileOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [sidebarMobileOpen, setSidebarMobileOpen]);

    return (
        <AnimatePresence>
            {sidebarMobileOpen && (
                <div className="lg:hidden fixed inset-0 z-[60]">
                    <motion.div
                        className="absolute inset-0 bg-surface-0/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={transitions.fast}
                        onClick={() => setSidebarMobileOpen(false)}
                        aria-hidden
                    />
                    <motion.aside
                        ref={panelRef}
                        aria-label="Navigation menu"
                        tabIndex={-1}
                        className="absolute left-0 top-0 h-full w-72 glass-strong border-r border-border-subtle flex flex-col focus:outline-none"
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={transitions.smooth}
                    >
                        <div className="h-16 flex items-center justify-between px-5 border-b border-border-subtle">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        W
                                    </span>
                                </div>
                                <span className="font-bold text-text-primary text-base tracking-tight">
                                    {APP_NAME}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSidebarMobileOpen(false)}
                                aria-label="Close navigation menu"
                                className={cn(
                                    "h-8 w-8 inline-flex items-center justify-center rounded-lg",
                                    "text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                                )}
                            >
                                <X className="h-4 w-4" aria-hidden />
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                            {[
                                ...navigation,
                                { title: "Account", items: bottomNavItems },
                            ].map((section) => (
                                <div key={section.title}>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary px-3 mb-2">
                                        {section.title}
                                    </p>
                                    <div className="space-y-0.5">
                                        {section.items.map((item) => {
                                            const isActive = isActiveRoute(
                                                pathname,
                                                item,
                                            );
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    aria-current={
                                                        isActive
                                                            ? "page"
                                                            : undefined
                                                    }
                                                    onClick={() =>
                                                        setSidebarMobileOpen(
                                                            false,
                                                        )
                                                    }
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                                                        isActive
                                                            ? "bg-wealth-600/10 text-wealth-400"
                                                            : "text-text-secondary hover:text-text-primary hover:bg-surface-100",
                                                    )}
                                                >
                                                    <item.icon
                                                        className="h-[18px] w-[18px] flex-shrink-0"
                                                        aria-hidden
                                                    />
                                                    {item.label}
                                                    {item.badge && (
                                                        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-wealth-600/20 text-wealth-400">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
