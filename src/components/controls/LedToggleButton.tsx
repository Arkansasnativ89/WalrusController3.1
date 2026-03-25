import { memo, useCallback } from 'react';

interface LedToggleButtonProps {
  value: boolean;
  label: string;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export const LedToggleButton = memo(function LedToggleButton({
  value,
  label,
  onChange,
  activeColor = 'var(--accent-cyan)',
}: LedToggleButtonProps) {
  const handleClick = useCallback(() => onChange(!value), [value, onChange]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!value);
      }
    },
    [value, onChange],
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-md transition-led focus:outline-none focus-visible:ring-1"
      style={{
        background: value ? `${activeColor}12` : 'var(--surface)',
        border: `1px solid ${value ? activeColor + '55' : 'var(--border-subtle)'}`,
      }}
    >
      {/* LED dot */}
      <span
        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
        style={{
          background: value ? activeColor : 'var(--text-muted)',
          boxShadow: value ? `0 0 7px ${activeColor}90, 0 0 14px ${activeColor}40` : 'none',
        }}
      />

      {/* Label */}
      <span
        className="flex-1 text-left text-xs font-semibold uppercase tracking-wider truncate"
        style={{ color: value ? activeColor : 'var(--text-secondary)' }}
      >
        {label}
      </span>

      {/* Status badge */}
      <span
        className="flex-shrink-0 text-[10px] font-mono font-bold"
        style={{ color: value ? activeColor : 'var(--text-muted)' }}
      >
        {value ? 'ON' : 'OFF'}
      </span>
    </button>
  );
});
