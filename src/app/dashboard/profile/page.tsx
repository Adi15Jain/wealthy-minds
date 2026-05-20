"use client";

import { motion } from "framer-motion";
import { PageHeader, Card, CardTitle } from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { Button } from "@/components/ui";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default function ProfilePage() {
    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Profile"
                description="Manage your account details and preferences."
            />

            <div className="max-w-2xl">
                <Card padding="lg">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border-subtle">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-wealth-500 to-wealth-700 flex items-center justify-center text-white text-2xl font-bold">
                            A
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">
                                Adi Jain
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Premium Investor
                            </p>
                        </div>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-5">
                        {[
                            {
                                icon: Mail,
                                label: "Email",
                                value: "adi@example.com",
                            },
                            {
                                icon: Calendar,
                                label: "Member Since",
                                value: "January 2024",
                            },
                            {
                                icon: Shield,
                                label: "Risk Profile",
                                value: "Balanced Growth",
                            },
                            {
                                icon: User,
                                label: "Account Status",
                                value: "Active",
                            },
                        ].map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <row.icon className="h-4 w-4 text-text-tertiary" />
                                    <span className="text-sm text-text-secondary">
                                        {row.label}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-text-primary">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-border-subtle flex gap-3">
                        <Button variant="outline" size="sm">
                            Edit Profile
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-negative-500"
                        >
                            Sign Out
                        </Button>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}
