import { useEffect } from 'react';
import { usePresetStore } from '@/stores/preset-store';

/**
 * Hook to load and manage presets, optionally filtered by device.
 */
export function usePresets(deviceId?: string) {
  const store = usePresetStore();

  useEffect(() => {
    if (deviceId) {
      store.loadPresetsByDevice(deviceId);
    } else {
      store.loadPresets();
    }
  }, [deviceId]);

  return store;
}
