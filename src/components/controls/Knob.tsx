import { useCallback, useRef, useState } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  hideLabel?: boolean;
}

const START_ANGLE = 225;
const SWEEP = 270;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const diff = ((endAngle - startAngle + 360) % 360);
  const largeArc = diff > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function Knob({ value, min, max, label, onChange, size = 64, color, hideLabel }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const dragState = useRef({ startY: 0, startValue: 0, pointerId: -1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));
  const normalized = (value - min) / (max - min);
  const valueAngle = START_ANGLE + normalized * SWEEP;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const strokeW = Math.max(3, size * 0.06);
  const dotR = Math.max(2.5, size * 0.045);

  const trackPath = describeArc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP);
  const valuePath = normalized > 0.003 ? describeArc(cx, cy, r, START_ANGLE, valueAngle) : '';
  const dotPos = polarToCartesian(cx, cy, r, valueAngle);

  const arcColor = color ?? 'var(--accent-cyan)';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditing) return;
      e.preventDefault();
      dragState.current = { startY: e.clientY, startValue: value, pointerId: e.pointerId };
      setIsDragging(true);
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [value, isEditing],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragState.current.pointerId !== e.pointerId) return;
      const dy = dragState.current.startY - e.clientY;
      const sensitivity = e.shiftKey ? 0.25 : 1;
      const range = max - min;
      const delta = (dy * sensitivity * range) / 150;
      onChange(clamp(dragState.current.startValue + delta));
    },
    [min, max, onChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragState.current.pointerId !== e.pointerId) return;
      dragState.current.pointerId = -1;
      setIsDragging(false);
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      onChange(clamp(value + delta));
    },
    [value, min, max, onChange],
  );

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const commitEdit = useCallback(
    (raw: string) => {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) onChange(clamp(parsed));
      setIsEditing(false);
    },
    [min, max, onChange],
  );

  const cancelEdit = useCallback(() => setIsEditing(false), []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitEdit(e.currentTarget.value);
      else if (e.key === 'Escape') cancelEdit();
    },
    [commitEdit, cancelEdit],
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => commitEdit(e.currentTarget.value),
    [commitEdit],
  );

  return (
    <div className="flex flex-col items-center gap-1 select-none" style={{ width: size }}>
      <div
        className={`relative cursor-grab active:cursor-grabbing ${isDragging ? 'glow-ring' : ''}`}
        style={{ width: size, height: size }}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Knob body */}
          <circle cx={cx} cy={cy} r={r - strokeW} fill="var(--surface-raised)" />

          {/* Background track arc */}
          <path
            d={trackPath}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* Value arc */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )}

          {/* Position dot */}
          <circle cx={dotPos.x} cy={dotPos.y} r={dotR} fill={arcColor} />
        </svg>

        {/* Center value / inline edit */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              defaultValue={Math.round(value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="font-mono text-center bg-transparent border rounded"
              style={{
                width: size * 0.55,
                fontSize: Math.max(10, size * 0.18),
                color: 'var(--text-primary)',
                borderColor: arcColor,
                outline: 'none',
              }}
            />
          ) : (
            <span
              className="font-mono"
              style={{
                fontSize: Math.max(10, size * 0.2),
                color: 'var(--text-primary)',
              }}
            >
              {Math.round(value)}
            </span>
          )}
        </div>
      </div>

      {!hideLabel && (
        <span
          className="text-xs text-center leading-tight"
          style={{ color: 'var(--text-secondary)', width: size, display: 'block', wordBreak: 'break-word' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
