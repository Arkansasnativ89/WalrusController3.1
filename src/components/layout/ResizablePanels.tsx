import { useCallback, useRef, useState } from 'react';

interface ResizablePanelsProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplit?: number; // percentage for left panel, 0-100, default 45
  minLeft?: number; // min percentage, default 25
  minRight?: number; // min percentage, default 25
}

export function ResizablePanels({
  left,
  right,
  defaultSplit = 45,
  minLeft = 25,
  minRight = 25,
}: ResizablePanelsProps) {
  const [split, setSplit] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      const clamped = Math.max(minLeft, Math.min(100 - minRight, percent));
      setSplit(clamped);
    },
    [minLeft, minRight]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Left panel */}
      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ width: `${split}%`, flexShrink: 0 }}
      >
        {left}
      </div>

      {/* Divider */}
      <div
        className="flex-shrink-0 flex items-center justify-center cursor-col-resize group"
        style={{ width: '6px' }}
        onPointerDown={handlePointerDown}
      >
        <div
          className="w-[2px] h-full transition-colors duration-100"
          style={{
            background: 'var(--border)',
          }}
        />
      </div>

      {/* Right panel */}
      <div
        className="overflow-y-auto overflow-x-hidden flex-1"
      >
        {right}
      </div>
    </div>
  );
}
