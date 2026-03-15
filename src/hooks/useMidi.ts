import { useEffect } from 'react';
import { useMidiStore } from '@/stores/midi-store';

/**
 * Hook to initialize MIDI on mount and provide MIDI state + actions.
 */
export function useMidi() {
  const store = useMidiStore();

  useEffect(() => {
    if (!store.isConnected && store.isSupported) {
      store.initialize();
    }
  }, []);

  return store;
}
