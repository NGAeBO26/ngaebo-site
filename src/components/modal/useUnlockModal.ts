// components/modal/useUnlockModal.ts
import { create } from "zustand";

const STORAGE_KEY = "trailmap_unlocked_v1";

interface UnlockModalState {
  isOpen: boolean;
  isUnlocked: boolean;
  open: () => void;
  close: () => void;
  unlock: () => void;
}

export const useUnlockModal = create<UnlockModalState>((set) => ({
  isOpen: false,
  isUnlocked: localStorage.getItem(STORAGE_KEY) === "1",

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  unlock: () => {
    localStorage.setItem(STORAGE_KEY, "1");
    set({ isUnlocked: true, isOpen: false });
  },
}));
