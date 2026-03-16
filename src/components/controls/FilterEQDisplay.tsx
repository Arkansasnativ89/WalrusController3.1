import { useRef, useEffect, useState } from 'react';

// ── Frequency helpers (match DeviceControlSurface formatHPF/formatLPF) ──────

function hpfToHz(val: number): number {
  if (val === 0) return 20;
  return Math.round(20 * Math.pow(10, val / 127));
}

function lpfToHz(val: number): number {
  if (val === 0) return 20000;
  return Math.round(20000 * Math.pow(0.05, val / 127));
}

function formatFreq(hz: number): string {
  return hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${hz} Hz`;
}

// ── Canvas constants ─────────────────────────────────────────────────────────

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const LOG_RANGE = Math.log10(MAX_FREQ / MIN_FREQ); // log10(1000) = 3
const CANVAS_H = 96;
const LABEL_H = 16;
const CURVE_H = CANVAS_H - LABEL_H;
const DB_MIN = -30;
const DB_MAX = 18;
const DB_RANGE = DB_MAX - DB_MIN;

const GRID_FREQS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const GRID_LABELS: Record<number, string> = {
  20: '20Hz', 50: '50Hz', 100: '100Hz', 200: '200Hz', 500: '500Hz',
  1000: '1kHz', 2000: '2kHz', 5000: '5kHz', 10000: '10kHz', 20000: '20kHz',
};

function freqToX(freq: number, W: number): number {
  return W * Math.log10(freq / MIN_FREQ) / LOG_RANGE;
}

// ── Component ────────────────────────────────────────────────────────────────

interface FilterEQDisplayProps {
  hpfValue: number;
  lpfValue: number;
  presenceValue: number;
  resonanceValue: number;
  onHpfChange: (val: number) => void;
  onLpfChange: (val: number) => void;
}

export function FilterEQDisplay({
  hpfValue, lpfValue, presenceValue, resonanceValue,
  onHpfChange, onLpfChange,
}: FilterEQDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(300);

  const hpfHz = hpfToHz(hpfValue);
  const lpfHz = lpfToHz(lpfValue);

  // Track container width for responsive canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(Math.round(entries[0].contentRect.width));
    });
    ro.observe(el);
    setContainerWidth(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // Draw EQ curve on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth < 10) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(containerWidth * dpr);
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const W = containerWidth;

    // Background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, W, CANVAS_H);

    // Frequency grid lines + labels
    ctx.strokeStyle = '#252525';
    ctx.lineWidth = 1;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a3a3a';
    for (const freq of GRID_FREQS) {
      const x = freqToX(freq, W);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CURVE_H);
      ctx.stroke();
      ctx.fillText(GRID_LABELS[freq], x, CANVAS_H - 3);
    }

    // Compute gain at each pixel column
    const ys = new Float32Array(W);
    const hpf_fc = hpfHz;
    const lpf_fc = lpfHz;
    const presence_db = (presenceValue / 127) * 10;
    const resonance_db = (resonanceValue / 127) * 12;

    for (let xi = 0; xi < W; xi++) {
      const f = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, xi / W);
      let db = 0;

      // HPF — 2nd order Butterworth response
      if (hpfValue > 0) {
        const r = f / hpf_fc;
        const g = (r * r) / Math.sqrt(1 + r * r * r * r);
        db += 20 * Math.log10(Math.max(g, 1e-6));
      }

      // LPF — 2nd order Butterworth response
      if (lpfValue > 0) {
        const r = lpf_fc / f;
        const g = (r * r) / Math.sqrt(1 + r * r * r * r);
        db += 20 * Math.log10(Math.max(g, 1e-6));
      }

      // Presence — broad bell at 5kHz (sigma = 2 octaves)
      if (presence_db > 0) {
        const oct = Math.log2(f / 5000);
        db += presence_db * Math.exp(-(oct * oct) / (2 * 4));
      }

      // Resonance — tighter bell at 90Hz (sigma = 1.4 octaves)
      if (resonance_db > 0) {
        const oct = Math.log2(Math.max(f, 1) / 90);
        db += resonance_db * Math.exp(-(oct * oct) / (2 * 2));
      }

      const norm = Math.max(0, Math.min(1, (db - DB_MIN) / DB_RANGE));
      ys[xi] = CURVE_H * (1 - norm);
    }

    // Amber gradient fill below the curve
    ctx.beginPath();
    ctx.moveTo(0, CURVE_H);
    for (let xi = 0; xi < W; xi++) ctx.lineTo(xi, ys[xi]);
    ctx.lineTo(W - 1, CURVE_H);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, CURVE_H);
    grad.addColorStop(0, 'rgba(212,144,32,0.65)');
    grad.addColorStop(1, 'rgba(212,144,32,0.08)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Curve line
    ctx.beginPath();
    for (let xi = 0; xi < W; xi++) {
      if (xi === 0) ctx.moveTo(xi, ys[xi]);
      else ctx.lineTo(xi, ys[xi]);
    }
    ctx.strokeStyle = 'rgba(212,144,32,0.88)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dashed cutoff frequency markers
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(212,144,32,0.4)';
    if (hpfValue > 0) {
      const x = freqToX(hpf_fc, W);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CURVE_H); ctx.stroke();
    }
    if (lpfValue > 0) {
      const x = freqToX(lpf_fc, W);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CURVE_H); ctx.stroke();
    }
    ctx.setLineDash([]);
  }, [containerWidth, hpfValue, lpfValue, presenceValue, resonanceValue, hpfHz, lpfHz]);

  // ── Slider drag handling ─────────────────────────────────────────────────

  const hpfTrackRef = useRef<HTMLDivElement>(null);
  const lpfTrackRef = useRef<HTMLDivElement>(null);
  const draggingHpf = useRef(false);
  const draggingLpf = useRef(false);

  const updateHpf = (clientX: number) => {
    const track = hpfTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    onHpfChange(Math.round(x * 127));
  };

  const updateLpf = (clientX: number) => {
    const track = lpfTrackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
    onLpfChange(Math.round((1 - x) * 127)); // inverted: drag left = higher value
  };

  const hpfPct = hpfValue / 127;
  const lpfPct = 1 - lpfValue / 127; // thumb position (inverted)

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-0.5"
        style={{ fontSize: '9px', fontFamily: 'monospace' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>
          HPF{' '}
          <span style={{ color: 'var(--border)' }}>CC 36</span>
        </span>
        <span style={{ color: 'var(--accent-acs1)' }}>
          {hpfValue === 0 ? 'Off' : formatFreq(hpfHz)}
          <span style={{ color: 'var(--border)', margin: '0 8px' }}>|</span>
          {lpfValue === 0 ? 'Off' : formatFreq(lpfHz)}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--border)' }}>CC 37</span>{' '}LPF
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full rounded overflow-hidden"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: `${CANVAS_H}px` }}
        />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-3">
        {/* HPF — drag right to raise cutoff */}
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            HIGH PASS — CUT BELOW
          </span>
          <div
            ref={hpfTrackRef}
            className="relative h-3.5 rounded cursor-pointer"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
            onPointerDown={(e) => {
              draggingHpf.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateHpf(e.clientX);
            }}
            onPointerMove={(e) => { if (draggingHpf.current) updateHpf(e.clientX); }}
            onPointerUp={() => { draggingHpf.current = false; }}
            onPointerCancel={() => { draggingHpf.current = false; }}
          >
            <div
              className="absolute top-0 left-0 h-full rounded"
              style={{ width: `${hpfPct * 100}%`, background: 'rgba(212,144,32,0.2)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                left: `calc(${hpfPct * 100}% - 5px)`,
                background: 'var(--accent-acs1)',
                boxShadow: '0 0 5px rgba(212,144,32,0.6)',
              }}
            />
          </div>
          <div
            className="flex justify-between"
            style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
          >
            <span>20 Hz</span>
            <span>200 Hz</span>
          </div>
        </div>

        {/* LPF — drag left to lower cutoff */}
        <div className="flex flex-col gap-1">
          <span
            className="block text-right"
            style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
          >
            LOW PASS — CUT ABOVE
          </span>
          <div
            ref={lpfTrackRef}
            className="relative h-3.5 rounded cursor-pointer"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
            onPointerDown={(e) => {
              draggingLpf.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateLpf(e.clientX);
            }}
            onPointerMove={(e) => { if (draggingLpf.current) updateLpf(e.clientX); }}
            onPointerUp={() => { draggingLpf.current = false; }}
            onPointerCancel={() => { draggingLpf.current = false; }}
          >
            <div
              className="absolute top-0 right-0 h-full rounded"
              style={{ width: `${(1 - lpfPct) * 100}%`, background: 'rgba(212,144,32,0.2)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                left: `calc(${lpfPct * 100}% - 5px)`,
                background: 'var(--accent-acs1)',
                boxShadow: '0 0 5px rgba(212,144,32,0.6)',
              }}
            />
          </div>
          <div
            className="flex justify-between"
            style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
          >
            <span>1 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
