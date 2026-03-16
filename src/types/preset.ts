export interface ParameterValue {
  /** Parameter ID (matches DeviceParameter.id) */
  parameterId: string;
  /** CC number (denormalized for quick MIDI sends) */
  cc: number;
  /** Current value (0-127) */
  value: number;
}

export interface Preset {
  /** Unique preset ID (UUID) */
  id: string;
  /** User-given name */
  name: string;
  /** Optional description */
  description?: string;
  /** Tags for organization */
  tags: string[];
  /** Target device profile ID */
  deviceId: string;
  /** MIDI channel override (if different from device default) */
  channelOverride?: number;
  /** Program Change slot number to send before restoring CC values (0–127) */
  pcSlot: number;
  /** Snapshot of all parameter values */
  parameters: ParameterValue[];
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  modifiedAt: string;
  /** Signal chain position hint (for future multi-pedal chaining) */
  chainPosition?: number;
}

export interface PresetExport {
  version: 1;
  exportedAt: string;
  deviceId: string;
  presets: Preset[];
}
