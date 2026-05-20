"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    WidgetGrid,
    Card,
    CardHeader,
    CardTitle,
    SkeletonChart,
    Badge,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { Briefcase, Plus, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui";

export default function PortfolioPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Portfolio"
                description="Deep-dive into your complete portfolio landscape with AI-powered analysis."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Sync
                        </Button>
                        <Button size="sm">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Add Holding
                        </Button>
                    </div>
                }
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* Portfolio summary cards */}
                <WidgetGrid columns={3}>
                    {["Total Invested", "Current Value", "Total Returns"].map(
                        (label) => (
                            <motion.div key={label} variants={staggerItem}>
                                <Card padding="md" animate>
                                    <p className="metric-label mb-2">{label}</p>
                                    <div className="h-8 w-32 rounded bg-surface-200/60 animate-pulse" />
                                </Card>
                            </motion.div>
                        ),
                    )}
                </WidgetGrid>

                {/* Holdings table placeholder */}
                <Card className="mt-6" padding="md">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-text-tertiary" />
                            <CardTitle>Holdings</CardTitle>
                            <Badge>12 assets</Badge>
                        </div>
                    </CardHeader>
                    <SkeletonChart />
                </Card>
            </motion.div>
        </motion.div>
    );
}
