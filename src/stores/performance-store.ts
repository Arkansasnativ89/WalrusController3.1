import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/services/storage-service';

export interface SetlistEntry {
  presetId: string;
  songName?: string;
}

export interface Setlist {
  id: string;
  name: string;
  entries: SetlistEntry[];
  createdAt: string;
  modifiedAt: string;
}

interface PerformanceState {
  isPerformanceMode: boolean;
  activeSetlist: Setlist | null;
  currentIndex: number;
  setlists: Setlist[];

  // Actions
  enterPerformanceMode: () => void;
  exitPerformanceMode: () => void;
  setActiveSetlist: (setlist: Setlist) => void;
  nextPreset: () => void;
  previousPreset: () => void;
  goToIndex: (index: number) => void;
}

/** Custom Zustand storage adapter backed by Dexie settings table */
const dexieStorage = {
  getItem: async (name: string) => {
    const row = await db.settings.get(name);
    if (!row) return null;
    return JSON.parse(row.value as string);
  },
  setItem: async (name: string, value: unknown) => {
    await db.settings.put({ key: name, value: JSON.stringify(value) });
  },
  removeItem: async (name: string) => {
    await db.settings.delete(name);
  },
};

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      isPerformanceMode: false,
      activeSetlist: null,
      currentIndex: 0,
      setlists: [],

      enterPerformanceMode: () => set({ isPerformanceMode: true }),
      exitPerformanceMode: () => set({ isPerformanceMode: false }),

      setActiveSetlist: (setlist) => set({ activeSetlist: setlist, currentIndex: 0 }),

      nextPreset: () => {
        const { activeSetlist, currentIndex } = get();
        if (!activeSetlist) return;
        const maxIndex = activeSetlist.entries.length - 1;
        if (currentIndex < maxIndex) {
          set({ currentIndex: currentIndex + 1 });
        }
      },

      previousPreset: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
          set({ currentIndex: currentIndex - 1 });
        }
      },

      goToIndex: (index) => {
        const { activeSetlist } = get();
        if (!activeSetlist) return;
        if (index >= 0 && index < activeSetlist.entries.length) {
          set({ currentIndex: index });
        }
      },
    }),
    {
      name: 'performanceState',
      storage: dexieStorage,
      partialize: (state) => ({
        setlists: state.setlists,
      }) as unknown as PerformanceState,
    },
  ),
);
