import { useCallback, useRef, useState } from 'react';

interface BipolarKnobProps {
  value: number;
  min: number;
  max: number;
  center: number;
  label: string;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
  size?: number;
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
  const diff = (endAngle - startAngle + 360) % 360;
  const largeArc = diff > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function BipolarKnob({
  value,
  min,
  max,
  center,
  label,
  lowLabel,
  highLabel,
  onChange,
  size = 64,
}: BipolarKnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const dragState = useRef({ startY: 0, startValue: 0, pointerId: -1 });
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));
  const normalized = (value - min) / (max - min);
  const valueAngle = START_ANGLE + normalized * SWEEP;
  const centerAngle = START_ANGLE + ((center - min) / (max - min)) * SWEEP;

  const isCenter = value === center;
  const isLow = value < center;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const strokeW = Math.max(3, size * 0.06);
  const dotR = Math.max(2.5, size * 0.045);
  const detentLen = Math.max(4, size * 0.08);

  const trackPath = describeArc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP);
  const dotPos = polarToCartesian(cx, cy, r, valueAngle);
  const detentOuter = polarToCartesian(cx, cy, r + strokeW / 2 + 1, centerAngle);
  const detentInner = polarToCartesian(cx, cy, r + strokeW / 2 + 1 + detentLen, centerAngle);

  // Colored arc from center toward value
  let coloredPath = '';
  let arcColor = 'var(--border)';
  if (!isCenter) {
    if (isLow) {
      coloredPath = describeArc(cx, cy, r, valueAngle, centerAngle);
      arcColor = 'var(--accent-peach)';
    } else {
      coloredPath = describeArc(cx, cy, r, centerAngle, valueAngle);
      arcColor = 'var(--accent-cyan)';
    }
  }

  const glowColor = isCenter ? 'none' : isLow ? 'var(--accent-peach)' : 'var(--accent-cyan)';

  /* ---- interactions ---- */

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

  const handleKnobDoubleClick = useCallback(() => {
    onChange(center);
  }, [center, onChange]);

  const handleValueDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    },
    [],
  );

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

  /* ---- render ---- */

  return (
    <div className="flex flex-col items-center gap-1 select-none" style={{ width: size }}>
      {/* Zone labels */}
      <div
        className="flex justify-between w-full"
        style={{ fontSize: Math.max(9, size * 0.15), padding: '0 2px' }}
      >
        <span style={{ color: isLow ? 'var(--accent-peach)' : 'var(--text-muted)' }}>
          {lowLabel}
        </span>
        <span style={{ color: !isLow && !isCenter ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
          {highLabel}
        </span>
      </div>

      {/* Knob */}
      <div
        className="relative cursor-grab active:cursor-grabbing"
        style={{
          width: size,
          height: size,
          filter:
            isDragging && !isCenter
              ? `drop-shadow(0 0 6px ${glowColor})`
              : undefined,
        }}
        onDoubleClick={handleKnobDoubleClick}
        onWheel={handleWheel}
      >
        <svg
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

          {/* Colored arc from center */}
          {coloredPath && (
            <path
              d={coloredPath}
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )}

          {/* Center detent tick */}
          <line
            x1={detentOuter.x}
            y1={detentOuter.y}
            x2={detentInner.x}
            y2={detentInner.y}
            stroke="var(--text-muted)"
            strokeWidth={Math.max(1.5, size * 0.025)}
            strokeLinecap="round"
          />

          {/* Position dot */}
          <circle cx={dotPos.x} cy={dotPos.y} r={dotR} fill={isCenter ? 'var(--text-muted)' : arcColor} />
        </svg>

        {/* Center value / inline edit */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
          onDoubleClick={handleValueDoubleClick}
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
                pointerEvents: 'auto',
              }}
            />
          ) : (
            <span
              className="font-mono"
              style={{
                fontSize: Math.max(10, size * 0.2),
                color: 'var(--text-primary)',
                pointerEvents: 'auto',
              }}
              onDoubleClick={handleValueDoubleClick}
            >
              {Math.round(value)}
            </span>
          )}
        </div>
      </div>

      <span
        className="text-xs text-center truncate"
        style={{ color: 'var(--text-secondary)', maxWidth: size }}
      >
        {label}
      </span>
    </div>
  );
}
