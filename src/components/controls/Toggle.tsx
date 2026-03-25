import { memo, useCallback } from 'react';

interface ToggleProps {
  value: boolean;
  label: string;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export const Toggle = memo(function Toggle({ value, label, onChange, activeColor }: ToggleProps) {
  const handleClick = useCallback(() => onChange(!value), [value, onChange]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!value);
      }
    },
    [value, onChange]
  );

  const color = activeColor ?? 'var(--accent-cyan)';

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative w-10 h-5 rounded-full transition-led focus:outline-none"
        style={{
          background: value ? color : 'var(--border)',
          boxShadow: value ? `0 0 8px ${color}60` : 'none',
        }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-100"
          style={{
            background: 'var(--text-primary)',
            transform: value ? 'translateX(22px)' : 'translateX(2px)',
          }}
        />
      </button>
      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</span>
    </div>
  );
});
