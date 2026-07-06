import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-jetbrains-mono",
    weight: ["400", "500", "600"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: {
        default: "WealthyMinds — AI Operating System for Personal Wealth",
        template: "%s · WealthyMinds",
    },
    description:
        "An intelligent operating system for personal wealth. AI-powered portfolio cognition, behavioral intelligence, and disciplined long-term wealth creation.",
    applicationName: "WealthyMinds",
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
        url: "/",
        siteName: "WealthyMinds",
        title: "WealthyMinds — AI Operating System for Personal Wealth",
        description:
            "An intelligent operating system for personal wealth. Portfolio cognition meets behavioral finance.",
        images: [
            {
                url: "/opengraph-image",
                width: 1200,
                height: 630,
                alt: "WealthyMinds — AI Operating System for Personal Wealth",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "WealthyMinds — AI Operating System for Personal Wealth",
        description:
            "An intelligent operating system for personal wealth. Portfolio cognition meets behavioral finance.",
        images: ["/opengraph-image"],
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico", sizes: "32x32" },
        ],
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    // Hex approximation of --color-surface-0: oklch(0.13 0.01 260)
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#05070b" },
        { media: "(prefers-color-scheme: light)", color: "#f8f8fa" },
    ],
    colorScheme: "dark light",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${inter.variable} ${jetbrainsMono.variable}`}
        >
            <body className="relative min-h-screen bg-surface-0">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
