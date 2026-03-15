import { create } from 'zustand';
import type { DeviceProfile } from '@/types/device-profile';
import { midiService } from '@/services/midi-service';
import { buildCC, buildPC } from '@/utils/midi-utils';

interface ParameterState {
  [parameterId: string]: number;
}

/** Tracks which groups are linked (true) vs split (false) for stereo devices */
interface LinkedGroupState {
  [group: string]: boolean;
}

/** Per-device state container */
interface PerDeviceState {
  parameterValues: ParameterState;
  linkedGroups: LinkedGroupState;
  channelOverride: number | null;
}

interface DeviceState {
  /** All loaded device profiles */
  profiles: DeviceProfile[];
  /** Per-device state keyed by profile id */
  devices: Record<string, PerDeviceState>;
  /** Which device panel is focused (for drawers/settings) */
  focusedDeviceId: string | null;

  // Actions
  loadProfiles: (profiles: DeviceProfile[]) => void;
  focusDevice: (deviceId: string) => void;
  getProfile: (deviceId: string) => DeviceProfile | undefined;
  getDeviceState: (deviceId: string) => PerDeviceState | undefined;
  setParameterValue: (deviceId: string, parameterId: string, value: number) => void;
  setAllParameters: (deviceId: string, values: ParameterState) => void;
  sendAllParameters: (deviceId: string) => void;
  sendProgramChange: (deviceId: string, program: number) => void;
  toggleBypass: (deviceId: string) => void;
  setChannelOverride: (deviceId: string, channel: number | null) => void;
  getEffectiveChannel: (deviceId: string) => number;
  setGroupLinked: (deviceId: string, group: string, linked: boolean) => void;
  isGroupLinked: (deviceId: string, group: string) => boolean;
}

function initDeviceState(profile: DeviceProfile): PerDeviceState {
  const parameterValues: ParameterState = {};
  for (const param of profile.parameters) {
    parameterValues[param.id] = param.default;
  }
  const linkedGroups: LinkedGroupState = {};
  for (const param of profile.parameters) {
    if (param.type === 'linked_pair' && param.group) {
      linkedGroups[param.group] = true;
    }
  }
  return { parameterValues, linkedGroups, channelOverride: null };
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  profiles: [],
  devices: {},
  focusedDeviceId: null,

  loadProfiles: (profiles) => {
    const devices: Record<string, PerDeviceState> = {};
    for (const profile of profiles) {
      devices[profile.id] = initDeviceState(profile);
    }
    set({ profiles, devices, focusedDeviceId: profiles[0]?.id ?? null });
  },

  focusDevice: (deviceId) => set({ focusedDeviceId: deviceId }),

  getProfile: (deviceId) => get().profiles.find((p) => p.id === deviceId),

  getDeviceState: (deviceId) => get().devices[deviceId],

  setParameterValue: (deviceId, parameterId, value) => {
    const profile = get().profiles.find((p) => p.id === deviceId);
    const deviceState = get().devices[deviceId];
    if (!profile || !deviceState) return;

    const param = profile.parameters.find((p) => p.id === parameterId);
    if (!param) return;

    const clampedValue = Math.max(param.min, Math.min(param.max, Math.round(value)));
    const channel = get().getEffectiveChannel(deviceId);

    // Send CC to device
    const data = buildCC(channel, param.cc, clampedValue);
    try {
      midiService.send(data);
      midiService.notifyOutgoing(data);
    } catch {
      // Output not selected — update state anyway
    }

    const updates: ParameterState = { [parameterId]: clampedValue };

    // Handle linked pairs: mirror value to paired parameter if group is linked
    if (param.type === 'linked_pair' && param.linkedTo && param.group) {
      const isLinked = deviceState.linkedGroups[param.group] ?? true;
      if (isLinked) {
        const pairedParam = profile.parameters.find((p) => p.id === param.linkedTo);
        if (pairedParam) {
          const pairedClamped = Math.max(pairedParam.min, Math.min(pairedParam.max, clampedValue));
          const pairedData = buildCC(channel, pairedParam.cc, pairedClamped);
          try {
            midiService.send(pairedData);
            midiService.notifyOutgoing(pairedData);
          } catch {
            // continue
          }
          updates[pairedParam.id] = pairedClamped;
        }
      }
    }

    set((state) => {
      const existing = state.devices[deviceId];
      if (!existing) return state;
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...existing,
            parameterValues: { ...existing.parameterValues, ...updates },
          },
        },
      };
    });
  },

  setAllParameters: (deviceId, values) => {
    set((state) => {
      const existing = state.devices[deviceId];
      if (!existing) return state;
      return {
        devices: {
          ...state.devices,
          [deviceId]: { ...existing, parameterValues: values },
        },
      };
    });
  },

  sendAllParameters: (deviceId) => {
    const profile = get().profiles.find((p) => p.id === deviceId);
    const deviceState = get().devices[deviceId];
    if (!profile || !deviceState) return;

    const channel = get().getEffectiveChannel(deviceId);
    const { parameterValues } = deviceState;

    // Use ccSendOrder if available, otherwise send in parameter array order
    const orderedIds = profile.ccSendOrder ??
      profile.parameters.map((p) => p.id);

    for (const paramId of orderedIds) {
      const param = profile.parameters.find((p) => p.id === paramId);
      const value = parameterValues[paramId];
      if (param && value !== undefined) {
        const data = buildCC(channel, param.cc, value);
        try {
          midiService.send(data);
          midiService.notifyOutgoing(data);
        } catch {
          // continue sending remaining params
        }
      }
    }
  },

  sendProgramChange: (deviceId, program) => {
    const channel = get().getEffectiveChannel(deviceId);
    const data = buildPC(channel, program);
    try {
      midiService.send(data);
      midiService.notifyOutgoing(data);
    } catch {
      // Output not selected
    }
  },

  toggleBypass: (deviceId) => {
    const profile = get().profiles.find((p) => p.id === deviceId);
    const deviceState = get().devices[deviceId];
    if (!profile?.bypassCC || !deviceState) return;

    const bypassParam = profile.parameters.find(
      (p) => p.cc === profile.bypassCC
    );
    if (!bypassParam) return;

    const currentValue = deviceState.parameterValues[bypassParam.id] ?? 0;
    const newValue = currentValue >= 64 ? 0 : 127;
    get().setParameterValue(deviceId, bypassParam.id, newValue);
  },

  setChannelOverride: (deviceId, channel) => {
    set((state) => {
      const existing = state.devices[deviceId];
      if (!existing) return state;
      return {
        devices: {
          ...state.devices,
          [deviceId]: { ...existing, channelOverride: channel },
        },
      };
    });
  },

  getEffectiveChannel: (deviceId) => {
    const deviceState = get().devices[deviceId];
    const profile = get().profiles.find((p) => p.id === deviceId);
    if (deviceState?.channelOverride !== null && deviceState?.channelOverride !== undefined) {
      return deviceState.channelOverride;
    }
    return profile?.defaultChannel ?? 0;
  },

  setGroupLinked: (deviceId, group, linked) => {
    set((state) => {
      const existing = state.devices[deviceId];
      if (!existing) return state;
      return {
        devices: {
          ...state.devices,
          [deviceId]: {
            ...existing,
            linkedGroups: { ...existing.linkedGroups, [group]: linked },
          },
        },
      };
    });
  },

  isGroupLinked: (deviceId, group) => {
    return get().devices[deviceId]?.linkedGroups[group] ?? true;
  },
}));
