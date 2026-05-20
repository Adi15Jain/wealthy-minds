"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    SkeletonChart,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { PieChart } from "lucide-react";

export default function AllocationPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Allocation Intelligence"
                description="AI-optimized asset allocation analysis with rebalancing recommendations."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card padding="md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-text-tertiary" />
                            <CardTitle>Current Allocation</CardTitle>
                        </div>
                    </CardHeader>
                    <SkeletonChart />
                </Card>

                <Card padding="md">
                    <CardHeader>
                        <CardTitle>AI-Recommended Allocation</CardTitle>
                    </CardHeader>
                    <SkeletonChart />
                </Card>
            </div>

            <Card className="mt-6" padding="md">
                <CardHeader>
                    <CardTitle>Rebalancing Actions</CardTitle>
                </CardHeader>
                <div className="space-y-3 mt-4">
                    {[
                        {
                            action: "Reduce",
                            asset: "Large Cap Equity",
                            from: "45%",
                            to: "38%",
                            reason: "Over-concentrated",
                        },
                        {
                            action: "Increase",
                            asset: "Debt Funds",
                            from: "15%",
                            to: "22%",
                            reason: "Risk buffer",
                        },
                        {
                            action: "Add",
                            asset: "International Equity",
                            from: "0%",
                            to: "8%",
                            reason: "Geographic diversification",
                        },
                    ].map((item) => (
                        <div
                            key={item.asset}
                            className="flex items-center justify-between p-4 rounded-lg bg-surface-100"
                        >
                            <div>
                                <p className="text-sm font-medium text-text-primary">
                                    {item.asset}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                    {item.reason}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-text-secondary">
                                    {item.from} →{" "}
                                    <span className="font-semibold text-wealth-400">
                                        {item.to}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}
