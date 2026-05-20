"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    WidgetGrid,
    Card,
    CardTitle,
    SkeletonCard,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { Wallet, Home, Landmark, Car, PiggyBank } from "lucide-react";

const netWorthCategories = [
    { label: "Investments", icon: Wallet, color: "text-wealth-400" },
    { label: "Real Estate", icon: Home, color: "text-accent-500" },
    { label: "Fixed Deposits", icon: Landmark, color: "text-positive-500" },
    { label: "Vehicles", icon: Car, color: "text-text-secondary" },
    { label: "Savings", icon: PiggyBank, color: "text-caution-500" },
];

export default function NetWorthPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Net Worth"
                description="A holistic view of your total financial standing — assets minus liabilities."
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {/* Net Worth headline */}
                <motion.div variants={staggerItem}>
                    <Card padding="lg" className="mb-6 border-gradient">
                        <p className="metric-label mb-2">Total Net Worth</p>
                        <p className="text-4xl font-bold tracking-tight gradient-text">
                            ₹1,24,50,000
                        </p>
                        <p className="text-sm text-positive-500 mt-2">
                            +₹8,20,000 (7.1%) from last quarter
                        </p>
                    </Card>
                </motion.div>

                {/* Categories */}
                <WidgetGrid columns={3}>
                    {netWorthCategories.map((cat) => (
                        <motion.div key={cat.label} variants={staggerItem}>
                            <Card padding="md" animate>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-surface-200 flex items-center justify-center">
                                        <cat.icon
                                            className={`h-5 w-5 ${cat.color}`}
                                        />
                                    </div>
                                    <CardTitle>{cat.label}</CardTitle>
                                </div>
                                <SkeletonCard className="border-0 p-0" />
                            </Card>
                        </motion.div>
                    ))}
                </WidgetGrid>
            </motion.div>
        </motion.div>
    );
}
