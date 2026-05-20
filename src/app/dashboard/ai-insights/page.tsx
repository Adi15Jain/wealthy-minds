"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    PageHeader,
    Card,
    CardHeader,
    CardTitle,
    Button,
    Badge,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import {
    Sparkles,
    Send,
    HelpCircle,
    Info,
    RefreshCw,
    User,
    ChevronRight,
    TrendingUp,
    Shield,
} from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const CHAT_SUGGESTIONS = [
    "Compare PPFAS Flexi Cap vs HDFC Midcap Opportunities",
    "What is the best SIP investment strategy for a 15-year horizon?",
    "Analyze the historical performance and volatility of Sovereign Gold Bonds",
    "Should I invest in TCS or UTI Nifty 50 Index Fund for long term?",
];

function AIInsightsPageContent() {
    const searchParams = useSearchParams();
    const initialAsk = searchParams.get("ask");

    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Welcome to **WealthyMinds AI Teller Hub**. I am your personal Wealth Intelligence Teller.\n\nAsk me about any stock, mutual fund, or bond in India or globally, and I will analyze past performance, volatility, and compounding projection limits to give you deep, disciplined insights.",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Trigger initial search from Dashboard URL query
    const initialTriggered = useRef(false);
    useEffect(() => {
        if (initialAsk && !initialTriggered.current) {
            initialTriggered.current = true;
            submitQuestion(initialAsk);
        }
    }, [initialAsk]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const submitQuestion = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setLoading(true);

        try {
            // Build simple conversation history format for API
            const history = messages.slice(1).map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await fetch("/api/ai/insights", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: text,
                    history: history,
                }),
            });

            const data = await response.json();
            if (data.success && data.text) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.text },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "I'm sorry, I was unable to connect to my model. Please verify your internet connection or check API keys.",
                    },
                ]);
            }
        } catch (e) {
            console.error("Chat error", e);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "An unexpected error occurred while communicating with the Teller engine. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitQuestion(inputValue);
    };

    // Advanced, custom Markdown styling parser for premium conversation bubble rendering
    const renderMarkdown = (content: string) => {
        return content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            // Handle Header level 3
            if (trimmed.startsWith("###")) {
                return (
                    <h3 key={idx} className="text-sm font-bold text-text-primary mt-4 mb-2 pb-1 border-b border-border-subtle flex items-center gap-1.5">
                        {trimmed.replace("###", "").trim()}
                    </h3>
                );
            }
            
            // Handle Header level 4 / Bold Section
            if (trimmed.startsWith("####") || trimmed.startsWith("**") && trimmed.endsWith("**")) {
                return (
                    <h4 key={idx} className="text-xs font-bold text-wealth-400 mt-3 mb-1.5">
                        {trimmed.replace(/[#\*]/g, "").trim()}
                    </h4>
                );
            }

            // Handle lists (bullets)
            if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.includes("\n* ") || trimmed.includes("\n- ")) {
                const lines = trimmed.split("\n");
                return (
                    <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
                        {lines.map((line, lIdx) => {
                            const cleanLine = line.replace(/^[\*\-\d\.]\s+/, "").trim();
                            if (!cleanLine) return null;
                            return (
                                <li key={lIdx} className="text-xs text-text-secondary">
                                    {parseInlineStyles(cleanLine)}
                                </li>
                            );
                        })}
                    </ul>
                );
            }

            // Standard paragraphs
            return (
                <p key={idx} className="text-xs leading-relaxed text-text-secondary my-2">
                    {parseInlineStyles(trimmed)}
                </p>
            );
        });
    };

    // Small inline parser for **bold** and `code` texts
    const parseInlineStyles = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={index} className="font-semibold text-text-primary">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code key={index} className="px-1.5 py-0.5 rounded bg-surface-200 text-wealth-400 font-mono text-[10px]">
                        {part.slice(1, -1)}
                    </code>
                );
            }
            return part;
        });
    };

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
            className="flex flex-col h-[calc(100vh-100px)] space-y-4"
        >
            <PageHeader
                title="AI Wealth Chat Teller"
                description="Consult the AI Teller in real-time. Ask conversational questions about mutual funds, SIP trajectories, historical drawdowns, and market risk."
            />

            {/* Split Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Left Suggestions & Stats Pane (1 col) */}
                <div className="hidden lg:flex flex-col space-y-4 col-span-1">
                    <Card padding="md" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4.5 w-4.5 text-wealth-400" />
                            <CardTitle className="text-sm">Ask Intelligent Queries</CardTitle>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            WealthyMinds AI acts as a **Wealth Teller**. We evaluate historical performance, calculate compounding efficiencies, and help pinpoint top-performing long-term SIPs.
                        </p>
                    </Card>

                    <Card padding="md" className="flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <HelpCircle className="h-4.5 w-4.5 text-wealth-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                                    Suggested Questions
                                </span>
                            </div>
                            <div className="space-y-2">
                                {CHAT_SUGGESTIONS.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => submitQuestion(s)}
                                        className="w-full text-left text-xs p-2.5 rounded-lg border border-border-subtle bg-surface-50 hover:bg-wealth-500/5 hover:border-wealth-500/35 text-text-secondary hover:text-wealth-400 transition-all duration-200 flex items-start gap-1.5 group"
                                    >
                                        <ChevronRight className="h-3 w-3 text-text-tertiary group-hover:text-wealth-400 mt-0.5 flex-shrink-0" />
                                        <span>{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border-subtle/50 text-[10px] text-text-tertiary flex items-center gap-1.5 leading-snug">
                            <Shield className="h-4 w-4 text-wealth-400 flex-shrink-0" />
                            <span>Structured analytical system rules apply to prevent advisory liability.</span>
                        </div>
                    </Card>
                </div>

                {/* Main Conversational Terminal (3 cols) */}
                <Card padding="none" className="lg:col-span-3 flex flex-col h-full overflow-hidden border-gradient relative">
                    {/* Header bar */}
                    <div className="px-5 py-3 border-b border-border-subtle bg-surface-100/50 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-positive-500 animate-pulse" />
                            <span className="text-xs font-bold text-text-primary font-mono uppercase tracking-wider">
                                teller_terminal.exe
                            </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold text-text-tertiary">
                            Gemini Flash Active
                        </Badge>
                    </div>

                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => {
                                const isUser = msg.role === "user";
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3`}
                                    >
                                        {/* Avatar indicator */}
                                        {!isUser && (
                                            <div className="h-8 w-8 rounded-full bg-wealth-500/10 border border-wealth-500/20 flex items-center justify-center flex-shrink-0">
                                                <Sparkles className="h-4 w-4 text-wealth-400" />
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3.5 border text-sm ${
                                                isUser
                                                    ? "bg-wealth-500/15 border-wealth-500/40 text-text-primary rounded-tr-none ml-12"
                                                    : "bg-surface-50 border-border-subtle rounded-tl-none mr-12 shadow-sm"
                                            }`}
                                        >
                                            {isUser ? (
                                                <p className="text-xs font-medium text-text-primary leading-relaxed">
                                                    {msg.content}
                                                </p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {renderMarkdown(msg.content)}
                                                </div>
                                            )}
                                        </div>

                                        {isUser && (
                                            <div className="h-8 w-8 rounded-full bg-surface-200 border border-border-subtle flex items-center justify-center flex-shrink-0">
                                                <User className="h-4 w-4 text-text-secondary" />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Typing Loader Indicator */}
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start items-center gap-3"
                            >
                                <div className="h-8 w-8 rounded-full bg-wealth-500/10 border border-wealth-500/20 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-wealth-400 animate-spin" />
                                </div>
                                <div className="bg-surface-50 border border-border-subtle rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="h-1.5 w-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Form Footer Input */}
                    <form
                        onSubmit={handleFormSubmit}
                        className="p-4 border-t border-border-subtle bg-surface-100/50 flex-shrink-0 flex items-center gap-3"
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about mutual funds, SIP calculations, or stock risk profiles..."
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-surface-50 border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:border-wealth-500 focus:outline-none transition-colors shadow-inner"
                        />
                        <Button type="submit" disabled={!inputValue.trim() || loading} size="md" className="shadow-md">
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </form>
                </Card>
            </div>
        </motion.div>
    );
}

export default function AIInsightsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-text-tertiary">Loading AI Chat Teller...</div>}>
            <AIInsightsPageContent />
        </Suspense>
    );
}
