import { useCallback, useRef } from 'react';

interface BipolarSliderProps {
  value: number;
  min: number;
  max: number;
  center: number;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
  /** Label shown at the center tick position (e.g. "Neutral") */
  neutralLabel?: string;
}

export function BipolarSlider({
  value,
  min,
  max,
  center,
  lowLabel,
  highLabel,
  onChange,
  neutralLabel,
}: BipolarSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number>(-1);

  const isLow = value < center;
  const isHigh = value > center;
  const isCenter = value === center;

  const normalized = (value - min) / (max - min);
  const centerNorm = (center - min) / (max - min);

  const fillStart = Math.min(normalized, centerNorm);
  const fillEnd = Math.max(normalized, centerNorm);
  const fillColor = isLow ? 'var(--accent-peach)' : 'var(--accent-cyan)';
  const valueColor = isCenter ? 'var(--accent-cyan)' : fillColor;

  const valueFromPointer = useCallback(
    (e: React.PointerEvent) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      return Math.round(min + x * (max - min));
    },
    [min, max],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      pointerRef.current = e.pointerId;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      onChange(valueFromPointer(e));
    },
    [onChange, valueFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (pointerRef.current !== e.pointerId) return;
      onChange(valueFromPointer(e));
    },
    [onChange, valueFromPointer],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (pointerRef.current !== e.pointerId) return;
      pointerRef.current = -1;
    },
    [],
  );

  const handleDoubleClick = useCallback(() => onChange(center), [center, onChange]);

  return (
    <div className="flex flex-col gap-1 w-full select-none">
      {/* Track row */}
      <div className="flex items-center gap-2">
        {/* Low end label */}
        <span
          className="text-[10px] font-semibold uppercase tracking-wide shrink-0"
          style={{ color: isLow ? 'var(--accent-peach)' : 'var(--text-muted)' }}
        >
          ◄ {lowLabel}
        </span>

        {/* Track */}
        <div
          ref={trackRef}
          className="relative flex-1"
          style={{ height: 24, cursor: 'ew-resize', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        >
          {/* Background rail */}
          <div
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: 0,
              right: 0,
              height: 6,
              transform: 'translateY(-50%)',
              background: 'var(--border)',
            }}
          />

          {/* Colored fill from center toward thumb */}
          {!isCenter && (
            <div
              className="absolute rounded-full"
              style={{
                top: '50%',
                height: 6,
                transform: 'translateY(-50%)',
                left: `${fillStart * 100}%`,
                right: `${(1 - fillEnd) * 100}%`,
                background: fillColor,
                boxShadow: `0 0 6px ${fillColor}40`,
              }}
            />
          )}

          {/* Center detent tick */}
          <div
            className="absolute rounded"
            style={{
              top: '50%',
              left: `${centerNorm * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 2,
              height: 14,
              background: isCenter ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}
          />

          {/* Thumb */}
          <div
            className="absolute rounded-full transition-led"
            style={{
              top: '50%',
              left: `${normalized * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 14,
              height: 14,
              background: isCenter ? 'var(--accent-cyan)' : fillColor,
              border: '2px solid var(--surface)',
              boxShadow: `0 0 8px ${valueColor}80`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* High end label */}
        <span
          className="text-[10px] font-semibold uppercase tracking-wide shrink-0"
          style={{ color: isHigh ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          {highLabel} ►
        </span>
      </div>

      {/* Neutral position label — centered in the track column (≈ center tick) */}
      {neutralLabel && (
        <span
          className="block text-center text-[9px]"
          style={{ color: isCenter ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
        >
          {neutralLabel}
        </span>
      )}

      {/* Value readout */}
      <span
        className="block text-center font-mono text-[11px] font-semibold"
        style={{ color: valueColor }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}
