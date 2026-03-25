import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceProfile } from '@/types/device-profile';
import type { Preset } from '@/types/preset';
import { midiService } from '@/services/midi-service';
import { buildCC, buildPC } from '@/utils/midi-utils';
import { db } from '@/services/storage-service';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Clamp a MIDI channel number to 0-15 */
function clampChannel(ch: number): number {
  return Math.max(0, Math.min(15, Math.round(ch)));
}

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
  recallPreset: (deviceId: string, preset: Preset) => Promise<void>;
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

/** AbortController for the currently in-progress recallPreset operation */
let recallAbortController: AbortController | null = null;

/** Custom Zustand storage adapter backed by Dexie settings table */
const dexieStorage = {
  getItem: async (name: string) => {
    const row = await db.settings.get(name);
    if (!row) return null;
    return JSON.parse(row.value as string);
  },
  setItem: async (name: string, value: unknown) => {
    await db.settings.put({ key: name, value: JSON.stringify(value) });
  },
  removeItem: async (name: string) => {
    await db.settings.delete(name);
  },
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      profiles: [],
      devices: {},
      focusedDeviceId: null,

      loadProfiles: (profiles) => {
        const freshDevices: Record<string, PerDeviceState> = {};
        const persisted = get().devices;

        for (const profile of profiles) {
          const fresh = initDeviceState(profile);
          const saved = persisted[profile.id];

          if (saved) {
            // Merge: use persisted values for params that still exist, fill in new params from profile defaults
            const mergedParams: ParameterState = {};
            for (const param of profile.parameters) {
              mergedParams[param.id] = saved.parameterValues[param.id] != null
                ? saved.parameterValues[param.id]!
                : param.default;
            }
            const mergedGroups: LinkedGroupState = {};
            for (const param of profile.parameters) {
              if (param.type === 'linked_pair' && param.group) {
                mergedGroups[param.group] = saved.linkedGroups[param.group] != null
                  ? saved.linkedGroups[param.group]!
                  : true;
              }
            }
            freshDevices[profile.id] = {
              parameterValues: mergedParams,
              linkedGroups: mergedGroups,
              channelOverride: saved.channelOverride,
            };
          } else {
            freshDevices[profile.id] = fresh;
          }
        }

        set({ profiles, devices: freshDevices, focusedDeviceId: get().focusedDeviceId ?? profiles[0]?.id ?? null });
      },

      focusDevice: (deviceId) => set({ focusedDeviceId: deviceId }),

      getProfile: (deviceId) => get().profiles.find((p) => p.id === deviceId),

      getDeviceState: (deviceId) => get().devices[deviceId],

      setParameterValue: (deviceId, parameterId, value) => {
        const profile = get().profiles.find((p) => p.id === deviceId);
        const deviceState = get().devices[deviceId];
        if (!profile || !deviceState) return;

        // Validate parameter exists BEFORE sending any MIDI
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

      recallPreset: async (deviceId, preset) => {
        // Abort any in-progress recall
        if (recallAbortController) {
          recallAbortController.abort();
        }
        const controller = new AbortController();
        recallAbortController = controller;
        const { signal } = controller;

        const profile = get().profiles.find((p) => p.id === deviceId);
        const deviceState = get().devices[deviceId];
        if (!profile || !deviceState) return;

        const channel = get().getEffectiveChannel(deviceId);

        // 1. Send Program Change to switch the pedal's internal slot
        const pcData = buildPC(channel, preset.pcSlot);
        try {
          midiService.send(pcData);
          midiService.notifyOutgoing(pcData);
        } catch {
          // Output not selected
        }

        // 2. Wait for the pedal to load its internal preset before overwriting CCs
        await delay(100);
        if (signal.aborted) return;

        // 3. Update UI state immediately (no MIDI) so knobs reflect the preset values
        const values: Record<string, number> = {};
        for (const pv of preset.parameters) {
          values[pv.parameterId] = pv.value;
        }
        get().setAllParameters(deviceId, values);

        // 4. Stream CC messages with a small inter-message gap to avoid buffer flooding
        const orderedIds = profile.ccSendOrder ?? profile.parameters.map((p) => p.id);
        for (const paramId of orderedIds) {
          if (signal.aborted) return;

          const param = profile.parameters.find((p) => p.id === paramId);
          const value = values[paramId];
          if (param && value !== undefined) {
            const data = buildCC(channel, param.cc, value);
            try {
              midiService.send(data);
              midiService.notifyOutgoing(data);
            } catch {
              // continue sending remaining params
            }
            await delay(10);
          }
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
              [deviceId]: {
                ...existing,
                channelOverride: channel !== null ? clampChannel(channel) : null,
              },
            },
          };
        });
      },

      getEffectiveChannel: (deviceId) => {
        const deviceState = get().devices[deviceId];
        const profile = get().profiles.find((p) => p.id === deviceId);
        if (deviceState?.channelOverride !== null && deviceState?.channelOverride !== undefined) {
          return clampChannel(deviceState.channelOverride);
        }
        return clampChannel(profile?.defaultChannel ?? 0);
      },

      setGroupLinked: (deviceId, group, linked) => {
        const profile = get().profiles.find((p) => p.id === deviceId);
        set((state) => {
          const existing = state.devices[deviceId];
          if (!existing) return state;

          let updatedGroups: LinkedGroupState;
          if (profile?.stereoLinked) {
            // Global link: toggle ALL groups together
            updatedGroups = {};
            for (const key of Object.keys(existing.linkedGroups)) {
              updatedGroups[key] = linked;
            }
          } else {
            updatedGroups = { ...existing.linkedGroups, [group]: linked };
          }

          return {
            devices: {
              ...state.devices,
              [deviceId]: { ...existing, linkedGroups: updatedGroups },
            },
          };
        });
      },

      isGroupLinked: (deviceId, group) => {
        return get().devices[deviceId]?.linkedGroups[group] ?? true;
      },
    }),
    {
      name: 'deviceState',
      storage: dexieStorage,
      partialize: (state) => ({
        devices: state.devices,
        focusedDeviceId: state.focusedDeviceId,
      }) as unknown as DeviceState,
    },
  ),
);
