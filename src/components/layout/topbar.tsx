"use client";

import { useSession } from "next-auth/react";
import { useUIStore } from "@/store";
import { Bell, Command, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export function Topbar() {
    const { toggleCommandPalette, notificationCount, setSidebarMobileOpen } =
        useUIStore();
    const { data: session } = useSession();

    const user = session?.user;
    const initial =
        user?.name?.charAt(0).toUpperCase() ??
        user?.email?.charAt(0).toUpperCase() ??
        "W";

    return (
        <header className="h-16 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6">
            {/* Left — Mobile menu + Search/Command */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    type="button"
                    onClick={() => setSidebarMobileOpen(true)}
                    aria-label="Open navigation menu"
                    className={cn(
                        "lg:hidden h-10 w-10 flex-shrink-0 inline-flex items-center justify-center rounded-lg",
                        "text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                    )}
                >
                    <Menu className="h-5 w-5" aria-hidden />
                </button>

                <button
                    type="button"
                    onClick={toggleCommandPalette}
                    aria-label="Open command palette"
                    className={cn(
                        "flex items-center gap-3 h-10 px-4 rounded-lg bg-surface-100 border border-border-subtle",
                        "text-text-tertiary hover:text-text-secondary hover:border-border-default",
                        "transition-all duration-200 max-w-md w-full lg:w-96",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                    )}
                >
                    <Search className="h-4 w-4 flex-shrink-0" aria-hidden />
                    <span className="text-sm truncate">
                        Search or type a command...
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center rounded border border-border-subtle bg-surface-200 text-[10px] font-mono text-text-tertiary">
                            <Command className="h-3 w-3 mr-0.5" aria-hidden />K
                        </kbd>
                    </span>
                </button>
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <ThemeToggle />

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        notificationCount > 0
                            ? `Notifications (${notificationCount} unread)`
                            : "Notifications"
                    }
                >
                    <Bell className="h-[18px] w-[18px]" aria-hidden />
                    {notificationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-wealth-500 ring-2 ring-surface-0" />
                    )}
                </Button>

                {/* User avatar */}
                <button
                    type="button"
                    aria-label={
                        user?.name ? `Account: ${user.name}` : "Account"
                    }
                    className={cn(
                        "h-8 w-8 rounded-full ml-2 flex-shrink-0 overflow-hidden",
                        "flex items-center justify-center text-white text-xs font-bold",
                        "bg-gradient-to-br from-wealth-500 to-wealth-700",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                    )}
                >
                    {user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.image}
                            alt={user.name ?? "User avatar"}
                            referrerPolicy="no-referrer"
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        initial
                    )}
                </button>
            </div>
        </header>
    );
}
