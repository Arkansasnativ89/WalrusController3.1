interface ThreeWayZone {
  label: string;
  value: number;
  range: [number, number];
}

interface ThreeWaySwitchProps {
  value: number;
  zones: ThreeWayZone[];
  label: string;
  onChange: (value: number) => void;
}

function getActiveZone(value: number, zones: ThreeWayZone[]): number {
  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]!;
    if (value >= zone.range[0] && value <= zone.range[1]) return i;
  }
  return 0;
}

export function ThreeWaySwitch({ value, zones, label, onChange }: ThreeWaySwitchProps) {
  const activeIndex = getActiveZone(value, zones);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-center" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{label}</span>
      <div
        className="flex w-full rounded-md overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {zones.map((zone, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={zone.value}
              onClick={() => onChange(zone.value)}
              className="relative flex-1 px-2 py-1.5 text-xs font-medium transition-led"
              style={{
                background: isActive ? 'var(--accent-navy)' : 'var(--surface-raised)',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                boxShadow: isActive ? 'inset 0 0 8px var(--accent-cyan-dim)' : 'none',
              }}
            >
              {/* LED dot */}
              <span
                className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-led"
                style={{
                  background: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 0 8px var(--accent-cyan), 0 0 16px var(--accent-cyan-glow)' : 'none',
                }}
              />
              <span className="mt-1 block">{zone.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
