import { MIDI_STATUS, type MidiMessage } from '@/types/midi';

/**
 * Build a Control Change MIDI message as a byte array.
 * @param channel MIDI channel (0-15)
 * @param cc CC number (0-127)
 * @param value CC value (0-127)
 */
export function buildCC(channel: number, cc: number, value: number): Uint8Array {
  const status = MIDI_STATUS.CONTROL_CHANGE | (channel & 0x0f);
  return new Uint8Array([status, cc & 0x7f, value & 0x7f]);
}

/**
 * Build a Program Change MIDI message as a byte array.
 * @param channel MIDI channel (0-15)
 * @param program Program number (0-127)
 */
export function buildPC(channel: number, program: number): Uint8Array {
  const status = MIDI_STATUS.PROGRAM_CHANGE | (channel & 0x0f);
  return new Uint8Array([status, program & 0x7f]);
}

/**
 * Parse raw MIDI bytes into a structured MidiMessage.
 */
export function parseMidiMessage(
  data: Uint8Array,
  direction: 'in' | 'out'
): MidiMessage {
  const status = data[0]! & 0xf0;
  const channel = data[0]! & 0x0f;

  return {
    status,
    channel,
    data1: data[1] ?? 0,
    data2: data.length > 2 ? data[2] : undefined,
    timestamp: performance.now(),
    direction,
  };
}

/**
 * Get a human-readable label for a MIDI status byte.
 */
export function getStatusLabel(status: number): string {
  switch (status) {
    case MIDI_STATUS.NOTE_OFF:
      return 'Note Off';
    case MIDI_STATUS.NOTE_ON:
      return 'Note On';
    case MIDI_STATUS.POLY_PRESSURE:
      return 'Poly Pressure';
    case MIDI_STATUS.CONTROL_CHANGE:
      return 'CC';
    case MIDI_STATUS.PROGRAM_CHANGE:
      return 'PC';
    case MIDI_STATUS.CHANNEL_PRESSURE:
      return 'Ch Pressure';
    case MIDI_STATUS.PITCH_BEND:
      return 'Pitch Bend';
    default:
      return `0x${status.toString(16).toUpperCase()}`;
  }
}

/**
 * Format a MIDI message for display in the monitor.
 */
export function formatMidiMessage(msg: MidiMessage): string {
  const dir = msg.direction === 'in' ? '←' : '→';
  const label = getStatusLabel(msg.status);
  const ch = msg.channel + 1; // display as 1-16
  const d2 = msg.data2 !== undefined ? ` val:${msg.data2}` : '';
  return `${dir} Ch${ch} ${label} #${msg.data1}${d2}`;
}

/**
 * Clamp a value to 0-127 MIDI range.
 */
export function clampMidi(value: number): number {
  return Math.max(0, Math.min(127, Math.round(value)));
}
