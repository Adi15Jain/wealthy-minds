"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast";
import { CommandPalette } from "@/components/ui/command-palette";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
                        retry: 2,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            }),
    );

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="data-theme"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange={false}
                >
                    {/* reducedMotion="user" — framer-motion honors the OS-level
                        prefers-reduced-motion setting across every motion component. */}
                    <MotionConfig reducedMotion="user">
                        {children}
                        <ToastViewport />
                        <CommandPalette />
                    </MotionConfig>
                </ThemeProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
