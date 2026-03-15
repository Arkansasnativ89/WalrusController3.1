import { create } from 'zustand';
import type { MidiPortInfo, MidiMessage } from '@/types/midi';
import { midiService } from '@/services/midi-service';

const MAX_LOG_MESSAGES = 200;

interface MidiState {
  isSupported: boolean;
  isConnected: boolean;
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
  selectedInputId: string | null;
  selectedOutputId: string | null;
  error: string | null;
  messageLog: MidiMessage[];

  // Actions
  initialize: () => Promise<void>;
  selectInput: (id: string) => void;
  selectOutput: (id: string) => void;
  disconnect: () => void;
  clearLog: () => void;
}

export const useMidiStore = create<MidiState>((set) => ({
  isSupported: midiService.isSupported,
  isConnected: false,
  inputs: [],
  outputs: [],
  selectedInputId: null,
  selectedOutputId: null,
  error: null,
  messageLog: [],

  initialize: async () => {
    if (!midiService.isSupported) {
      set({ error: 'Web MIDI API is not supported in this browser.' });
      return;
    }

    try {
      await midiService.connect();

      midiService.onConnectionChange((inputs, outputs) => {
        set({ inputs, outputs, isConnected: true });
      });

      midiService.onMessage((message) => {
        set((state) => ({
          messageLog: [message, ...state.messageLog].slice(0, MAX_LOG_MESSAGES),
        }));
      });

      const inputs = midiService.getInputs();
      const outputs = midiService.getOutputs();

      // Auto-select the HX Effects output if available
      const hxOutput = outputs.find((o) =>
        o.name?.toLowerCase().includes('hx effects')
      );
      if (hxOutput) {
        try {
          midiService.selectOutput(hxOutput.id);
          set({
            isConnected: true,
            inputs,
            outputs,
            selectedOutputId: hxOutput.id,
            error: null,
          });
        } catch {
          set({ isConnected: true, inputs, outputs, error: null });
        }
      } else {
        set({ isConnected: true, inputs, outputs, error: null });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to initialize MIDI.',
        isConnected: false,
      });
    }
  },

  selectInput: (id: string) => {
    try {
      midiService.selectInput(id);
      set({ selectedInputId: id, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to select input.' });
    }
  },

  selectOutput: (id: string) => {
    try {
      midiService.selectOutput(id);
      set({ selectedOutputId: id, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to select output.' });
    }
  },

  disconnect: () => {
    midiService.disconnect();
    set({
      isConnected: false,
      inputs: [],
      outputs: [],
      selectedInputId: null,
      selectedOutputId: null,
    });
  },

  clearLog: () => set({ messageLog: [] }),
}));
