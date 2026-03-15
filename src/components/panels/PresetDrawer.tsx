import { useState, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useDeviceStore } from '@/stores/device-store';
import { usePresetStore } from '@/stores/preset-store';
import type { Preset, ParameterValue } from '@/types/preset';

export function PresetDrawer() {
  const { presetDrawerOpen, setPresetDrawerOpen } = useUIStore();
  const { focusedDeviceId, profiles, devices, setAllParameters, sendAllParameters } =
    useDeviceStore();
  const { presets, savePreset, deletePreset } = usePresetStore();

  const activeProfile = profiles.find((p) => p.id === focusedDeviceId);
  const parameterValues = focusedDeviceId ? devices[focusedDeviceId]?.parameterValues ?? {} : {};

  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [abSlot, setAbSlot] = useState<'a' | 'b'>('a');
  const [snapshotA, setSnapshotA] = useState<Record<string, number> | null>(null);
  const [snapshotB, setSnapshotB] = useState<Record<string, number> | null>(null);

  const devicePresets = presets.filter(
    (p) => p.deviceId === activeProfile?.id
  );

  const handleSave = useCallback(() => {
    if (!activeProfile || !saveName.trim()) return;
    const now = new Date().toISOString();
    const parameters: ParameterValue[] = activeProfile.parameters.map((p) => ({
      parameterId: p.id,
      cc: p.cc,
      value: parameterValues[p.id] ?? p.default,
    }));
    const preset: Preset = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      deviceId: activeProfile.id,
      tags: [],
      parameters,
      createdAt: now,
      modifiedAt: now,
    };
    savePreset(preset);
    setSaveName('');
    setShowSaveForm(false);
  }, [activeProfile, saveName, parameterValues, savePreset]);

  const handleLoad = useCallback(
    (presetId: string) => {
      if (!focusedDeviceId) return;
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        const values: Record<string, number> = {};
        for (const pv of preset.parameters) {
          values[pv.parameterId] = pv.value;
        }
        setAllParameters(focusedDeviceId, values);
        sendAllParameters(focusedDeviceId);
      }
    },
    [presets, focusedDeviceId, setAllParameters, sendAllParameters]
  );

  const handleAbCapture = useCallback(() => {
    if (abSlot === 'a') {
      setSnapshotA({ ...parameterValues });
      setAbSlot('b');
    } else {
      setSnapshotB({ ...parameterValues });
      setAbSlot('a');
    }
  }, [abSlot, parameterValues]);

  const handleAbToggle = useCallback(
    (slot: 'a' | 'b') => {
      if (!focusedDeviceId) return;
      const snapshot = slot === 'a' ? snapshotA : snapshotB;
      if (snapshot) {
        setAllParameters(focusedDeviceId, snapshot);
        sendAllParameters(focusedDeviceId);
      }
    },
    [snapshotA, snapshotB, focusedDeviceId, setAllParameters, sendAllParameters]
  );

  const handleExport = useCallback(() => {
    const data = JSON.stringify(devicePresets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProfile?.id ?? 'presets'}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [devicePresets, activeProfile]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          for (const preset of imported) {
            if (preset.name && preset.deviceId && preset.values) {
              savePreset(preset);
            }
          }
        }
      } catch {
        // Invalid JSON - ignore
      }
    };
    input.click();
  }, [savePreset]);

  if (!presetDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={() => setPresetDrawerOpen(false)}
      />
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto flex flex-col"
        style={{
          width: 'var(--drawer-width)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: 'var(--navbar-height)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Presets — {activeProfile?.name?.replace('Walrus Audio ', '') ?? 'No Device'}
          </h2>
          <button
            onClick={() => setPresetDrawerOpen(false)}
            className="p-1 rounded"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* A/B Comparison */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              A/B Compare
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleAbToggle('a')}
                className="flex-1 py-1.5 rounded text-xs font-medium transition-led"
                style={{
                  background: snapshotA
                    ? 'var(--accent-navy)'
                    : 'var(--surface-raised)',
                  color: snapshotA
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                A {snapshotA ? '●' : '○'}
              </button>
              <button
                onClick={handleAbCapture}
                className="px-3 py-1.5 rounded text-xs font-medium transition-led"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Capture {abSlot.toUpperCase()}
              </button>
              <button
                onClick={() => handleAbToggle('b')}
                className="flex-1 py-1.5 rounded text-xs font-medium transition-led"
                style={{
                  background: snapshotB
                    ? 'var(--accent-navy)'
                    : 'var(--surface-raised)',
                  color: snapshotB
                    ? 'var(--accent-cyan)'
                    : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                B {snapshotB ? '●' : '○'}
              </button>
            </div>
          </section>

          {/* Save New */}
          <section>
            {showSaveForm ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Preset name…"
                  autoFocus
                  className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{
                    background: 'var(--accent-cyan-dim)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid var(--accent-cyan)',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-2 py-1.5 rounded text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full py-2 rounded text-xs font-medium transition-led"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px dashed var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.color = 'var(--accent-cyan)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                + Save Current State
              </button>
            )}
          </section>

          {/* Preset List */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Saved Presets ({devicePresets.length})
            </h3>
            {devicePresets.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No presets saved yet
              </p>
            ) : (
              <div className="space-y-1">
                {devicePresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between px-3 py-2 rounded transition-led group"
                    style={{ background: 'var(--surface-raised)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-raised)')
                    }
                  >
                    <button
                      onClick={() => handleLoad(preset.id)}
                      className="flex-1 text-left text-xs font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                      style={{ color: 'var(--accent-coral)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Import/Export */}
          <section
            className="pt-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-1.5 rounded text-xs font-medium transition-led"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Export JSON
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-1.5 rounded text-xs font-medium transition-led"
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Import JSON
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
