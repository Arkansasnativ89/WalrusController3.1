import { useEffect } from 'react';
import { useMidi } from '@/hooks/useMidi';
import { useDeviceStore } from '@/stores/device-store';
import { useUIStore } from '@/stores/ui-store';
import { useMidiStore } from '@/stores/midi-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DeviceControlSurface } from '@/components/device/DeviceControlSurface';
import { ResizablePanels } from '@/components/layout/ResizablePanels';
import { MidiMonitorDrawer } from '@/components/midi-monitor/MidiMonitor';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { PresetDrawer } from '@/components/panels/PresetDrawer';
import r1Profile from '@/data/device-profiles/walrus-r1.json';
import acs1Profile from '@/data/device-profiles/walrus-acs1-mkii.json';
import type { DeviceProfile } from '@/types/device-profile';

const deviceProfiles: DeviceProfile[] = [
  r1Profile as DeviceProfile,
  acs1Profile as DeviceProfile,
];

/* ── Navbar ────────────────────────────────────────────────────── */

function Navbar() {
  const { isSupported, isConnected } = useMidi();
  const { selectedOutputId } = useMidiStore();
  const { toggleMidiMonitor, togglePresetDrawer, toggleSettings } = useUIStore();
  const { profiles } = useDeviceStore();

  const r1 = profiles.find((p) => p.id === 'walrus-r1');
  const acs1 = profiles.find((p) => p.id === 'walrus-acs1-mkii');

  const connectionLedClass = !isSupported
    ? 'led led-red'
    : isConnected && selectedOutputId
      ? 'led led-green'
      : isConnected
        ? 'led led-amber'
        : 'led led-red';

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 'var(--navbar-height)',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: Logo + device status */}
      <div className="flex items-center gap-4">
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Walrus Controller
        </span>
        <div className="flex items-center gap-3">
          {r1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                R1: Ch.{r1.defaultChannel + 1}
              </span>
              <span className={connectionLedClass} />
            </div>
          )}
          {acs1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                ACS1: Ch.{acs1.defaultChannel + 1}
              </span>
              <span className={connectionLedClass} />
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <NavButton
          label="MIDI Monitor"
          shortcut="M"
          onClick={toggleMidiMonitor}
        >
          {/* Monitor icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 9l2-3 2 2 2-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavButton>
        <NavButton
          label="Presets"
          shortcut="P"
          onClick={togglePresetDrawer}
        >
          {/* Presets icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="2" width="10" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="3" y="6.5" width="10" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
            <rect x="3" y="11" width="10" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </NavButton>
        <NavButton
          label="Settings"
          onClick={toggleSettings}
        >
          {/* Gear icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 1v2m0 10v2M1 8h2m10 0h2M3.05 3.05l1.41 1.41m7.08 7.08l1.41 1.41M3.05 12.95l1.41-1.41m7.08-7.08l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </NavButton>
      </div>
    </header>
  );
}

function NavButton({
  children,
  label,
  shortcut,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="p-2 rounded transition-led"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </button>
  );
}

/* ── Device Panel ──────────────────────────────────────────────── */

function DevicePanel({ deviceId }: { deviceId: string }) {
  const { sendProgramChange, profiles, focusDevice } = useDeviceStore();
  const profile = profiles.find((p) => p.id === deviceId);

  if (!profile) return null;

  return (
    <div className="h-full flex flex-col" onClick={() => focusDevice(deviceId)}>
      {/* Panel header with preset bank buttons */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <h2 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {profile.name.replace('Walrus Audio ', '')}
        </h2>
        {profile.presetSlots && (
          <div className="flex gap-1">
            {profile.presetSlots.slice(0, 9).map((slot, i) => {
              // Bank color: 0-2 = A (red), 3-5 = B (green), 6-8 = C (blue)
              const bankColor =
                i < 3
                  ? 'var(--bank-a)'
                  : i < 6
                    ? 'var(--bank-b)'
                    : 'var(--bank-c)';
              return (
                <button
                  key={slot.pc}
                  onClick={() => sendProgramChange(deviceId, slot.pc)}
                  className="px-1.5 py-0.5 text-[9px] rounded transition-led font-mono"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  title={slot.name}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = bankColor;
                    e.currentTarget.style.color = bankColor;
                    e.currentTarget.style.boxShadow = `0 0 6px ${bankColor}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-4">
        <DeviceControlSurface deviceId={deviceId} />
      </div>
    </div>
  );
}

/* ── App ───────────────────────────────────────────────────────── */

export default function App() {
  const { error } = useMidi();
  const { loadProfiles } = useDeviceStore();
  const { midiMonitorOpen } = useUIStore();

  useKeyboardShortcuts();

  useEffect(() => {
    loadProfiles(deviceProfiles);
  }, [loadProfiles]);

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
    >
      <Navbar />

      {/* Error Banner */}
      {error && (
        <div
          className="px-4 py-1.5 text-xs flex-shrink-0"
          style={{
            background: 'var(--accent-coral-dim)',
            borderBottom: '1px solid var(--accent-coral)',
            color: 'var(--accent-coral)',
          }}
        >
          {error}
        </div>
      )}

      {/* Main: Side-by-side device panels */}
      <main
        className="flex-1 min-h-0"
        style={{ paddingBottom: midiMonitorOpen ? '240px' : '0' }}
      >
        <ResizablePanels
          left={
            <div className="h-full panel" style={{ borderRadius: 0, borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }}>
              <DevicePanel deviceId="walrus-r1" />
            </div>
          }
          right={
            <div className="h-full panel" style={{ borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}>
              <DevicePanel deviceId="walrus-acs1-mkii" />
            </div>
          }
          defaultSplit={40}
        />
      </main>

      {/* Overlays */}
      <MidiMonitorDrawer />
      <SettingsPanel />
      <PresetDrawer />
    </div>
  );
}
