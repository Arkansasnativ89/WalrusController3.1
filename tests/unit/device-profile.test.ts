import { describe, it, expect } from 'vitest';
import r1Profile from '../../src/data/device-profiles/walrus-r1.json';
import acs1Profile from '../../src/data/device-profiles/walrus-acs1-mkii.json';
import { isValidDeviceProfile } from '../../src/utils/validation';

describe('device profiles', () => {
  it('R1 profile is valid', () => {
    expect(isValidDeviceProfile(r1Profile)).toBe(true);
  });

  it('ACS1 MKII profile is valid', () => {
    expect(isValidDeviceProfile(acs1Profile)).toBe(true);
  });

  it('R1 has expected fields', () => {
    expect(r1Profile.id).toBe('walrus-r1');
    expect(r1Profile.manufacturer).toBe('Walrus Audio');
    expect(r1Profile.parameters.length).toBeGreaterThan(0);
  });

  it('ACS1 MKII has expected fields', () => {
    expect(acs1Profile.id).toBe('walrus-acs1-mkii');
    expect(acs1Profile.manufacturer).toBe('Walrus Audio');
    expect(acs1Profile.parameters.length).toBeGreaterThan(0);
  });

  it('all parameters have unique IDs within each profile', () => {
    for (const profile of [r1Profile, acs1Profile]) {
      const ids = profile.parameters.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('all CC numbers are in valid MIDI range', () => {
    for (const profile of [r1Profile, acs1Profile]) {
      for (const param of profile.parameters) {
        expect(param.cc).toBeGreaterThanOrEqual(0);
        expect(param.cc).toBeLessThanOrEqual(127);
      }
    }
  });
});
