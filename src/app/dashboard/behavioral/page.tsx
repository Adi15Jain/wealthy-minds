"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    WidgetGrid,
    Badge,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

const behavioralMetrics = [
    {
        name: "Investment Discipline",
        score: 92,
        trend: "improving" as const,
        observation: "Consistent SIP execution for 18 months",
    },
    {
        name: "Loss Aversion",
        score: 35,
        trend: "stable" as const,
        observation: "Moderate loss aversion — holding losers 2x longer",
    },
    {
        name: "Recency Bias",
        score: 22,
        trend: "improving" as const,
        observation: "Decisions are less influenced by recent market moves",
    },
    {
        name: "Overconfidence",
        score: 18,
        trend: "declining" as const,
        observation:
            "Recent large lumpsum after market rally suggests overconfidence",
    },
    {
        name: "Patience Score",
        score: 88,
        trend: "improving" as const,
        observation: "Average holding period has increased to 3.2 years",
    },
    {
        name: "Diversification Awareness",
        score: 71,
        trend: "stable" as const,
        observation:
            "Good cross-asset diversification, sector concentration remains",
    },
];

const trendIcons = {
    improving: { icon: TrendingUp, color: "text-positive-500" },
    declining: { icon: TrendingDown, color: "text-negative-500" },
    stable: { icon: Minus, color: "text-text-tertiary" },
};

export default function BehavioralPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Behavioral Analytics"
                description="Understand your investing psychology. Track decision patterns, emotional triggers, and discipline scores."
            />

            {/* Overall Score */}
            <Card padding="lg" className="mb-6 border-gradient">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-wealth-500/20 to-wealth-700/20 flex items-center justify-center">
                        <Brain className="h-10 w-10 text-wealth-400" />
                    </div>
                    <div>
                        <p className="metric-label mb-1">
                            Behavioral Intelligence Score
                        </p>
                        <p className="text-4xl font-bold gradient-text">
                            78 / 100
                        </p>
                        <p className="text-sm text-positive-500 mt-1">
                            +5 points from last month
                        </p>
                    </div>
                </div>
            </Card>

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <WidgetGrid columns={2}>
                    {behavioralMetrics.map((metric) => {
                        const { icon: TrendIcon, color } =
                            trendIcons[metric.trend];
                        return (
                            <motion.div
                                key={metric.name}
                                variants={staggerItem}
                            >
                                <Card padding="md" animate>
                                    <div className="flex items-start justify-between mb-4">
                                        <CardTitle>{metric.name}</CardTitle>
                                        <div className="flex items-center gap-1.5">
                                            <TrendIcon
                                                className={`h-3.5 w-3.5 ${color}`}
                                            />
                                            <Badge
                                                variant={
                                                    metric.trend === "improving"
                                                        ? "positive"
                                                        : metric.trend ===
                                                            "declining"
                                                          ? "negative"
                                                          : "outline"
                                                }
                                            >
                                                {metric.trend}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-3 mb-3">
                                        <span className="text-3xl font-bold text-text-primary">
                                            {metric.score}
                                        </span>
                                        <span className="text-sm text-text-tertiary mb-1">
                                            / 100
                                        </span>
                                    </div>

                                    <div className="h-2 rounded-full bg-surface-200 overflow-hidden mb-3">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-wealth-600 to-wealth-400"
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${metric.score}%`,
                                            }}
                                            transition={{
                                                duration: 1,
                                                delay: 0.3,
                                            }}
                                        />
                                    </div>

                                    <p className="text-xs text-text-secondary">
                                        {metric.observation}
                                    </p>
                                </Card>
                            </motion.div>
                        );
                    })}
                </WidgetGrid>
            </motion.div>
        </motion.div>
    );
}
