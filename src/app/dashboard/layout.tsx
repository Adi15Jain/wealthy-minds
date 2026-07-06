import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Your wealth intelligence command center.",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardShell>{children}</DashboardShell>;
}
