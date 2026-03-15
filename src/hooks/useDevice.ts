import { useDeviceStore } from '@/stores/device-store';

/**
 * Hook to access device profiles and parameter control.
 */
export function useDevice() {
  return useDeviceStore();
}
