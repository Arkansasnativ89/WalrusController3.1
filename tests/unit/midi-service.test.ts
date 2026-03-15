import { describe, it, expect } from 'vitest';
import { buildCC, buildPC, parseMidiMessage, clampMidi, formatMidiMessage } from '../../src/utils/midi-utils';
import { MIDI_STATUS } from '../../src/types/midi';

describe('midi-utils', () => {
  describe('buildCC', () => {
    it('builds correct CC message bytes', () => {
      const data = buildCC(0, 21, 64);
      expect(data[0]).toBe(0xb0); // CC on channel 0
      expect(data[1]).toBe(21);
      expect(data[2]).toBe(64);
    });

    it('masks channel to 4 bits', () => {
      const data = buildCC(15, 100, 127);
      expect(data[0]).toBe(0xbf); // CC on channel 15
    });

    it('clamps CC and value to 7 bits', () => {
      const data = buildCC(0, 200, 200);
      expect(data[1]).toBe(200 & 0x7f);
      expect(data[2]).toBe(200 & 0x7f);
    });
  });

  describe('buildPC', () => {
    it('builds correct PC message bytes', () => {
      const data = buildPC(0, 5);
      expect(data[0]).toBe(0xc0); // PC on channel 0
      expect(data[1]).toBe(5);
      expect(data.length).toBe(2);
    });
  });

  describe('parseMidiMessage', () => {
    it('parses a CC message', () => {
      const data = new Uint8Array([0xb0, 21, 64]);
      const msg = parseMidiMessage(data, 'in');
      expect(msg.status).toBe(MIDI_STATUS.CONTROL_CHANGE);
      expect(msg.channel).toBe(0);
      expect(msg.data1).toBe(21);
      expect(msg.data2).toBe(64);
      expect(msg.direction).toBe('in');
    });

    it('parses a PC message (2 bytes)', () => {
      const data = new Uint8Array([0xc0, 5]);
      const msg = parseMidiMessage(data, 'out');
      expect(msg.status).toBe(MIDI_STATUS.PROGRAM_CHANGE);
      expect(msg.data1).toBe(5);
      expect(msg.data2).toBeUndefined();
    });
  });

  describe('clampMidi', () => {
    it('clamps below 0', () => expect(clampMidi(-5)).toBe(0));
    it('clamps above 127', () => expect(clampMidi(200)).toBe(127));
    it('rounds floats', () => expect(clampMidi(63.7)).toBe(64));
    it('passes valid values through', () => expect(clampMidi(64)).toBe(64));
  });

  describe('formatMidiMessage', () => {
    it('formats an incoming CC message', () => {
      const msg = parseMidiMessage(new Uint8Array([0xb2, 22, 100]), 'in');
      const formatted = formatMidiMessage(msg);
      expect(formatted).toContain('←');
      expect(formatted).toContain('Ch3');
      expect(formatted).toContain('CC');
      expect(formatted).toContain('#22');
      expect(formatted).toContain('val:100');
    });
  });
});
