"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { sidebarVariants, transitions } from "@/lib/motion";
import {
    LayoutDashboard,
    Briefcase,
    TrendingUp,
    Target,
    ShieldAlert,
    PieChart,
    Sparkles,
    BookOpen,
    LineChart,
    Brain,
    FileText,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Navigation Items ─────────────────────────────────────────
interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        title: "Overview",
        items: [
            {
                label: "Dashboard",
                href: ROUTES.DASHBOARD,
                icon: LayoutDashboard,
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
            },
            {
                label: "SIP Projections",
                href: ROUTES.WEALTH_PROJECTION,
                icon: LineChart,
            },
            {
                label: "AI Chat Teller",
                href: ROUTES.AI_INSIGHTS,
                icon: Sparkles,
                badge: "AI",
            },
        ],
    },
];

const bottomNavItems: NavItem[] = [
    { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
    { label: "Profile", href: ROUTES.PROFILE, icon: User },
];

// ── Sidebar Component ────────────────────────────────────────
export function Sidebar() {
    const pathname = usePathname();
    const { sidebarExpanded, toggleSidebar } = useUIStore();

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface-50 border-r border-border-subtle"
                variants={sidebarVariants}
                animate={sidebarExpanded ? "expanded" : "collapsed"}
                initial={false}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-5 border-b border-border-subtle">
                    <Link
                        href={ROUTES.DASHBOARD}
                        className="flex items-center gap-3 min-w-0"
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
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                                isActive
                                                    ? "bg-wealth-600/10 text-wealth-400"
                                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-100",
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-active"
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-wealth-500 rounded-r-full"
                                                    transition={
                                                        transitions.smooth
                                                    }
                                                />
                                            )}
                                            <item.icon
                                                className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                                                    isActive
                                                        ? "text-wealth-400"
                                                        : "text-text-tertiary group-hover:text-text-secondary",
                                                )}
                                            />
                                            <AnimatePresence>
                                                {sidebarExpanded && (
                                                    <motion.span
                                                        className="whitespace-nowrap"
                                                        initial={{
                                                            opacity: 0,
                                                            width: 0,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            width: "auto",
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            width: 0,
                                                        }}
                                                        transition={
                                                            transitions.fast
                                                        }
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
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom navigation */}
                <div className="border-t border-border-subtle px-3 py-3 space-y-0.5">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-wealth-600/10 text-wealth-400"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface-100",
                                )}
                            >
                                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                <AnimatePresence>
                                    {sidebarExpanded && (
                                        <motion.span
                                            className="whitespace-nowrap"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{
                                                opacity: 1,
                                                width: "auto",
                                            }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={transitions.fast}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}

                    {/* Collapse toggle */}
                    <button
                        onClick={toggleSidebar}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-all duration-200 w-full"
                    >
                        {sidebarExpanded ? (
                            <ChevronLeft className="h-[18px] w-[18px] flex-shrink-0" />
                        ) : (
                            <ChevronRight className="h-[18px] w-[18px] flex-shrink-0" />
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

            {/* Mobile Bottom Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border-subtle">
                <div className="flex items-center justify-around h-16 px-2">
                    {[
                        navigation[0].items[0], // Dashboard
                        navigation[1].items[0], // SIP Analyzer
                        navigation[1].items[1], // SIP Projections
                        navigation[1].items[2], // AI Chat Teller
                        bottomNavItems[0], // Settings
                    ].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                                    isActive
                                        ? "text-wealth-400"
                                        : "text-text-tertiary",
                                )}
                            >
                                <item.icon className="h-5 w-5" />
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
