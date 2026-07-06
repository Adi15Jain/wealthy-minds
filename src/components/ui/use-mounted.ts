"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns false during SSR/hydration and true after mount.
 * Implemented with useSyncExternalStore so no setState-in-effect
 * is needed (lint-safe, no cascading render).
 */
export function useMounted(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}
