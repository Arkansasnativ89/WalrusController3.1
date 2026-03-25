import { useRef, useEffect, memo } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useUIStore } from '@/stores/ui-store';
import { formatMidiMessage } from '@/utils/midi-utils';
import type { MidiMessage } from '@/types/midi';

const VISIBLE_MESSAGE_CAP = 100;

const MidiMessageRow = memo(function MidiMessageRow({ msg }: { msg: MidiMessage }) {
  return (
    <div
      className="px-2 py-0.5 rounded"
      style={{
        background:
          msg.direction === 'in'
            ? 'var(--accent-navy)'
            : 'rgba(30, 214, 208, 0.08)',
        color: 'var(--accent-cyan)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>
        {msg.direction === 'in' ? 'RX' : 'TX'}
      </span>{' '}
      {formatMidiMessage(msg)}
    </div>
  );
});

export function MidiMonitorDrawer() {
  const { messageLog, clearLog, isConnected } = useMidiStore();
  const { midiMonitorOpen, setMidiMonitorOpen } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && midiMonitorOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageLog.length, midiMonitorOpen]);

  if (!midiMonitorOpen) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        height: '240px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: '36px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            MIDI Monitor
          </h2>
          <span
            className={`led transition-led ${isConnected ? 'led-green' : 'led-red'}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLog}
            className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-raised)')}
          >
            Clear
          </button>
          <button
            onClick={() => setMidiMonitorOpen(false)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log */}
      <div
        ref={scrollRef}
        className="overflow-y-auto font-mono text-[11px] p-2 space-y-px"
        style={{ height: 'calc(100% - 36px)' }}
      >
        {messageLog.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {isConnected ? 'Waiting for MIDI messages…' : 'Connect a MIDI device to begin'}
          </p>
        )}
        {messageLog.length > VISIBLE_MESSAGE_CAP && (
          <p className="text-center text-[10px] py-0.5" style={{ color: 'var(--text-muted)' }}>
            Showing {VISIBLE_MESSAGE_CAP} of {messageLog.length} messages
          </p>
        )}
        {messageLog.slice(0, VISIBLE_MESSAGE_CAP).map((msg, i) => (
          <MidiMessageRow key={`${msg.timestamp}-${i}`} msg={msg} />
        ))}
      </div>
    </div>
  );
}
