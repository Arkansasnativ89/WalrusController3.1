import { Component, useEffect } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useMidi } from '@/hooks/useMidi';
import { useDeviceStore } from '@/stores/device-store';
import { usePresetStore } from '@/stores/preset-store';
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

/* ── ErrorBoundary ────────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-4 p-8"
          style={{ height: '100%', color: 'var(--text-primary)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--accent-coral)' }}>
            Something went wrong
          </h2>
          <p className="text-sm font-mono max-w-lg text-center" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded text-sm font-semibold"
            style={{
              background: 'var(--accent-cyan-dim)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      className="p-2 rounded transition-led text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}

/* ── Device Panel ──────────────────────────────────────────────── */

function DevicePanel({ deviceId }: { deviceId: string }) {
  const { sendProgramChange, profiles, focusDevice, isGroupLinked, setGroupLinked } = useDeviceStore();
  const profile = profiles.find((p) => p.id === deviceId);

  // Stereo link state for devices with linked pairs (e.g. ACS1)
  const firstLinkedGroup = profile?.stereoLinked
    ? profile.parameters.find((p) => p.type === 'linked_pair' && p.group)?.group
    : undefined;
  const isStereoLinked = firstLinkedGroup ? isGroupLinked(deviceId, firstLinkedGroup) : false;

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
        <div className="flex items-center gap-2">
          {profile.stereoLinked && firstLinkedGroup && (
            <button
              onClick={(e) => { e.stopPropagation(); setGroupLinked(deviceId, firstLinkedGroup, !isStereoLinked); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-led"
              style={{
                background: isStereoLinked ? 'var(--surface-raised)' : 'var(--accent-acs1-dim)',
                border: `1px solid ${isStereoLinked ? 'var(--border)' : 'var(--accent-acs1)'}`,
                color: isStereoLinked ? 'var(--text-secondary)' : 'var(--accent-acs1)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                {isStereoLinked ? (
                  <path d="M6 4H4a4 4 0 000 8h2m4-8h2a4 4 0 010 8h-2m-5-4h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                ) : (
                  <path d="M6 4H4a4 4 0 000 8h2m4-8h2a4 4 0 010 8h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                )}
              </svg>
              {isStereoLinked ? 'Mono' : 'Stereo'}
            </button>
          )}
          {profile.presetSlots && (
            <div className="flex gap-1">
              {profile.presetSlots.slice(0, 9).map((slot, i) => {
                return (
                  <button
                    key={slot.pc}
                    onClick={() => sendProgramChange(deviceId, slot.pc)}
                    className={`px-1.5 py-0.5 text-[9px] rounded transition-led font-mono preset-bank-btn ${i < 3 ? 'preset-bank-a' : i < 6 ? 'preset-bank-b' : 'preset-bank-c'}`}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                    title={slot.name}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
  const { loadProfiles, focusedDeviceId } = useDeviceStore();
  const { loadPresets } = usePresetStore();
  const { midiMonitorOpen } = useUIStore();

  useKeyboardShortcuts();

  useEffect(() => {
    loadProfiles(deviceProfiles);
    loadPresets();
  }, [loadProfiles, loadPresets]);

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
        <ErrorBoundary>
        <ResizablePanels
          left={
            <div
              className={`h-full panel${focusedDeviceId === 'walrus-r1' ? ' module-selected-r1' : ''}`}
              style={{
                borderRadius: 0,
                borderLeft: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: `1px solid ${focusedDeviceId === 'walrus-r1' ? 'var(--accent-cyan)' : 'var(--border)'}`,
                transition: 'border-color 250ms ease',
              }}
            >
              <DevicePanel deviceId="walrus-r1" />
            </div>
          }
          right={
            <div
              className={`h-full panel${focusedDeviceId === 'walrus-acs1-mkii' ? ' module-selected-acs1' : ''}`}
              style={{
                borderRadius: 0,
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: `1px solid ${focusedDeviceId === 'walrus-acs1-mkii' ? 'var(--accent-acs1)' : 'var(--border)'}`,
                transition: 'border-color 250ms ease',
              }}
            >
              <DevicePanel deviceId="walrus-acs1-mkii" />
            </div>
          }
          defaultSplit={40}
        />
        </ErrorBoundary>
      </main>

      {/* Overlays */}
      <MidiMonitorDrawer />
      <SettingsPanel />
      <PresetDrawer />
    </div>
  );
}
