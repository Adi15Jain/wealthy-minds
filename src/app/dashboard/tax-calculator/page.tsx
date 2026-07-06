"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    Badge,
} from "@/components/ui";
import { pageTransition } from "@/lib/motion";
import { formatCurrency } from "@/lib/utils";
import {
    Calculator,
    AlertTriangle,
    Zap,
    Info,
} from "lucide-react";

/**
 * Compact INR formatter delegating to the shared formatCurrency:
 * Cr/L for large values, plain rupees below ₹1L. Handles negatives.
 */
const formatINR = (val: number): string => {
    if (!Number.isFinite(val)) return "—";
    const abs = Math.abs(val);
    const formatted =
        abs >= 100000
            ? formatCurrency(abs, { compact: true })
            : formatCurrency(Math.round(abs), { decimals: 0 });
    return val < 0 ? `-${formatted}` : formatted;
};

type InvestmentType = "equity_mf" | "equity_stock" | "debt_mf" | "elss";

interface TaxRule {
    label: string;
    shortTermPeriod: string;
    stcgRate: number;
    ltcgRate: number;
    ltcgExemption: number;
    ltcgSurcharge: string;
    notes: string[];
}

const TAX_RULES: Record<InvestmentType, TaxRule> = {
    equity_mf: {
        label: "Equity Mutual Fund",
        shortTermPeriod: "< 12 months",
        stcgRate: 20,
        ltcgRate: 12.5,
        ltcgExemption: 125000,
        ltcgSurcharge: "Above ₹1.25 Lakh per year",
        notes: [
            "STCG taxed at 20% (Section 111A) — Budget 2024",
            "LTCG taxed at 12.5% above ₹1.25L exemption — Budget 2024",
            "Holding period > 12 months = Long-Term",
        ],
    },
    equity_stock: {
        label: "Direct Equity (Stocks)",
        shortTermPeriod: "< 12 months",
        stcgRate: 20,
        ltcgRate: 12.5,
        ltcgExemption: 125000,
        ltcgSurcharge: "Above ₹1.25 Lakh per year",
        notes: [
            "Same tax rules as equity mutual funds",
            "STT already paid at time of transaction",
            "LTCG benefit requires STT-paid securities",
        ],
    },
    debt_mf: {
        label: "Debt Mutual Fund",
        shortTermPeriod: "Any holding period",
        stcgRate: 0,
        ltcgRate: 0,
        ltcgExemption: 0,
        ltcgSurcharge: "Added to income, taxed at slab rate",
        notes: [
            "Since April 2023: No LTCG benefit for debt MFs",
            "All gains taxed at your income tax slab rate",
            "No indexation benefit available anymore",
        ],
    },
    elss: {
        label: "ELSS (Tax Saving Fund)",
        shortTermPeriod: "N/A (3Y lock-in)",
        stcgRate: 0,
        ltcgRate: 12.5,
        ltcgExemption: 125000,
        ltcgSurcharge: "Above ₹1.25 Lakh per year",
        notes: [
            "Mandatory 3-year lock-in period",
            "Eligible for Section 80C deduction up to ₹1.5 Lakh",
            "After lock-in, taxed same as equity MF (12.5% LTCG)",
        ],
    },
};

const INCOME_SLABS = [
    { label: "Up to ₹3L (0%)", rate: 0 },
    { label: "₹3L - ₹7L (5%)", rate: 5 },
    { label: "₹7L - ₹10L (10%)", rate: 10 },
    { label: "₹10L - ₹12L (15%)", rate: 15 },
    { label: "₹12L - ₹15L (20%)", rate: 20 },
    { label: "Above ₹15L (30%)", rate: 30 },
];

