"use client";

/**
 * Shared debounced asset search for the Groww-backed `/api/market/search`
 * endpoint, plus a typed helper for `/api/market/details`.
 *
 * Replaces the copy-pasted debounce/fetch effect previously duplicated across
 * the dashboard, wealth-projection, goal-calculator, and sip-tracking pages.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** One entry returned by GET /api/market/search (see the route's mapper). */
export interface AssetSearchResult {
    id: string;
    name: string;
    symbol: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    sector: string;
}

/**
 * Asset payload returned by GET /api/market/details — Gemini analysis fields
 * merged with live Groww fundamentals (all fundamentals are optional since
 * they only exist for stocks / when the upstream call succeeds).
 */
export interface AssetDetails {
    symbol: string;
    name: string;
    type: "Stock" | "Mutual Fund" | "Bond";
    cagr3y: number;
    cagr5y?: number;
    cagr1y?: number;
    volatility: "Low" | "Medium" | "High";
    volatilityPercent?: number;
    consistency: number;
    drawdown: number;
    sector: string;
    riskLabel?: string;
    aiSummary?: string;
    strengths?: string[];
    risks?: string[];
    recommendation?: string;
    fairValueAssessment?: string;
    sipSuitability?: string;
    // Live Groww fundamentals (stocks only)
    marketCap?: string;
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    roe?: number;
    eps?: number;
    debtToEquity?: number;
    yearHigh?: number;
    yearLow?: number;
    cappedType?: string;
    industryName?: string;
    logoUrl?: string;
    operatingMargin?: number;
    netProfitMargin?: number;
    currentRatio?: number;
    evToEbitda?: number;
}

interface SearchApiResponse {
    success?: boolean;
    content?: AssetSearchResult[];
}

interface DetailsApiResponse {
    success?: boolean;
    data?: AssetDetails;
    message?: string;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export interface UseAssetSearchResult {
    query: string;
    setQuery: (next: string) => void;
    results: AssetSearchResult[];
    isSearching: boolean;
    /** Reset query and results (e.g. after the user picks a result). */
    clear: () => void;
}

/**
 * Debounced (300ms) autocomplete against `/api/market/search?q=`.
 * Queries shorter than 2 characters are never sent; in-flight requests are
 * aborted when superseded, cleared, or on unmount.
 */
export function useAssetSearch(): UseAssetSearchResult {
    const [query, setQueryState] = useState("");
    const [results, setResults] = useState<AssetSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const setQuery = useCallback((next: string) => {
        setQueryState(next);
        if (next.trim().length < MIN_QUERY_LENGTH) {
            abortRef.current?.abort();
            abortRef.current = null;
            setResults([]);
            setIsSearching(false);
        }
    }, []);

    const clear = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setQueryState("");
        setResults([]);
        setIsSearching(false);
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) return;

        const timer = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            setIsSearching(true);

            try {
                const res = await fetch(
                    `/api/market/search?q=${encodeURIComponent(trimmed)}`,
                    { signal: controller.signal },
                );
                const data = (await res.json()) as SearchApiResponse;
                if (!controller.signal.aborted) {
                    setResults(
                        data.success && Array.isArray(data.content)
                            ? data.content
                            : [],
                    );
                }
            } catch (error) {
                // Stale requests abort by design; only real failures clear results.
                const isAbort =
                    error instanceof DOMException &&
                    error.name === "AbortError";
                if (!isAbort && !controller.signal.aborted) {
                    setResults([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query]);

    // Abort any in-flight request when the consumer unmounts.
    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    return { query, setQuery, results, isSearching, clear };
}

/**
 * Fetch full performance/analysis details for an asset from
 * `/api/market/details`. Throws an Error (with the API's message when
 * available) on any failure, so callers can render a visible error state.
 */
export async function fetchAssetDetails(
    name: string,
    type: string,
    symbol?: string,
    id?: string,
): Promise<AssetDetails> {
    const params = new URLSearchParams({ name, type });
    params.set("symbol", symbol ?? "");
    params.set("id", id ?? "");

    const res = await fetch(`/api/market/details?${params.toString()}`);
    let data: DetailsApiResponse;
    try {
        data = (await res.json()) as DetailsApiResponse;
    } catch {
        throw new Error(
            "Received an invalid response while fetching asset details.",
        );
    }

    if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || "Failed to fetch asset details.");
    }
    return data.data;
}
