import { create } from 'zustand';

type UIStore = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  isUnitSearchOpen: boolean;
  setUnitSearchOpen: (value: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isFullscreen: false,
  setFullscreen: (value) => set({ isFullscreen: value }),
  isUnitSearchOpen: false,
  setUnitSearchOpen: (value) => set({ isUnitSearchOpen: value }),
}));
