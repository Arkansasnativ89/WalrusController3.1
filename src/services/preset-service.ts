import { db } from './storage-service';
import type { Preset, PresetExport } from '@/types/preset';
import { isValidPreset, isValidPresetExport } from '@/utils/validation';

export async function getAllPresets(): Promise<Preset[]> {
  return db.presets.toArray();
}

export async function getPresetsByDevice(deviceId: string): Promise<Preset[]> {
  return db.presets.where('deviceId').equals(deviceId).toArray();
}

export async function getPresetById(id: string): Promise<Preset | undefined> {
  return db.presets.get(id);
}

export async function savePreset(preset: Preset): Promise<void> {
  if (!isValidPreset(preset)) {
    throw new Error('Invalid preset data.');
  }
  await db.presets.put(preset);
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

export async function exportPresets(deviceId: string): Promise<PresetExport> {
  const presets = await getPresetsByDevice(deviceId);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    deviceId,
    presets,
  };
}

export async function importPresets(data: unknown): Promise<number> {
  if (!isValidPresetExport(data)) {
    throw new Error('Invalid preset export format.');
  }
  await db.presets.bulkPut(data.presets);
  return data.presets.length;
}
