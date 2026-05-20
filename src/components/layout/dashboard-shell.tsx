"use client";

import { useUIStore } from "@/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { sidebarExpanded } = useUIStore();

    return (
        <div className="min-h-screen bg-surface-0">
            <Sidebar />
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    "lg:ml-[72px]",
                    sidebarExpanded && "lg:ml-[260px]",
                )}
            >
                <Topbar />
                <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
