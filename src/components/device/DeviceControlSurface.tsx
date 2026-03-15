import { useDeviceStore } from '@/stores/device-store';
import { Knob } from '@/components/controls/Knob';
import { BipolarKnob } from '@/components/controls/BipolarKnob';
import { Toggle } from '@/components/controls/Toggle';
import { Selector } from '@/components/controls/Selector';
import { ThreeWaySwitch } from '@/components/controls/ThreeWaySwitch';
import { LinkedPairControl } from '@/components/controls/LinkedPairControl';
import type { DeviceParameter, DeviceProfile } from '@/types/device-profile';

/* ── Render helpers ────────────────────────────────────────────── */

function useParameterRenderer(deviceId: string) {
  const profile = useDeviceStore((s) => s.getProfile(deviceId));
  const deviceState = useDeviceStore((s) => s.devices[deviceId]);
  const setParameterValue = useDeviceStore((s) => s.setParameterValue);
  const setGroupLinked = useDeviceStore((s) => s.setGroupLinked);

  const parameterValues = deviceState?.parameterValues ?? {};
  const linkedGroups = deviceState?.linkedGroups ?? {};

  const getDynamicLabel = (param: DeviceParameter): string => {
    if (!param.dynamicLabel) return param.label;
    const controlValue = parameterValues[param.dynamicLabel.controlledBy];
    if (controlValue === undefined) return param.label;
    const entry = param.dynamicLabel.entries.find((e) => e.whenValue === controlValue);
    return entry?.label ?? param.label;
  };

  const renderedLinkedIds = new Set<string>();

  const renderParam = (param: DeviceParameter): React.ReactNode => {
    const value = parameterValues[param.id] ?? param.default;

    switch (param.type) {
      case 'continuous':
        return (
          <Knob
            key={param.id}
            value={value}
            min={param.min}
            max={param.max}
            label={getDynamicLabel(param)}
            onChange={(v) => setParameterValue(deviceId, param.id, v)}
          />
        );

      case 'bipolar':
        return (
          <BipolarKnob
            key={param.id}
            value={value}
            min={param.min}
            max={param.max}
            center={param.centerValue ?? 64}
            label={param.label}
            lowLabel={param.bipolarLabels?.low ?? 'Low'}
            highLabel={param.bipolarLabels?.high ?? 'High'}
            onChange={(v) => setParameterValue(deviceId, param.id, v)}
          />
        );

      case 'toggle':
        return (
          <Toggle
            key={param.id}
            value={value >= 64}
            label={param.label}
            onChange={(on) => setParameterValue(deviceId, param.id, on ? 127 : 0)}
          />
        );

      case 'select':
        return param.options ? (
          <Selector
            key={param.id}
            value={value}
            options={param.options}
            label={param.label}
            onChange={(v) => setParameterValue(deviceId, param.id, v)}
          />
        ) : null;

      case 'three_way':
        return param.zones ? (
          <ThreeWaySwitch
            key={param.id}
            value={value}
            zones={param.zones}
            label={param.label}
            onChange={(v) => setParameterValue(deviceId, param.id, v)}
          />
        ) : null;

      case 'linked_pair': {
        if (!profile) return null;
        if (renderedLinkedIds.has(param.id)) return null;

        const pairedParam = profile.parameters.find((p) => p.id === param.linkedTo);
        if (!pairedParam) {
          return (
            <Knob
              key={param.id}
              value={value}
              min={param.min}
              max={param.max}
              label={param.label}
              onChange={(v) => setParameterValue(deviceId, param.id, v)}
            />
          );
        }

        renderedLinkedIds.add(param.id);
        renderedLinkedIds.add(pairedParam.id);

        const pairedValue = parameterValues[pairedParam.id] ?? pairedParam.default;
        const group = param.group ?? 'other';
        const isLinked = linkedGroups[group] ?? true;

        return (
          <LinkedPairControl
            key={param.id}
            leftParam={param}
            rightParam={pairedParam}
            leftValue={value}
            rightValue={pairedValue}
            isLinked={isLinked}
            onChangeLeft={(v) => setParameterValue(deviceId, param.id, v)}
            onChangeRight={(v) => setParameterValue(deviceId, pairedParam.id, v)}
            onToggleLink={() => setGroupLinked(deviceId, group, !isLinked)}
          />
        );
      }

      default:
        return null;
    }
  };

  return { renderParam, renderedLinkedIds };
}

