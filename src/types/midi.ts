// MIDI status byte constants
export const MIDI_STATUS = {
  NOTE_OFF: 0x80,
  NOTE_ON: 0x90,
  POLY_PRESSURE: 0xa0,
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
  CHANNEL_PRESSURE: 0xd0,
  PITCH_BEND: 0xe0,
  SYSTEM: 0xf0,
} as const;

export type MidiStatusType = (typeof MIDI_STATUS)[keyof typeof MIDI_STATUS];

export interface MidiMessage {
  /** Raw status byte */
  status: number;
  /** MIDI channel (0-15) */
  channel: number;
  /** Data byte 1 (CC number, note number, program number, etc.) */
  data1: number;
  /** Data byte 2 (value, velocity, etc.) — undefined for Program Change */
  data2?: number;
  /** Timestamp from performance.now() */
  timestamp: number;
  /** Direction of the message */
  direction: 'in' | 'out';
}

export interface MidiControlChange {
  channel: number;
  cc: number;
  value: number;
}

export interface MidiProgramChange {
  channel: number;
  program: number;
}

export interface MidiPortInfo {
  id: string;
  name: string | null;
  manufacturer: string | null;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
  connection: 'open' | 'closed' | 'pending';
}

export interface MidiConnectionState {
  isSupported: boolean;
  isConnected: boolean;
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
  selectedInputId: string | null;
  selectedOutputId: string | null;
  error: string | null;
}
