import { create } from 'zustand';

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  action: string;
}

const DEFAULT_BINDINGS: KeyBinding[] = [
  { key: '1', label: 'Toggle R1 Bypass', action: 'toggle-r1-bypass' },
  { key: '2', label: 'Toggle ACS1 Bypass', action: 'toggle-acs1-bypass' },
  { key: 's', label: 'Toggle R1 Sustain/Latch', action: 'toggle-r1-sustain' },
  { key: 'b', label: 'Toggle ACS1 Boost', action: 'toggle-acs1-boost' },
  { key: 'p', label: 'Toggle Preset Drawer', action: 'toggle-preset-drawer' },
  { key: 'm', label: 'Toggle MIDI Monitor', action: 'toggle-midi-monitor' },
  { key: 's', ctrl: true, label: 'Save Preset', action: 'save-preset' },
  { key: 'a', label: 'A/B Comparison', action: 'toggle-ab-compare' },
];

interface UIState {
  midiMonitorOpen: boolean;
  presetDrawerOpen: boolean;
  settingsOpen: boolean;
  keyBindings: KeyBinding[];

  toggleMidiMonitor: () => void;
  togglePresetDrawer: () => void;
  toggleSettings: () => void;
  setMidiMonitorOpen: (open: boolean) => void;
  setPresetDrawerOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  updateKeyBinding: (action: string, newKey: Partial<KeyBinding>) => void;
  resetKeyBindings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  midiMonitorOpen: false,
  presetDrawerOpen: false,
  settingsOpen: false,
  keyBindings: DEFAULT_BINDINGS,

  toggleMidiMonitor: () => set((s) => ({ midiMonitorOpen: !s.midiMonitorOpen })),
  togglePresetDrawer: () => set((s) => ({ presetDrawerOpen: !s.presetDrawerOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setMidiMonitorOpen: (open) => set({ midiMonitorOpen: open }),
  setPresetDrawerOpen: (open) => set({ presetDrawerOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  updateKeyBinding: (action, newKey) =>
    set((s) => ({
      keyBindings: s.keyBindings.map((b) =>
        b.action === action ? { ...b, ...newKey } : b
      ),
    })),

  resetKeyBindings: () => set({ keyBindings: DEFAULT_BINDINGS }),
}));
