import { useMidiStore } from '@/stores/midi-store';
import { useDeviceStore } from '@/stores/device-store';
import { useUIStore } from '@/stores/ui-store';

export function SettingsPanel() {
  const { outputs, selectedOutputId, selectOutput } = useMidiStore();
  const { profiles } = useDeviceStore();
  const { settingsOpen, setSettingsOpen, keyBindings } = useUIStore();

  if (!settingsOpen) return null;

  const r1 = profiles.find((p) => p.id === 'walrus-r1');
  const acs1 = profiles.find((p) => p.id === 'walrus-acs1-mkii');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={() => setSettingsOpen(false)}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width: 'var(--drawer-width)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4"
          style={{
            height: 'var(--navbar-height)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* MIDI Output */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              MIDI Output
            </h3>
            <select
              value={selectedOutputId ?? ''}
              onChange={(e) => e.target.value && selectOutput(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select output…</option>
              {outputs.map((output) => (
                <option key={output.id} value={output.id}>
                  {output.name ?? output.id}
                </option>
              ))}
            </select>
          </section>

          {/* Channel Assignment */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Channel Assignment
            </h3>
            <div className="space-y-3">
              <ChannelSelector
                label={r1?.name ?? 'R1'}
                channel={(r1?.defaultChannel ?? 4) + 1}
                onChange={(ch) => {
                  useDeviceStore.getState().setChannelOverride('walrus-r1', ch - 1);
                }}
              />
              <ChannelSelector
                label={acs1?.name ?? 'ACS1'}
                channel={(acs1?.defaultChannel ?? 6) + 1}
                onChange={(ch) => {
                  useDeviceStore.getState().setChannelOverride('walrus-acs1-mkii', ch - 1);
                }}
              />
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1">
              {keyBindings.map((binding) => (
                <div
                  key={binding.action}
                  className="flex items-center justify-between py-1.5 px-2 rounded"
                  style={{ background: 'var(--surface-raised)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {binding.label}
                  </span>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {binding.ctrl ? 'Ctrl+' : ''}
                    {binding.shift ? 'Shift+' : ''}
                    {binding.key.toUpperCase()}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function ChannelSelector({
  label,
  channel,
  onChange,
}: {
  label: string;
  channel: number;
  onChange: (ch: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <select
        value={channel}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2 py-1 rounded text-xs outline-none"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          width: '60px',
        }}
      >
        {Array.from({ length: 16 }, (_, i) => i + 1).map((ch) => (
          <option key={ch} value={ch}>
            Ch {ch}
          </option>
        ))}
      </select>
    </div>
  );
}