/* ── Group label map ───────────────────────────────────────────── */

const GROUP_LABELS: Record<string, string> = {
  program: 'Program',
  reverb: 'Reverb',
  dynamics: 'Dynamics',
  modulation: 'Modulation',
  tone: 'Tone',
  switches: 'Switches',
  system: 'System',
  eq: 'EQ',
  amp: 'Amp',
  'amp-model': 'Amp Model',
  cabinet: 'Cabinet',
  boost: 'Boost',
  filters: 'Filters',
  gate: 'Noise Gate',
  room: 'Room / Reverb',
  'post-amp-eq': 'Post-Amp EQ',
  volume: 'Volume',
  gain: 'Gain',
  bypass: 'Bypass',
  output: 'Output',
};

/* ── R1 Layout ─────────────────────────────────────────────────── */

const R1_GROUP_ORDER = [
  'program',
  'reverb',
  'dynamics',
  'modulation',
  'tone',
  'switches',
  'system',
];

function R1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const { renderParam } = useParameterRenderer(deviceId);

  // Group parameters
  const groups = new Map<string, DeviceParameter[]>();
  for (const param of profile.parameters) {
    const group = param.group ?? 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(param);
  }

  // Sort within groups
  for (const params of groups.values()) {
    params.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Ordered group list
  const orderedGroups = R1_GROUP_ORDER.filter((g) => groups.has(g));
  for (const key of groups.keys()) {
    if (!orderedGroups.includes(key)) orderedGroups.push(key);
  }

  return (
    <div className="space-y-5">
      {orderedGroups.map((groupKey) => {
        const params = groups.get(groupKey);
        if (!params || params.length === 0) return null;
        return (
          <div key={groupKey}>
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-3 pb-1"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {GROUP_LABELS[groupKey] ?? groupKey}
            </h3>
            <div className="flex flex-wrap gap-5 items-start">
              {params.map(renderParam)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ACS1 Channel Strip Layout ─────────────────────────────────── */

const ACS1_STRIP_ORDER = [
  'amp-model',
  'gain',
  'volume',
  'eq',
  'cabinet',
  'boost',
  'gate',
  'room',
  'post-amp-eq',
  'filters',
  'system',
];

function ACS1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const { renderParam } = useParameterRenderer(deviceId);

  // Group parameters
  const groups = new Map<string, DeviceParameter[]>();
  for (const param of profile.parameters) {
    const group = param.group ?? 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(param);
  }

  // Sort within groups
  for (const params of groups.values()) {
    params.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Ordered group list
  const orderedGroups = ACS1_STRIP_ORDER.filter((g) => groups.has(g));
  for (const key of groups.keys()) {
    if (!orderedGroups.includes(key)) orderedGroups.push(key);
  }

  return (
    <div className="space-y-5">
      {orderedGroups.map((groupKey) => {
        const params = groups.get(groupKey);
        if (!params || params.length === 0) return null;
        return (
          <div key={groupKey}>
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-3 pb-1"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {GROUP_LABELS[groupKey] ?? groupKey}
            </h3>
            <div className="flex flex-wrap gap-5 items-start">
              {params.map(renderParam)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Surface ──────────────────────────────────────────────── */

export function DeviceControlSurface({ deviceId }: { deviceId: string }) {
  const profile = useDeviceStore((s) => s.getProfile(deviceId));

  if (!profile) {
    return (
      <div
        className="flex items-center justify-center h-64"
        style={{ color: 'var(--text-muted)' }}
      >
        Select a device to view controls
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4 pb-2"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {profile.name}
        </h2>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Ch {profile.defaultChannel + 1}
        </span>
      </div>

      {/* Device-specific layout */}
      {profile.id === 'walrus-r1' ? (
        <R1Layout profile={profile} deviceId={deviceId} />
      ) : profile.id === 'walrus-acs1-mkii' ? (
        <ACS1Layout profile={profile} deviceId={deviceId} />
      ) : (
        <R1Layout profile={profile} deviceId={deviceId} />
      )}
    </div>
  );
}
