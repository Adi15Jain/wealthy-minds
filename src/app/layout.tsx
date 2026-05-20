import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "WealthyMinds — AI-Powered Wealth Intelligence",
        template: "%s | WealthyMinds",
    },
    description:
        "An intelligent operating system for personal wealth. AI-powered portfolio cognition, behavioral intelligence, and disciplined long-term wealth creation.",
    keywords: [
        "wealth management",
        "portfolio analytics",
        "AI investing",
        "financial intelligence",
        "SIP tracking",
        "mutual funds",
        "behavioral finance",
        "wealth projection",
    ],
    authors: [{ name: "WealthyMinds" }],
    openGraph: {
        type: "website",
        locale: "en_IN",
        siteName: "WealthyMinds",
        title: "WealthyMinds — AI-Powered Wealth Intelligence",
        description:
            "An intelligent operating system for personal wealth. Portfolio cognition meets behavioral finance.",
    },
    twitter: {
        card: "summary_large_image",
        title: "WealthyMinds — AI-Powered Wealth Intelligence",
        description:
            "An intelligent operating system for personal wealth. Portfolio cognition meets behavioral finance.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="relative min-h-screen bg-surface-0">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
