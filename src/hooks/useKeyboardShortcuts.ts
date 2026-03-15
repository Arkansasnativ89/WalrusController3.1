import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useDeviceStore } from '@/stores/device-store';

export function useKeyboardShortcuts() {
  const { keyBindings, toggleMidiMonitor, togglePresetDrawer } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      for (const binding of keyBindings) {
        const ctrlMatch = binding.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = binding.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = binding.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === binding.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          dispatchAction(binding.action);
          return;
        }
      }
    }

    function dispatchAction(action: string) {
      const store = useDeviceStore.getState();
      switch (action) {
        case 'toggle-r1-bypass':
          store.toggleBypass('walrus-r1');
          break;
        case 'toggle-acs1-bypass':
          store.toggleBypass('walrus-acs1-mkii');
          break;
        case 'toggle-r1-sustain': {
          const r1 = store.profiles.find((p) => p.id === 'walrus-r1');
          const r1State = store.devices['walrus-r1'];
          if (r1 && r1State) {
            const sustainParam = r1.parameters.find((p) => p.id === 'r1-sustain');
            if (sustainParam) {
              const current = r1State.parameterValues[sustainParam.id] ?? 0;
              store.setParameterValue('walrus-r1', sustainParam.id, current >= 64 ? 0 : 127);
            }
          }
          break;
        }
        case 'toggle-acs1-boost': {
          const acs1 = store.profiles.find((p) => p.id === 'walrus-acs1-mkii');
          const acs1State = store.devices['walrus-acs1-mkii'];
          if (acs1 && acs1State) {
            const boostParam = acs1.parameters.find((p) => p.id === 'acs1-boost-engage');
            if (boostParam) {
              const current = acs1State.parameterValues[boostParam.id] ?? 0;
              store.setParameterValue('walrus-acs1-mkii', boostParam.id, current >= 64 ? 0 : 127);
            }
          }
          break;
        }
        case 'toggle-preset-drawer':
          togglePresetDrawer();
          break;
        case 'toggle-midi-monitor':
          toggleMidiMonitor();
          break;
        case 'save-preset':
          togglePresetDrawer();
          break;
        case 'toggle-ab-compare':
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyBindings, toggleMidiMonitor, togglePresetDrawer]);
}
