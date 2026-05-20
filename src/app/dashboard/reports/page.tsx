"use client";

import { motion } from "framer-motion";
import { PageHeader, Card, CardTitle, EmptyState } from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui";

export default function ReportsPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Reports"
                description="Generate and download comprehensive portfolio reports, tax statements, and performance summaries."
                actions={
                    <Button size="sm">
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Generate Report
                    </Button>
                }
            />

            <div className="space-y-4">
                {[
                    {
                        title: "Monthly Portfolio Summary — May 2026",
                        date: "May 1, 2026",
                        type: "Monthly",
                    },
                    {
                        title: "Q1 2026 Performance Report",
                        date: "Apr 1, 2026",
                        type: "Quarterly",
                    },
                    {
                        title: "FY 2025-26 Tax Report",
                        date: "Mar 31, 2026",
                        type: "Annual",
                    },
                    {
                        title: "Monthly Portfolio Summary — April 2026",
                        date: "Apr 1, 2026",
                        type: "Monthly",
                    },
                ].map((report) => (
                    <Card
                        key={report.title}
                        padding="md"
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-surface-200 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-text-tertiary" />
                            </div>
                            <div>
                                <CardTitle>{report.title}</CardTitle>
                                <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {report.date} · {report.type}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                        </Button>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}
