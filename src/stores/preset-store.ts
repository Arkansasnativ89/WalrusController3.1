import { create } from 'zustand';
import type { Preset } from '@/types/preset';
import * as presetService from '@/services/preset-service';

interface PresetState {
  presets: Preset[];
  loading: boolean;
  error: string | null;

  // Actions
  loadPresets: () => Promise<void>;
  loadPresetsByDevice: (deviceId: string) => Promise<void>;
  savePreset: (preset: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  importPresets: (data: unknown) => Promise<number>;
}

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  loading: false,
  error: null,

  loadPresets: async () => {
    set({ loading: true, error: null });
    try {
      const presets = await presetService.getAllPresets();
      set({ presets, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load presets.',
        loading: false,
      });
    }
  },

  loadPresetsByDevice: async (deviceId: string) => {
    set({ loading: true, error: null });
    try {
      const presets = await presetService.getPresetsByDevice(deviceId);
      set({ presets, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load presets.',
        loading: false,
      });
    }
  },

  savePreset: async (preset: Preset) => {
    try {
      await presetService.savePreset(preset);
      const presets = await presetService.getAllPresets();
      set({ presets, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to save preset.' });
    }
  },

  deletePreset: async (id: string) => {
    try {
      await presetService.deletePreset(id);
      set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
        error: null,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to delete preset.' });
    }
  },

  importPresets: async (data: unknown) => {
    try {
      const count = await presetService.importPresets(data);
      const presets = await presetService.getAllPresets();
      set({ presets, error: null });
      return count;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to import presets.' });
      return 0;
    }
  },
}));
