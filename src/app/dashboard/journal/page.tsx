"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    EmptyState,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { BookOpen, Plus, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui";

export default function JournalPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Financial Journal"
                description="Document your investing decisions, emotional states, and financial reflections. Track your behavioral evolution."
                actions={
                    <Button size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Entry
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {/* Sample entries */}
                    <div className="space-y-4">
                        {[
                            {
                                title: "Q1 Portfolio Review",
                                date: "Mar 28, 2026",
                                mood: "😊 Confident",
                                excerpt:
                                    "Strong quarter with all SIPs executing on time. Portfolio up 12% YTD...",
                            },
                            {
                                title: "Market Correction Response",
                                date: "Feb 15, 2026",
                                mood: "😰 Anxious",
                                excerpt:
                                    "Nifty dropped 5% in two days. Resisted the urge to panic sell. Reminded myself of long-term goals...",
                            },
                            {
                                title: "New Goal: Children's Education",
                                date: "Jan 10, 2026",
                                mood: "😊 Excited",
                                excerpt:
                                    "Started planning for children's higher education fund. Target: ₹80L by 2040...",
                            },
                        ].map((entry) => (
                            <Card
                                key={entry.title}
                                padding="md"
                                className="cursor-pointer hover:border-wealth-500/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-text-primary">
                                            {entry.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {entry.date}
                                            </span>
                                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                                                <Heart className="h-3 w-3" />
                                                {entry.mood}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-2">
                                    {entry.excerpt}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Journal Stats</CardTitle>
                        </CardHeader>
                        <div className="space-y-3">
                            {[
                                { label: "Total Entries", value: "24" },
                                { label: "This Month", value: "3" },
                                { label: "Streak", value: "4 weeks" },
                                { label: "Top Mood", value: "Confident" },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex justify-between"
                                >
                                    <span className="text-sm text-text-secondary">
                                        {stat.label}
                                    </span>
                                    <span className="text-sm font-medium text-text-primary">
                                        {stat.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}
