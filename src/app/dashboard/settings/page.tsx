"use client";

import { motion } from "framer-motion";
import { PageHeader, Card, CardHeader, CardTitle } from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import {
    Settings as SettingsIcon,
    Moon,
    Bell,
    Shield,
    Database,
    Palette,
    Globe,
} from "lucide-react";

const settingsSections = [
    {
        icon: Palette,
        title: "Appearance",
        description: "Theme, colors, dashboard layout preferences",
    },
    {
        icon: Bell,
        title: "Notifications",
        description: "Email, push, SIP reminders, AI insights alerts",
    },
    {
        icon: Shield,
        title: "Security",
        description: "Password, two-factor authentication, sessions",
    },
    {
        icon: Database,
        title: "Data & Sync",
        description: "Portfolio sync, data export, connected accounts",
    },
    {
        icon: Globe,
        title: "Regional",
        description: "Currency, language, date format, tax regime",
    },
    {
        icon: Moon,
        title: "Privacy",
        description: "Data visibility, analytics sharing, account deletion",
    },
];

export default function SettingsPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Settings"
                description="Configure your WealthyMinds experience."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settingsSections.map((section) => (
                    <Card
                        key={section.title}
                        padding="md"
                        className="cursor-pointer hover:border-wealth-500/30 transition-colors group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-lg bg-surface-200 flex items-center justify-center group-hover:bg-wealth-600/10 transition-colors">
                                <section.icon className="h-5 w-5 text-text-tertiary group-hover:text-wealth-400 transition-colors" />
                            </div>
                            <div>
                                <CardTitle>{section.title}</CardTitle>
                                <p className="text-xs text-text-secondary mt-1">
                                    {section.description}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}
