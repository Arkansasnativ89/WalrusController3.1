import { useDeviceStore } from '@/stores/device-store';
import { Knob } from '@/components/controls/Knob';
import { BipolarKnob } from '@/components/controls/BipolarKnob';
import { Toggle } from '@/components/controls/Toggle';
import { Selector } from '@/components/controls/Selector';
import { ThreeWaySwitch } from '@/components/controls/ThreeWaySwitch';
import { LinkedPairControl } from '@/components/controls/LinkedPairControl';
import type { DeviceParameter, DeviceProfile } from '@/types/device-profile';

/* ── Render helpers ────────────────────────────────────────────── */

function useParameterRenderer(
  deviceId: string,
  profile: DeviceProfile | undefined,
  options?: { hideLink?: boolean },
) {
  const deviceState = useDeviceStore((s) => s.devices[deviceId]);
  const setParameterValue = useDeviceStore((s) => s.setParameterValue);
  const setGroupLinked = useDeviceStore((s) => s.setGroupLinked);

  const parameterValues = deviceState?.parameterValues ?? {};
  const linkedGroups = deviceState?.linkedGroups ?? {};
  const hideLink = options?.hideLink ?? false;

  const getDynamicLabel = (param: DeviceParameter): string => {
    if (!param.dynamicLabel) return param.label;
    const controlValue = parameterValues[param.dynamicLabel.controlledBy];
    if (controlValue === undefined) return param.label;
    const entry = param.dynamicLabel.entries.find((e) => e.whenValue === controlValue);
    return entry?.label ?? param.label;
  };

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
            hideLink={hideLink}
          />
        );
      }

      default:
        return null;
    }
  };

  return { renderParam };
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

/** Groups rendered side-by-side in a 2-column grid */
const R1_GRID_ROWS: [string, string][] = [
  ['dynamics', 'modulation'],
];

function R1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const { renderParam } = useParameterRenderer(deviceId, profile);

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

  // Build ordered render list, pairing grid-row groups side-by-side
  const seen = new Set<string>();
  const elements: React.ReactNode[] = [];

  for (const groupKey of [...R1_GROUP_ORDER, ...groups.keys()]) {
    if (seen.has(groupKey)) continue;
    seen.add(groupKey);

    const gridRow = R1_GRID_ROWS.find(([left]) => left === groupKey);
    if (gridRow) {
      const [left, right] = gridRow;
      seen.add(right);
      const leftParams = groups.get(left);
      const rightParams = groups.get(right);
      if (leftParams?.length || rightParams?.length) {
        elements.push(
          <div key={`${left}-${right}`} className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {leftParams?.length ? <ControlSection groupKey={left} params={leftParams} renderParam={renderParam} /> : <div />}
            {rightParams?.length ? <ControlSection groupKey={right} params={rightParams} renderParam={renderParam} /> : <div />}
          </div>,
        );
      }
    } else {
      const params = groups.get(groupKey);
      if (params?.length) {
        elements.push(
          <ControlSection key={groupKey} groupKey={groupKey} params={params} renderParam={renderParam} />,
        );
      }
    }
  }

  return <div className="space-y-5">{elements}</div>;
}

/* ── ACS1 Channel Strip Layout ─────────────────────────────────── */

/** Paired rows: each entry is [leftGroup, rightGroup] rendered side by side */
const ACS1_GRID_ROWS: [string, string | null][] = [
  ['amp-model', 'cabinet'],
  ['amp', 'eq'],
  ['boost', 'gate'],
  ['post-amp-eq', 'filters'],
  ['room', 'system'],
];

function ControlSection({
  groupKey,
  params,
  renderParam,
}: {
  groupKey: string;
  params: DeviceParameter[];
  renderParam: (p: DeviceParameter) => React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3
        className="text-[10px] font-semibold uppercase tracking-widest mb-3 pb-1"
        style={{
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {GROUP_LABELS[groupKey] ?? groupKey}
      </h3>
      <div className="flex flex-wrap gap-4 items-start">
        {params.map(renderParam)}
      </div>
    </div>
  );
}

function ACS1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const { renderParam } = useParameterRenderer(deviceId, profile, { hideLink: true });

  // Precompute right-pair IDs — the higher-order partner of each linked_pair.
  // These are filtered from the display list so only the "left" (primary) param renders.
  const rightIds = new Set<string>();
  for (const p of profile.parameters) {
    if (p.type === 'linked_pair' && p.linkedTo) {
      const paired = profile.parameters.find((q) => q.id === p.linkedTo);
      if (paired && (p.order ?? 0) < (paired.order ?? 0)) {
        rightIds.add(paired.id);
      }
    }
  }

  // Group parameters (right-side linked params are excluded)
  const groups = new Map<string, DeviceParameter[]>();
  for (const param of profile.parameters) {
    if (rightIds.has(param.id)) continue;
    const group = param.group ?? 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(param);
  }

  // Sort within groups
  for (const params of groups.values()) {
    params.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Collect groups that appear in the grid
  const gridGroupKeys = new Set(ACS1_GRID_ROWS.flat().filter(Boolean) as string[]);

  // Any remaining groups not in the grid
  const extraGroups: string[] = [];
  for (const key of groups.keys()) {
    if (!gridGroupKeys.has(key)) extraGroups.push(key);
  }

  return (
    <div className="space-y-5">
      {/* Paired grid rows */}
      {ACS1_GRID_ROWS.map(([left, right], i) => {
        const leftParams = groups.get(left);
        const rightParams = right ? groups.get(right) : undefined;
        if (!leftParams?.length && !rightParams?.length) return null;
        return (
          <div
            key={i}
            className="grid gap-5"
            style={{ gridTemplateColumns: rightParams?.length ? '1fr 1fr' : '1fr' }}
          >
            {leftParams?.length ? (
              <ControlSection groupKey={left} params={leftParams} renderParam={renderParam} />
            ) : <div />}
            {rightParams?.length ? (
              <ControlSection groupKey={right!} params={rightParams} renderParam={renderParam} />
            ) : null}
          </div>
        );
      })}

      {/* Any extra groups not in the grid */}
      {extraGroups.map((groupKey) => {
        const params = groups.get(groupKey);
        if (!params?.length) return null;
        return (
          <ControlSection key={groupKey} groupKey={groupKey} params={params} renderParam={renderParam} />
        );
      })}
    </div>
  );
}

/* ── Main Surface ──────────────────────────────────────────────── */

export function DeviceControlSurface({ deviceId }: { deviceId: string }) {
  const profile = useDeviceStore((s) => s.profiles.find((p) => p.id === deviceId));

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
