/**
 * Auth state slice — manages authentication state globally.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;

    // Actions
    setUser: (user: User) => void;
    setToken: (token: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            token: null,

            setUser: (user) =>
                set({ user, isAuthenticated: true, isLoading: false }),

            setToken: (token) => set({ token }),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    token: null,
                    isLoading: false,
                }),

            setLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: "wm-auth",
            partialize: (state) => ({
                token: state.token,
            }),
        },
    ),
);
