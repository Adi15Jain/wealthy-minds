"use client";

import { useUIStore } from "@/store";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui";

export function Topbar() {
    const { toggleCommandPalette, notificationCount } = useUIStore();

    return (
        <header className="h-16 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
            {/* Left — Search/Command */}
            <button
                onClick={toggleCommandPalette}
                className="flex items-center gap-3 h-10 px-4 rounded-lg bg-surface-100 border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border-default transition-all duration-200 max-w-md w-full lg:w-96"
            >
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">Search or type a command...</span>
                <div className="ml-auto flex items-center gap-1">
                    <kbd className="hidden sm:inline-flex h-5 px-1.5 items-center rounded border border-border-subtle bg-surface-200 text-[10px] font-mono text-text-tertiary">
                        <Command className="h-3 w-3 mr-0.5" />K
                    </kbd>
                </div>
            </button>

            {/* Right — Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-[18px] w-[18px]" />
                    {notificationCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-wealth-500 ring-2 ring-surface-0" />
                    )}
                </Button>

                {/* User avatar placeholder */}
                <button className="h-8 w-8 rounded-full bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center text-white text-xs font-bold ml-2">
                    A
                </button>
            </div>
        </header>
    );
}
