import type { DeviceProfile } from '@/types/device-profile';
import type { Preset, PresetExport } from '@/types/preset';

export function isValidDeviceProfile(data: unknown): data is DeviceProfile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.manufacturer === 'string' &&
    typeof d.defaultChannel === 'number' &&
    d.defaultChannel >= 0 &&
    d.defaultChannel <= 15 &&
    Array.isArray(d.parameters)
  );
}

export function isValidPreset(data: unknown): data is Preset {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.deviceId === 'string' &&
    Array.isArray(d.tags) &&
    Array.isArray(d.parameters) &&
    typeof d.createdAt === 'string' &&
    typeof d.modifiedAt === 'string'
  );
}

export function isValidPresetExport(data: unknown): data is PresetExport {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.exportedAt === 'string' &&
    typeof d.deviceId === 'string' &&
    Array.isArray(d.presets) &&
    (d.presets as unknown[]).every(isValidPreset)
  );
}
