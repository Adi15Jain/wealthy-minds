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
import {
    Target,
    Plus,
    GraduationCap,
    Home,
    Palmtree,
    ShieldCheck,
    Car,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { LucideIcon } from "lucide-react";

interface GoalItem {
    name: string;
    icon: LucideIcon;
    target: string;
    current: string;
    progress: number;
    deadline: string;
    status: "on_track" | "behind" | "ahead";
}

const goals: GoalItem[] = [
    {
        name: "Retirement Corpus",
        icon: ShieldCheck,
        target: "₹5 Cr",
        current: "₹1.2 Cr",
        progress: 24,
        deadline: "2050",
        status: "on_track",
    },
    {
        name: "Children's Education",
        icon: GraduationCap,
        target: "₹80 L",
        current: "₹22 L",
        progress: 27.5,
        deadline: "2040",
        status: "ahead",
    },
    {
        name: "Dream Home",
        icon: Home,
        target: "₹1.5 Cr",
        current: "₹45 L",
        progress: 30,
        deadline: "2032",
        status: "on_track",
    },
    {
        name: "Vacation Fund",
        icon: Palmtree,
        target: "₹5 L",
        current: "₹3.2 L",
        progress: 64,
        deadline: "2027",
        status: "ahead",
    },
    {
        name: "New Car",
        icon: Car,
        target: "₹15 L",
        current: "₹4 L",
        progress: 26.6,
        deadline: "2029",
        status: "behind",
    },
];

const statusBadge: Record<string, "positive" | "negative" | "default"> = {
    on_track: "default",
    behind: "negative",
    ahead: "positive",
};

export default function GoalsPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Goals"
                description="Map every financial milestone and track your progress with intelligent projections."
                actions={
                    <Button size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Goal
                    </Button>
                }
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <WidgetGrid columns={2}>
                    {goals.map((goal) => (
                        <motion.div key={goal.name} variants={staggerItem}>
                            <Card
                                padding="md"
                                animate
                                className="group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-wealth-600/10 flex items-center justify-center group-hover:bg-wealth-600/20 transition-colors">
                                            <goal.icon className="h-5 w-5 text-wealth-400" />
                                        </div>
                                        <div>
                                            <CardTitle>{goal.name}</CardTitle>
                                            <p className="text-xs text-text-tertiary">
                                                Target: {goal.deadline}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={statusBadge[goal.status]}>
                                        {goal.status.replace("_", " ")}
                                    </Badge>
                                </div>

                                <div className="flex items-end justify-between mb-3">
                                    <div>
                                        <p className="text-2xl font-bold text-text-primary">
                                            {goal.current}
                                        </p>
                                        <p className="text-xs text-text-tertiary">
                                            of {goal.target}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-wealth-400">
                                        {goal.progress.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-wealth-600 to-wealth-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${goal.progress}%` }}
                                        transition={{
                                            duration: 1,
                                            delay: 0.3,
                                            ease: "easeOut",
                                        }}
                                    />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </WidgetGrid>
            </motion.div>
        </motion.div>
    );
}
