"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    EmptyState,
    PageHeader,
    Skeleton,
    SkeletonLines,
    toast,
} from "@/components/ui";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { cn, formatDate } from "@/lib/utils";
import { BookOpen, Plus, Calendar, Heart, AlertCircle } from "lucide-react";

// ── API types & client ───────────────────────────────────────
const MOODS = [
    { value: "CONFIDENT", label: "Confident", emoji: "😊" },
    { value: "EXCITED", label: "Excited", emoji: "🤩" },
    { value: "NEUTRAL", label: "Neutral", emoji: "😐" },
    { value: "ANXIOUS", label: "Anxious", emoji: "😰" },
    { value: "FEARFUL", label: "Fearful", emoji: "😨" },
] as const;

type Mood = (typeof MOODS)[number]["value"];

interface JournalEntry {
    id: string;
    title: string;
    content: string;
    mood: Mood;
    tags: string[];
    createdAt: string;
}

interface EntryPayload {
    title: string;
    content: string;
    mood: Mood;
    tags: string[];
}

type ApiEnvelope<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    let envelope: ApiEnvelope<T>;
    try {
        envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
        throw new Error("Unexpected server response");
    }
    if (!envelope.success) throw new Error(envelope.error.message);
    return envelope.data;
}

function jsonInit(method: string, body: unknown): RequestInit {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

function moodMeta(mood: Mood) {
    return MOODS.find((m) => m.value === mood) ?? MOODS[2];
}

function parseTags(raw: string): string[] {
    return raw
        .split(",")
        .map((tag) => tag.trim().slice(0, 30))
        .filter(Boolean)
        .slice(0, 10);
}

const inputClass =
    "w-full h-10 px-3 rounded-lg bg-surface-200 border border-border-subtle focus:border-wealth-500/50 transition-colors text-sm text-text-primary placeholder:text-text-tertiary outline-none";
const labelClass = "block text-sm font-medium text-text-secondary mb-1.5";

export default function JournalPage() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [mood, setMood] = useState<Mood>("NEUTRAL");
    const [tagsInput, setTagsInput] = useState("");
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const {
        data: entries,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery<JournalEntry[], Error>({
        queryKey: ["journal"],
        queryFn: () => api<JournalEntry[]>("/api/journal"),
    });

    const stats = useMemo(() => {
        if (!entries || entries.length === 0) return null;
        const now = new Date();
        const thisMonth = entries.filter((entry) => {
            const d = new Date(entry.createdAt);
            return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
            );
        }).length;

        const counts = new Map<Mood, number>();
        for (const entry of entries) {
            counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
        }
        let topMood: Mood = entries[0].mood;
        let best = 0;
        for (const [value, count] of counts) {
            if (count > best) {
                best = count;
                topMood = value;
            }
        }

        return {
            total: entries.length,
            thisMonth,
            topMood: moodMeta(topMood),
        };
    }, [entries]);

    const closeDialog = () => {
        setDialogOpen(false);
        setConfirmingDelete(false);
    };

    const openCreate = () => {
        setEditingEntry(null);
        setTitle("");
        setContent("");
        setMood("NEUTRAL");
        setTagsInput("");
        setConfirmingDelete(false);
        setDialogOpen(true);
    };

    const openEntry = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setTitle(entry.title);
        setContent(entry.content);
        setMood(entry.mood);
        setTagsInput(entry.tags.join(", "));
        setConfirmingDelete(false);
        setDialogOpen(true);
    };

    const saveMutation = useMutation<JournalEntry, Error, EntryPayload>({
        mutationFn: (payload) =>
            editingEntry
                ? api<JournalEntry>(
                      `/api/journal/${editingEntry.id}`,
                      jsonInit("PATCH", payload),
                  )
                : api<JournalEntry>("/api/journal", jsonInit("POST", payload)),
        onSuccess: (entry) => {
            queryClient.invalidateQueries({ queryKey: ["journal"] });
            toast.success(editingEntry ? "Entry updated" : "Entry saved", {
                description: entry.title,
            });
            closeDialog();
        },
        onError: (err) => {
            toast.error(
                editingEntry
                    ? "Could not update entry"
                    : "Could not save entry",
                { description: err.message },
            );
        },
    });

    const deleteMutation = useMutation<
        { id: string; deleted: boolean },
        Error,
        string
    >({
        mutationFn: (id) => api(`/api/journal/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal"] });
            toast.success("Entry deleted");
            closeDialog();
        },
        onError: (err) => {
            toast.error("Could not delete entry", { description: err.message });
        },
    });

    const handleSubmit = () => {
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        if (!trimmedTitle) {
            toast.error("Please add a title");
            return;
        }
        if (!trimmedContent) {
            toast.error("Please write something first");
            return;
        }
        saveMutation.mutate({
            title: trimmedTitle,
            content: trimmedContent,
            mood,
            tags: parseTags(tagsInput),
        });
    };

    const previewTags = parseTags(tagsInput);

    return (
        <motion.div
            variants={pageTransition}
            initial="initial"
            animate="animate"
        >
            <PageHeader
                title="Financial Journal"
                description="Document your investing decisions, emotional states, and financial reflections. Track your behavioral evolution."
                actions={
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Entry
                    </Button>
                }
            />

            {isPending && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} padding="md">
                                <Skeleton className="h-5 w-48 mb-3" />
                                <SkeletonLines lines={2} />
                            </Card>
                        ))}
                    </div>
                    <div>
                        <Card padding="md">
                            <Skeleton className="h-5 w-28 mb-4" />
                            <SkeletonLines lines={3} />
                        </Card>
                    </div>
                </div>
            )}

            {isError && (
                <Card padding="lg" className="max-w-xl mx-auto text-center">
                    <AlertCircle className="h-8 w-8 text-negative-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-text-primary mb-1">
                        Couldn&apos;t load your journal
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                        {error.message}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => refetch()}>
                        Try again
                    </Button>
                </Card>
            )}

            {entries && entries.length === 0 && (
                <EmptyState
                    icon={<BookOpen className="h-10 w-10" />}
                    title="Your journal is empty"
                    description="Capture your first reflection — what you invested in, why, and how it felt. Future you will thank present you."
                    action={
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Write your first entry
                        </Button>
                    }
                />
            )}

            {entries && entries.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <motion.div
                            className="space-y-4"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            {entries.map((entry) => {
                                const entryMood = moodMeta(entry.mood);
                                return (
                                    <motion.div
                                        key={entry.id}
                                        variants={staggerItem}
                                    >
                                        <Card
                                            padding="md"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Open entry: ${entry.title}`}
                                            className="cursor-pointer hover:border-wealth-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50"
                                            onClick={() => openEntry(entry)}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === "Enter" ||
                                                    event.key === " "
                                                ) {
                                                    event.preventDefault();
                                                    openEntry(entry);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-base font-semibold text-text-primary">
                                                        {entry.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(
                                                                entry.createdAt,
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                                                            <Heart className="h-3 w-3" />
                                                            {entryMood.emoji}{" "}
                                                            {entryMood.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-text-secondary line-clamp-2">
                                                {entry.content}
                                            </p>
                                            {entry.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {entry.tags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>

                    <div>
                        <Card padding="md">
                            <CardHeader>
                                <CardTitle>Journal Stats</CardTitle>
                            </CardHeader>
                            <div className="space-y-3">
                                {[
                                    {
                                        label: "Total Entries",
                                        value: String(stats?.total ?? 0),
                                    },
                                    {
                                        label: "This Month",
                                        value: String(stats?.thisMonth ?? 0),
                                    },
                                    {
                                        label: "Top Mood",
                                        value: stats
                                            ? `${stats.topMood.emoji} ${stats.topMood.label}`
                                            : "—",
                                    },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="flex justify-between"
                                    >
                                        <span className="text-sm text-text-secondary">
                                            {stat.label}
                                        </span>
                                        <span className="text-sm font-medium text-text-primary">
                                            {stat.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── Create / Edit dialog ─────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEntry ? "Edit entry" : "New entry"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEntry
                                ? formatDate(editingEntry.createdAt)
                                : "What happened, and how did it feel?"}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <div>
                            <label htmlFor="entry-title" className={labelClass}>
                                Title
                            </label>
                            <input
                                id="entry-title"
                                type="text"
                                maxLength={500}
                                placeholder="e.g. Q1 portfolio review"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="entry-content"
                                className={labelClass}
                            >
                                Reflection
                            </label>
                            <textarea
                                id="entry-content"
                                rows={5}
                                maxLength={10000}
                                placeholder="Write freely — decisions, doubts, wins…"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={cn(
                                    inputClass,
                                    "h-auto py-2.5 resize-y min-h-28",
                                )}
                            />
                        </div>

                        <fieldset>
                            <legend className={labelClass}>Mood</legend>
                            <div className="flex flex-wrap gap-2">
                                {MOODS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={mood === option.value}
                                        onClick={() => setMood(option.value)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-medium transition-colors cursor-pointer",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wealth-500/50",
                                            mood === option.value
                                                ? "bg-wealth-500/15 text-wealth-400 border-wealth-500/40"
                                                : "bg-surface-200 text-text-secondary border-border-subtle hover:text-text-primary",
                                        )}
                                    >
                                        <span aria-hidden>{option.emoji}</span>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="entry-tags" className={labelClass}>
                                Tags{" "}
                                <span className="text-text-tertiary font-normal">
                                    (comma separated, up to 10)
                                </span>
                            </label>
                            <input
                                id="entry-tags"
                                type="text"
                                placeholder="sip, discipline, market-dip"
                                value={tagsInput}
                                onChange={(e) => setTagsInput(e.target.value)}
                                className={inputClass}
                            />
                            {previewTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {previewTags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {confirmingDelete && editingEntry ? (
                            <div className="rounded-lg border border-negative-500/30 bg-negative-500/10 p-4">
                                <p className="text-sm text-text-primary mb-3">
                                    Delete{" "}
                                    <span className="font-semibold">
                                        {editingEntry.title}
                                    </span>
                                    ? This cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setConfirmingDelete(false)
                                        }
                                    >
                                        Keep entry
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        isLoading={deleteMutation.isPending}
                                        onClick={() =>
                                            deleteMutation.mutate(
                                                editingEntry.id,
                                            )
                                        }
                                    >
                                        Delete entry
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <DialogFooter className="mt-2">
                                {editingEntry && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="mr-auto text-negative-400 hover:text-negative-300"
                                        onClick={() =>
                                            setConfirmingDelete(true)
                                        }
                                    >
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={closeDialog}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    isLoading={saveMutation.isPending}
                                >
                                    {editingEntry
                                        ? "Save changes"
                                        : "Save entry"}
                                </Button>
                            </DialogFooter>
                        )}
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
