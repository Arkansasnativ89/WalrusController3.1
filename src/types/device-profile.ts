export type ParameterType =
  | 'continuous'
  | 'bipolar'
  | 'toggle'
  | 'select'
  | 'three_way'
  | 'linked_pair';

export interface ParameterOption {
  label: string;
  value: number;
}

export interface ThreeWayZone {
  label: string;
  /** Canonical MIDI value to send (midpoint of zone) */
  value: number;
  /** Zone range [min, max] for reading state */
  range: [number, number];
}

export interface DynamicLabelEntry {
  /** Value of the controlling parameter that triggers this label */
  whenValue: number;
  label: string;
  description?: string;
}

export interface DeviceParameter {
  /** Unique identifier for this parameter */
  id: string;
  /** Display label */
  label: string;
  /** MIDI CC number */
  cc: number;
  /** UI control type */
  type: ParameterType;
  /** Minimum value (0-127) */
  min: number;
  /** Maximum value (0-127) */
  max: number;
  /** Default value */
  default: number;
  /** For 'select' type: named options */
  options?: ParameterOption[];
  /** For 'three_way' type: zone definitions */
  zones?: ThreeWayZone[];
  /** For 'linked_pair' type: ID of the paired parameter */
  linkedTo?: string;
  /** For 'bipolar' type: center/neutral value */
  centerValue?: number;
  /** For 'bipolar' type: labels for each half */
  bipolarLabels?: { low: string; high: string };
  /** Dynamic label map: this param's label changes based on another param's value */
  dynamicLabel?: {
    /** ID of the parameter that controls this label */
    controlledBy: string;
    /** Label entries keyed by the controlling parameter's value */
    entries: DynamicLabelEntry[];
  };
  /** Group/section this parameter belongs to */
  group?: string;
  /** Display order within group */
  order?: number;
  /** Description or tooltip text */
  description?: string;
}

export interface DevicePresetSlot {
  /** Program Change number */
  pc: number;
  /** Default preset name (from factory) */
  name: string;
}

export interface DeviceProfile {
  /** Unique device identifier (e.g., "walrus-r1") */
  id: string;
  /** Display name */
  name: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Default MIDI channel (0-15 internally, displayed as 1-16) */
  defaultChannel: number;
  /** Bypass CC number, if applicable */
  bypassCC?: number;
  /** All controllable parameters */
  parameters: DeviceParameter[];
  /** Available preset slots (PC numbers) */
  presetSlots?: DevicePresetSlot[];
  /** Device category/type for grouping */
  category?: string;
  /** URL or path to device image/icon */
  icon?: string;
  /** Recommended CC send order (array of parameter IDs) */
  ccSendOrder?: string[];
  /** MIDI output device name for auto-detection */
  midiOutputName?: string;
  /** Whether this device supports stereo linked pairs */
  stereoLinked?: boolean;
}
