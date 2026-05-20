"use client";

import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    WidgetGrid,
    MetricCard,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { ShieldAlert, AlertTriangle, Activity, BarChart3 } from "lucide-react";

export default function RiskAnalyticsPage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Risk Analytics"
                description="Deep risk intelligence — volatility, concentration, drawdown analysis, and stress testing."
            />

            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <WidgetGrid columns={4}>
                    <motion.div variants={staggerItem}>
                        <MetricCard
                            label="Risk Score"
                            value={62}
                            format="number"
                            icon={ShieldAlert}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <MetricCard
                            label="Volatility"
                            value={14.2}
                            format="percentage"
                            icon={Activity}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <MetricCard
                            label="Sharpe Ratio"
                            value={1.42}
                            format="number"
                            icon={BarChart3}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <MetricCard
                            label="Max Drawdown"
                            value={-8.5}
                            format="percentage"
                            icon={AlertTriangle}
                            trend="down"
                        />
                    </motion.div>
                </WidgetGrid>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Concentration Risk</CardTitle>
                        </CardHeader>
                        <div className="space-y-4 mt-4">
                            {[
                                {
                                    label: "Top Holding Weight",
                                    value: "18.5%",
                                    risk: "medium",
                                },
                                {
                                    label: "Top 5 Holdings",
                                    value: "52.3%",
                                    risk: "high",
                                },
                                {
                                    label: "HHI Score",
                                    value: "0.08",
                                    risk: "low",
                                },
                                {
                                    label: "Sector Concentration",
                                    value: "IT: 35%",
                                    risk: "high",
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between p-3 rounded-lg bg-surface-100"
                                >
                                    <span className="text-sm text-text-secondary">
                                        {item.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-primary">
                                            {item.value}
                                        </span>
                                        <span
                                            className={`h-2 w-2 rounded-full ${
                                                item.risk === "low"
                                                    ? "bg-positive-500"
                                                    : item.risk === "medium"
                                                      ? "bg-caution-500"
                                                      : "bg-negative-500"
                                            }`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Stress Test Scenarios</CardTitle>
                        </CardHeader>
                        <div className="space-y-4 mt-4">
                            {[
                                {
                                    scenario: "Market Crash (-30%)",
                                    impact: "-₹10.2L",
                                    severity: "high",
                                },
                                {
                                    scenario: "Sector Rotation",
                                    impact: "-₹3.8L",
                                    severity: "medium",
                                },
                                {
                                    scenario: "Interest Rate Hike",
                                    impact: "-₹1.2L",
                                    severity: "low",
                                },
                                {
                                    scenario: "Currency Depreciation",
                                    impact: "-₹0.8L",
                                    severity: "low",
                                },
                            ].map((item) => (
                                <div
                                    key={item.scenario}
                                    className="flex items-center justify-between p-3 rounded-lg bg-surface-100"
                                >
                                    <span className="text-sm text-text-secondary">
                                        {item.scenario}
                                    </span>
                                    <span className="text-sm font-medium text-negative-500">
                                        {item.impact}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
}
