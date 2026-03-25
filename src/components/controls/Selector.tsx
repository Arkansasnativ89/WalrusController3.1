import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import type { ParameterOption } from '@/types/device-profile';

interface SelectorProps {
  value: number;
  options: ParameterOption[];
  label: string;
  onChange: (value: number) => void;
  /** Hide the built-in label text (use when a parent cell provides its own label) */
  hideLabel?: boolean;
  /** Force DropdownSelector regardless of option count */
  dropdown?: boolean;
  /** Make the dropdown button fill its container width */
  fullWidth?: boolean;
}

export const Selector = memo(function Selector({ value, options, label, onChange, hideLabel, dropdown, fullWidth }: SelectorProps) {
  if (dropdown) {
    return <DropdownSelector value={value} options={options} label={label} onChange={onChange} hideLabel={hideLabel} fullWidth={fullWidth} />;
  }
  if (options.length === 6) {
    return <GridSelector value={value} options={options} label={label} onChange={onChange} hideLabel={hideLabel} />;
  }
  if (options.length <= 5) {
    return <SegmentedSelector value={value} options={options} label={label} onChange={onChange} hideLabel={hideLabel} />;
  }
  return <DropdownSelector value={value} options={options} label={label} onChange={onChange} hideLabel={hideLabel} fullWidth={fullWidth} />;
});

function GridSelector({ value, options, label, onChange, hideLabel }: SelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</span>}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-2 py-1.5 text-xs font-medium rounded transition-led text-left truncate"
              title={opt.label}
              style={{
                background: isActive ? 'var(--accent-navy)' : 'var(--surface-raised)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border)'}`,
                boxShadow: isActive ? 'inset 0 0 8px var(--accent-cyan-dim)' : 'none',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SegmentedSelector({ value, options, label, onChange, hideLabel }: SelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</span>}
      <div
        className="flex w-fit rounded-md overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="px-2.5 py-1.5 text-xs font-medium transition-led"
              style={{
                background: isActive ? 'var(--accent-navy)' : 'var(--surface-raised)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderLeft: opt.value !== options[0]?.value ? '1px solid var(--border)' : 'none',
                boxShadow: isActive ? 'inset 0 0 8px var(--accent-cyan-dim)' : 'none',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropdownSelector({ value, options, label, onChange, hideLabel, fullWidth }: SelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '—';

  const filtered = useMemo(
    () => search
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options,
    [options, search],
  );

  const handleSelect = useCallback(
    (v: number) => {
      onChange(v);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      {!hideLabel && <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</span>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-md text-xs text-left flex items-center justify-between gap-2"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          minWidth: fullWidth ? '0' : '140px',
          width: fullWidth ? '100%' : undefined,
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full rounded-md overflow-hidden z-50"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxHeight: '200px',
          }}
        >
          <div style={{ padding: '4px', borderBottom: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-2 py-1 rounded text-xs outline-none"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '160px' }}>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-1.5 text-xs text-left transition-led ${opt.value !== value ? 'hover:bg-[var(--surface-hover)]' : ''}`}
                style={{
                  background: opt.value === value ? 'var(--accent-navy)' : 'transparent',
                  color: opt.value === value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                No matches
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