export default function TaxCalculatorPage() {
    const [investmentType, setInvestmentType] = useState<InvestmentType>("equity_mf");
    const [investedAmount, setInvestedAmount] = useState<number>(500000);
    const [currentValue, setCurrentValue] = useState<number>(800000);
    const [holdingMonths, setHoldingMonths] = useState<number>(18);
    const [incomeSlab, setIncomeSlab] = useState<number>(30);

    const rule = TAX_RULES[investmentType];
    const totalGain = currentValue - investedAmount;
    const isProfit = totalGain > 0;

    // Determine tax
    const isLongTerm = investmentType === "debt_mf" ? false : holdingMonths >= 12;
    const isELSS = investmentType === "elss";

    const calcTax = () => {
        if (!isProfit) return { tax: 0, effectiveRate: 0, postTaxGain: totalGain, postTaxValue: currentValue };

        let tax = 0;

        if (investmentType === "debt_mf") {
            // All gains at slab rate
            tax = totalGain * (incomeSlab / 100);
        } else if (!isLongTerm && !isELSS) {
            // STCG
            tax = totalGain * (rule.stcgRate / 100);
        } else {
            // LTCG with exemption
            const taxableGain = Math.max(0, totalGain - rule.ltcgExemption);
            tax = taxableGain * (rule.ltcgRate / 100);
        }

        const effectiveRate = totalGain > 0 ? (tax / totalGain) * 100 : 0;
        const postTaxGain = totalGain - tax;
        const postTaxValue = investedAmount + postTaxGain;

        return { tax, effectiveRate, postTaxGain, postTaxValue };
    };

    const { tax, effectiveRate, postTaxGain, postTaxValue } = calcTax();

    // Honest STCG→LTCG saving: STCG tax on the full gain minus LTCG tax on
    // the gain AFTER the exemption, clamped at zero.
    const stcgTax = totalGain * (rule.stcgRate / 100);
    const ltcgTaxAfterExemption = Math.max(0, totalGain - rule.ltcgExemption) * (rule.ltcgRate / 100);
    const potentialLtcgSaving = Math.max(0, stcgTax - ltcgTaxAfterExemption);

    // Actual tax saved by the LTCG exemption: only the exempted portion of
    // the REALIZED gain avoids tax.
    const exemptionSaving = Math.min(Math.max(totalGain, 0), rule.ltcgExemption) * (rule.ltcgRate / 100);

    return (
        <motion.div variants={pageTransition} initial="initial" animate="animate" className="space-y-8">
            <PageHeader
                title="Tax Impact Calculator"
                description="Understand LTCG, STCG, and slab-based taxation on your investments. See how taxes affect your real returns before you decide to sell."
            />

            {/* Investment Type Selector */}
            <div className="flex flex-wrap gap-2">
                {(Object.entries(TAX_RULES) as [InvestmentType, TaxRule][]).map(([key, r]) => (
                    <button
                        key={key}
                        onClick={() => setInvestmentType(key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            investmentType === key
                                ? "bg-wealth-500/15 text-wealth-400 border border-wealth-500/30"
                                : "bg-surface-50 text-text-secondary border border-border-subtle hover:bg-surface-100"
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Input Parameters */}
            <Card padding="lg" className="relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-10 -z-10" />
                <CardHeader className="pb-5">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-4.5 w-4.5 text-wealth-400" />
                        <CardTitle>Investment Details</CardTitle>
                    </div>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Amount Invested */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Amount Invested</span>
                            <span className="text-sm font-bold text-wealth-400">{formatINR(investedAmount)}</span>
                        </div>
                        <input type="range" min="10000" max="10000000" step="10000" value={investedAmount}
                            aria-label="Amount invested"
                            onChange={(e) => setInvestedAmount(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                    </div>

                    {/* Current Value */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Current Value</span>
                            <span className="text-sm font-bold text-wealth-400">{formatINR(currentValue)}</span>
                        </div>
                        <input type="range" min="10000" max="20000000" step="10000" value={currentValue}
                            aria-label="Current investment value"
                            onChange={(e) => setCurrentValue(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                    </div>

                    {/* Holding Period */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Holding Period</span>
                            <span className="text-sm font-bold text-wealth-400">
                                {holdingMonths >= 12 ? `${(holdingMonths / 12).toFixed(1)} Years` : `${holdingMonths} Months`}
                            </span>
                        </div>
                        <input type="range" min="1" max="120" step="1" value={holdingMonths}
                            aria-label="Holding period in months"
                            onChange={(e) => setHoldingMonths(Number(e.target.value))}
                            className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-wealth-500" />
                    </div>

                    {/* Income Slab (for debt funds) */}
                    {investmentType === "debt_mf" && (
                        <div className="space-y-2">
                            <label htmlFor="income-slab" className="text-xs font-bold uppercase tracking-wider text-text-secondary block">Your Tax Slab</label>
                            <select
                                id="income-slab"
                                value={incomeSlab}
                                onChange={(e) => setIncomeSlab(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-surface-50 border border-border-subtle text-sm text-text-primary focus:border-wealth-500 focus:outline-none"
                            >
                                {INCOME_SLABS.map(s => (
                                    <option key={s.rate} value={s.rate}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </Card>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pre-Tax Gain */}
                <Card padding="md" className="border-t-2 border-t-blue-500 text-center">
                    <p className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider mb-1">Pre-Tax Gain</p>
                    <p className={`text-2xl font-extrabold ${isProfit ? "text-positive-500" : "text-negative-400"}`}>
                        {isProfit ? "+" : ""}{formatINR(totalGain)}
                    </p>
                    <Badge
                        variant={investmentType === "debt_mf" ? "outline" : isLongTerm ? "positive" : "warning"}
                        className="mt-2 text-[9px]"
                    >
                        {investmentType === "debt_mf" ? "Slab Rate" : isLongTerm ? "Long-Term Capital Gain" : "Short-Term Capital Gain"}
                    </Badge>
                </Card>

                {/* Tax Payable */}
                <Card padding="md" className="border-t-2 border-t-negative-400 text-center">
                    <p className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider mb-1">Tax Payable</p>
                    <p className="text-2xl font-extrabold text-negative-400">
                        {formatINR(tax)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        Effective Rate: <span className="font-bold text-text-secondary">{effectiveRate.toFixed(1)}%</span>
                    </p>
                </Card>

                {/* Post-Tax Gain */}
                <Card padding="md" className="border-t-2 border-t-wealth-500 text-center">
                    <p className="text-[10px] uppercase text-text-tertiary font-bold tracking-wider mb-1">Post-Tax Gain</p>
                    <p className={`text-2xl font-extrabold ${postTaxGain >= 0 ? "text-wealth-400" : "text-negative-400"}`}>
                        {postTaxGain >= 0 ? "+" : ""}{formatINR(postTaxGain)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                        You take home: <span className="font-bold text-text-secondary">{formatINR(postTaxValue)}</span>
                    </p>
                </Card>
            </div>

            {/* Tax Rules Reference */}
            <Card padding="lg">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-wealth-400" />
                        <CardTitle>Tax Rules — {rule.label}</CardTitle>
                        <Badge variant="default" className="text-[9px]">FY 2024-25</Badge>
                    </div>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-surface-50 border border-border-subtle">
                        <p className="text-[9px] uppercase text-text-tertiary font-bold">Short-Term Period</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">{rule.shortTermPeriod}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-50 border border-border-subtle">
                        <p className="text-[9px] uppercase text-text-tertiary font-bold">STCG Rate</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">
                            {investmentType === "debt_mf" ? `Slab (${incomeSlab}%)` : `${rule.stcgRate}%`}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-50 border border-border-subtle">
                        <p className="text-[9px] uppercase text-text-tertiary font-bold">LTCG Rate</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">
                            {investmentType === "debt_mf" ? `Slab (${incomeSlab}%)` : `${rule.ltcgRate}% (above ₹${(rule.ltcgExemption / 100000).toFixed(2)}L)`}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {rule.notes.map((note, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>{note}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Comparison Card */}
            {investmentType !== "debt_mf" && isProfit && (
                <Card padding="md" className="bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/10">
                    <div className="flex items-start gap-3">
                        <Zap className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-text-primary">
                                {holdingMonths < 12 ? "Holding for " + (12 - holdingMonths) + " more months would save you tax" : "You qualify for LTCG rates"}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                {holdingMonths < 12
                                    ? `Converting to LTCG would change your tax from ${rule.stcgRate}% to ${rule.ltcgRate}% (with ₹${(rule.ltcgExemption / 100000).toFixed(2)}L exemption). Potential saving: ${formatINR(potentialLtcgSaving)}.`
                                    : `Your ₹${(rule.ltcgExemption / 100000).toFixed(2)}L LTCG exemption saved you ${formatINR(exemptionSaving)} in taxes.`
                                }
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </motion.div>
    );
}
