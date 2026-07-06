import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign in",
    description:
        "Sign in to WealthyMinds — your AI operating system for personal wealth.",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
