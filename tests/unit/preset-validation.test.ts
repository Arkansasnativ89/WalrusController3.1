import { describe, it, expect } from 'vitest';
import { isValidPreset, isValidPresetExport, isValidDeviceProfile } from '../../src/utils/validation';

describe('validation', () => {
  describe('isValidPreset', () => {
    const validPreset = {
      id: 'test-id',
      name: 'Test Preset',
      description: '',
      tags: ['test'],
      deviceId: 'walrus-r1',
      parameters: [],
      createdAt: '2026-01-01T00:00:00Z',
      modifiedAt: '2026-01-01T00:00:00Z',
    };

    it('accepts a valid preset', () => {
      expect(isValidPreset(validPreset)).toBe(true);
    });

    it('rejects null', () => {
      expect(isValidPreset(null)).toBe(false);
    });

    it('rejects missing fields', () => {
      expect(isValidPreset({ id: 'x' })).toBe(false);
    });
  });

  describe('isValidDeviceProfile', () => {
    it('accepts a valid profile', () => {
      expect(
        isValidDeviceProfile({
          id: 'test',
          name: 'Test',
          manufacturer: 'Test Co',
          defaultChannel: 0,
          parameters: [],
        })
      ).toBe(true);
    });

    it('rejects invalid channel', () => {
      expect(
        isValidDeviceProfile({
          id: 'test',
          name: 'Test',
          manufacturer: 'Test Co',
          defaultChannel: 16,
          parameters: [],
        })
      ).toBe(false);
    });
  });

  describe('isValidPresetExport', () => {
    it('accepts valid export', () => {
      expect(
        isValidPresetExport({
          version: 1,
          exportedAt: '2026-01-01T00:00:00Z',
          deviceId: 'walrus-r1',
          presets: [
            {
              id: 'p1',
              name: 'Preset 1',
              tags: [],
              deviceId: 'walrus-r1',
              parameters: [],
              createdAt: '2026-01-01T00:00:00Z',
              modifiedAt: '2026-01-01T00:00:00Z',
            },
          ],
        })
      ).toBe(true);
    });

    it('rejects wrong version', () => {
      expect(
        isValidPresetExport({ version: 2, exportedAt: '', deviceId: '', presets: [] })
      ).toBe(false);
    });
  });
});
