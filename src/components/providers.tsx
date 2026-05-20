"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";

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
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="data-theme"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange={false}
            >
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}
