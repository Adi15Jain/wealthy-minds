/**
 * UI state slice — manages global UI state (sidebar, modals, theme).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
    // Sidebar
    sidebarExpanded: boolean;
    sidebarMobileOpen: boolean;

    // Command palette
    commandPaletteOpen: boolean;

    // Modals
    activeModal: string | null;
    modalData: Record<string, unknown> | null;

    // Notifications
    notificationCount: number;

    // Actions
    toggleSidebar: () => void;
    setSidebarExpanded: (expanded: boolean) => void;
    setSidebarMobileOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;
    setCommandPaletteOpen: (open: boolean) => void;
    openModal: (modal: string, data?: Record<string, unknown> | null) => void;
    closeModal: () => void;
    setNotificationCount: (count: number) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarExpanded: true,
            sidebarMobileOpen: false,
            commandPaletteOpen: false,
            activeModal: null,
            modalData: null,
            notificationCount: 0,

            toggleSidebar: () =>
                set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

            setSidebarExpanded: (sidebarExpanded) => set({ sidebarExpanded }),

            setSidebarMobileOpen: (sidebarMobileOpen) =>
                set({ sidebarMobileOpen }),

            toggleCommandPalette: () =>
                set((state) => ({
                    commandPaletteOpen: !state.commandPaletteOpen,
                })),

            setCommandPaletteOpen: (commandPaletteOpen) =>
                set({ commandPaletteOpen }),

            openModal: (activeModal, modalData = null) =>
                set({ activeModal, modalData }),

            closeModal: () => set({ activeModal: null, modalData: null }),

            setNotificationCount: (notificationCount) =>
                set({ notificationCount }),
        }),
        {
            name: "wm-ui",
            partialize: (state) => ({
                sidebarExpanded: state.sidebarExpanded,
            }),
        },
    ),
);
