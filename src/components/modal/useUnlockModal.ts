// hooks/useUnlockModal.ts
import { create } from 'zustand';

interface UnlockModalState {
  isOpen: boolean;
  isUnlocked: boolean;
  open: () => void;
  close: () => void;
  unlock: () => void;
}

export const useUnlockModal = create<UnlockModalState>((set) => ({
  isOpen: false,
  isUnlocked: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  // Called after successful email submission
  unlock: () => set({ isUnlocked: true, isOpen: false }),
}));