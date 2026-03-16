import { useDeviceStore } from '@/stores/device-store';
import { Knob } from '@/components/controls/Knob';
import { BipolarKnob } from '@/components/controls/BipolarKnob';
import { BipolarSlider } from '@/components/controls/BipolarSlider';
import { Toggle } from '@/components/controls/Toggle';
import { LedToggleButton } from '@/components/controls/LedToggleButton';
import { Selector } from '@/components/controls/Selector';
import { ThreeWaySwitch } from '@/components/controls/ThreeWaySwitch';
import { LinkedPairControl } from '@/components/controls/LinkedPairControl';
import { FilterEQDisplay } from '@/components/controls/FilterEQDisplay';
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

/** Per-program color identities drawn from the physical pedal's ring LEDs */
const R1_PROGRAM_COLORS: Record<number, string> = {
  1: '#40C840', // Spring — green
  2: '#4880D0', // Hall — blue
  3: '#C09020', // Plate — amber
  4: '#C03030', // BFR — red
  5: '#8030C0', // RFRCT — purple
  6: '#20A090', // Air — teal
};

/** Groups whose inner controls are rendered in a fixed N-column grid */
const R1_COLUMNS: Record<string, number> = {
  reverb: 3,
  tone: 3,
  switches: 3,
};

/** Per-parameter LED colors for the R1 system group */
const R1_SYSTEM_COLORS: Record<string, string> = {
  'r1-bypass': 'var(--accent-cyan)',
  'r1-sustain': 'var(--accent-yellow)',
};

function R1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const { renderParam } = useParameterRenderer(deviceId, profile);
  const parameterValues = useDeviceStore((s) => s.devices[deviceId]?.parameterValues ?? {});
  const setParameterValue = useDeviceStore((s) => s.setParameterValue);

  // Build group → params map
  const groups = new Map<string, DeviceParameter[]>();
  for (const param of profile.parameters) {
    const group = param.group ?? 'other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(param);
  }
  for (const params of groups.values()) {
    params.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const pv = (id: string) =>
    parameterValues[id] ?? profile.parameters.find((p) => p.id === id)?.default ?? 0;
  const set = (id: string, v: number) => setParameterValue(deviceId, id, v);

  // Pre-resolve custom sections
  const programParam = groups.get('program')?.[0];
  const dynamicsParams = groups.get('dynamics') ?? [];
  const modulationParams = groups.get('modulation') ?? [];

  // Modulation column explicitly includes Pre Delay — it controls when reverb starts,
  // making it temporally related to Rate and Depth. It also remains in the Reverb group.
  const preDelayParam = profile.parameters.find((p) => p.id === 'r1-pre-delay');
  const modColumnParams = [
    ...modulationParams,
    ...(preDelayParam ? [preDelayParam] : []),
  ];

  // X knob dynamic hint — updates as program changes
  const progValue = pv('r1-prog');
  const xParam = profile.parameters.find((p) => p.id === 'r1-x');
  const xEntry = xParam?.dynamicLabel?.entries.find((e) => e.whenValue === progValue);
  const xHint = xEntry
    ? `X (${xEntry.label}) — ${xEntry.description?.replace(/→/g, '↔') ?? ''}`
    : null;

  // Generic groups rendered after the custom sections (reverb, tone, switches + any extras).
  // 'system' is excluded here and rendered separately as full-width LED toggle buttons.
  const customKeys = new Set(['program', 'dynamics', 'modulation', 'system']);
  const genericOrder = ['reverb', 'tone', 'switches'];
  const extraKeys = [...groups.keys()].filter((k) => !customKeys.has(k) && !genericOrder.includes(k));
  const genericGroups = [...genericOrder, ...extraKeys];

  const systemParams = groups.get('system') ?? [];

  const sectionHeader = (label: string) => (
    <h3
      className="text-[10px] font-semibold uppercase tracking-widest mb-2 pb-1"
      style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {label}
    </h3>
  );

  return (
    <div className="space-y-6">

      {/* ── Program ── */}
      {programParam?.options && (
        <div>
          {sectionHeader('Program')}
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {programParam.options.map((opt) => {
              const color = R1_PROGRAM_COLORS[opt.value] ?? 'var(--accent-cyan)';
              const isActive = opt.value === pv(programParam.id);
              return (
                <button
                  key={opt.value}
                  onClick={() => set(programParam.id, opt.value)}
                  className="relative py-2.5 rounded text-xs font-semibold transition-led overflow-hidden"
                  style={{
                    background: isActive ? `${color}22` : 'var(--surface-raised)',
                    border: `1px solid ${isActive ? color : 'var(--border)'}`,
                    color: isActive ? color : 'var(--text-secondary)',
                    boxShadow: isActive
                      ? `0 0 12px ${color}30, inset 0 0 10px ${color}15`
                      : 'none',
                  }}
                >
                  {/* Subtle color accent line for inactive buttons */}
                  {!isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0"
                      style={{ height: 2, background: `${color}55` }}
                    />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dynamics + Modulation ── */}
      {(dynamicsParams.length > 0 || modColumnParams.length > 0) && (
        <div>
          {sectionHeader('Dynamics + Modulation')}
          {/* Two siblings share one container with a 1px divider */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1px 1fr' }}>

            {/* Dynamics column */}
            <div className="pr-6">
              {dynamicsParams.map((param) => {
                if (param.type === 'bipolar') {
                  const value = pv(param.id);
                  return (
                    <div key={param.id} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-semibold uppercase tracking-widest"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {param.label}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--border)' }}>
                          CC {param.cc}
                        </span>
                      </div>
                      <BipolarSlider
                        value={value}
                        min={param.min}
                        max={param.max}
                        center={param.centerValue ?? 64}
                        lowLabel={param.bipolarLabels?.low ?? 'Low'}
                        highLabel={param.bipolarLabels?.high ?? 'High'}
                        neutralLabel="Neutral"
                        onChange={(v) => set(param.id, v)}
                      />
                    </div>
                  );
                }
                return renderParam(param);
              })}
            </div>

            {/* 1px column divider */}
            <div style={{ background: 'var(--border-subtle)' }} />

            {/* Modulation column */}
            <div className="pl-6">
              <h4
                className="text-[9px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Modulation
              </h4>
              <div
                className="grid gap-3 justify-items-center"
                style={{ gridTemplateColumns: `repeat(${modColumnParams.length}, 1fr)` }}
              >
                {modColumnParams.map(renderParam)}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Generic groups: reverb, tone, switches ── */}
      {genericGroups.map((groupKey) => {
        const params = groups.get(groupKey);
        if (!params?.length) return null;

        // Tone gets a dynamic X-knob hint line below the controls
        if (groupKey === 'tone') {
          return (
            <div key="tone">
              {sectionHeader(GROUP_LABELS['tone'] ?? 'Tone')}
              <div
                className="grid gap-4 items-start justify-items-center"
                style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
              >
                {params.map(renderParam)}
              </div>
              {xHint && (
                <p className="mt-3 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {xHint}
                </p>
              )}
            </div>
          );
        }

        return (
          <ControlSection
            key={groupKey}
            groupKey={groupKey}
            params={params}
            renderParam={renderParam}
            columns={R1_COLUMNS[groupKey]}
          />
        );
      })}

      {/* ── System: full-width LED toggle buttons ── */}
      {systemParams.length > 0 && (
        <div>
          {sectionHeader('System')}
          <div className="grid grid-cols-2 gap-3">
            {systemParams.map((param) => {
              const val = pv(param.id);
              return (
                <LedToggleButton
                  key={param.id}
                  value={val >= 64}
                  label={param.label}
                  activeColor={R1_SYSTEM_COLORS[param.id] ?? 'var(--accent-cyan)'}
                  onChange={(on) => set(param.id, on ? 127 : 0)}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

/* ── ACS1 Channel Strip Layout ─────────────────────────────────── */

/* ── ACS1 MKII Custom Layout helpers ──────────────────────────── */

/** Rough HPF frequency display (0 = Off, 1–127 ≈ 20 Hz – 1 kHz) */

/** Label stack: name (small caps) + CC number + widget + orange value */
function ACS1Cell({
  label, cc, valueDisplay, children,
}: {
  label: string;
  cc: number;
  valueDisplay: string | number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-[9px] font-semibold uppercase tracking-wider leading-none text-center"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span className="text-[8px] font-mono leading-none" style={{ color: 'var(--border)' }}>
        CC{cc}
      </span>
      {children}
      <span className="text-[9px] font-mono leading-none text-center" style={{ color: 'var(--accent-peach)' }}>
        {valueDisplay}
      </span>
    </div>
  );
}

/** Titled sub-panel within the ACS1 global controls section */
function ACS1SubPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4
        className="text-[9px] font-semibold uppercase tracking-widest pb-1"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function ControlSection({
  groupKey,
  params,
  renderParam,
  columns,
}: {
  groupKey: string;
  params: DeviceParameter[];
  renderParam: (p: DeviceParameter) => React.ReactNode;
  columns?: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3
        className="text-[10px] font-semibold uppercase tracking-widest mb-2 pb-1"
        style={{
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {GROUP_LABELS[groupKey] ?? groupKey}
      </h3>
      {columns !== undefined ? (
        <div
          className="grid gap-4 items-start justify-items-center"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {params.map(renderParam)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 items-start">
          {params.map(renderParam)}
        </div>
      )}
    </div>
  );
}

/** One stereo channel strip column (L or R) for the ACS1 channel section */
function ACS1ChannelColumn({
  side, isStereoMode,
  ampParam, cabParam, gainParam, volParam, bassParam, midParam, trebleParam,
  vals, onSet,
}: {
  side: 'L' | 'R';
  isStereoMode: boolean;
  ampParam: DeviceParameter;
  cabParam: DeviceParameter;
  gainParam: DeviceParameter;
  volParam: DeviceParameter;
  bassParam: DeviceParameter;
  midParam: DeviceParameter;
  trebleParam: DeviceParameter;
  vals: Record<string, number>;
  onSet: (id: string, v: number) => void;
}) {
  const gv = (p: DeviceParameter) => vals[p.id] ?? p.default;
  const ampVal = gv(ampParam);
  const cabVal = gv(cabParam);
  const ampName = ampParam.options?.find((o) => o.value === ampVal)?.label ?? String(ampVal);
  const cabName = cabParam.options?.find((o) => o.value === cabVal)?.label ?? String(cabVal);

  return (
    <div
      className="flex flex-col gap-3 p-3 rounded min-w-0"
      style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}
    >
      {/* Channel badge — only in stereo mode */}
      {isStereoMode && (
        <div
          className="text-[9px] font-mono font-bold text-center py-0.5 rounded tracking-widest uppercase"
          style={{
            color: side === 'L' ? 'var(--accent-cyan)' : 'var(--accent-acs1)',
            background: side === 'L' ? 'var(--accent-cyan-dim)' : 'var(--accent-acs1-dim)',
            border: `1px solid ${side === 'L' ? 'var(--accent-cyan)' : 'var(--accent-acs1)'}`,
          }}
        >
          {side === 'L' ? 'Left' : 'Right'}
        </div>
      )}

      {/* Amp Model */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider leading-none" style={{ color: 'var(--text-muted)' }}>Amp Model</span>
        <span className="text-[8px] font-mono leading-none mb-1" style={{ color: 'var(--border)' }}>CC{ampParam.cc}</span>
        <Selector value={ampVal} options={ampParam.options!} label="" hideLabel dropdown fullWidth onChange={(v) => onSet(ampParam.id, v)} />
        <span className="text-[9px] font-mono truncate mt-0.5" style={{ color: 'var(--accent-peach)' }} title={ampName}>{ampName}</span>
      </div>

      {/* Cabinet IR */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider leading-none" style={{ color: 'var(--text-muted)' }}>Cabinet IR</span>
        <span className="text-[8px] font-mono leading-none mb-1" style={{ color: 'var(--border)' }}>CC{cabParam.cc}</span>
        <Selector value={cabVal} options={cabParam.options!} label="" hideLabel fullWidth onChange={(v) => onSet(cabParam.id, v)} />
        <span className="text-[9px] font-mono truncate mt-0.5" style={{ color: 'var(--accent-peach)' }} title={cabName}>{cabName}</span>
      </div>

      {/* Gain + Volume */}
      <div className={`grid gap-2 justify-items-center ${isStereoMode ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <ACS1Cell label="Gain" cc={gainParam.cc} valueDisplay={gv(gainParam)}>
          <Knob value={gv(gainParam)} min={gainParam.min} max={gainParam.max} label="" hideLabel onChange={(v) => onSet(gainParam.id, v)} size={52} />
        </ACS1Cell>
        <ACS1Cell label="Volume" cc={volParam.cc} valueDisplay={gv(volParam)}>
          <Knob value={gv(volParam)} min={volParam.min} max={volParam.max} label="" hideLabel onChange={(v) => onSet(volParam.id, v)} size={52} />
        </ACS1Cell>
        {!isStereoMode && <div />}
      </div>

      {/* Bass / Mid / Treble */}
      <div className="grid grid-cols-3 gap-2 justify-items-center">
        <ACS1Cell label="Bass" cc={bassParam.cc} valueDisplay={gv(bassParam)}>
          <Knob value={gv(bassParam)} min={bassParam.min} max={bassParam.max} label="" hideLabel onChange={(v) => onSet(bassParam.id, v)} size={44} />
        </ACS1Cell>
        <ACS1Cell label="Mid" cc={midParam.cc} valueDisplay={gv(midParam)}>
          <Knob value={gv(midParam)} min={midParam.min} max={midParam.max} label="" hideLabel onChange={(v) => onSet(midParam.id, v)} size={44} />
        </ACS1Cell>
        <ACS1Cell label="Treble" cc={trebleParam.cc} valueDisplay={gv(trebleParam)}>
          <Knob value={gv(trebleParam)} min={trebleParam.min} max={trebleParam.max} label="" hideLabel onChange={(v) => onSet(trebleParam.id, v)} size={44} />
        </ACS1Cell>
      </div>
    </div>
  );
}

function ACS1Layout({ profile, deviceId }: { profile: DeviceProfile; deviceId: string }) {
  const vals = useDeviceStore((s) => s.devices[deviceId]?.parameterValues ?? {});
  const isGroupLinked = useDeviceStore((s) => s.isGroupLinked);
  const setGroupLinked = useDeviceStore((s) => s.setGroupLinked);
  const setParamValue = useDeviceStore((s) => s.setParameterValue);

  const p = (id: string): DeviceParameter => profile.parameters.find((x) => x.id === id)!;
  const v = (id: string) => vals[id] ?? p(id).default;
  const set = (id: string, val: number) => setParamValue(deviceId, id, val);

  // Mono = linked (single column, L mirrors R); Stereo = unlinked (two independent columns)
  const firstLinkedGroup = profile.parameters.find((x) => x.type === 'linked_pair' && x.group)?.group ?? 'eq';
  const isLinked = isGroupLinked(deviceId, firstLinkedGroup);
  const isStereoMode = !isLinked;

  return (
    <div className="space-y-4">
      {/* Channel strip */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isStereoMode ? '1fr 1fr' : '1fr' }}
      >
        <ACS1ChannelColumn
          side="L" isStereoMode={isStereoMode}
          ampParam={p('acs1-amp-left')} cabParam={p('acs1-cab-left')}
          gainParam={p('acs1-gain-left')} volParam={p('acs1-vol-left')}
          bassParam={p('acs1-bass-left')} midParam={p('acs1-mid-left')} trebleParam={p('acs1-treble-left')}
          vals={vals} onSet={set}
        />
        {isStereoMode && (
          <ACS1ChannelColumn
            side="R" isStereoMode={isStereoMode}
            ampParam={p('acs1-amp-right')} cabParam={p('acs1-cab-right')}
            gainParam={p('acs1-gain-right')} volParam={p('acs1-vol-right')}
            bassParam={p('acs1-bass-right')} midParam={p('acs1-mid-right')} trebleParam={p('acs1-treble-right')}
            vals={vals} onSet={set}
          />
        )}
      </div>

      {/* Divider between channel strip and global controls */}
      <hr style={{ borderColor: 'var(--border)' }} />

      {/* ── Global Controls ─────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Signal Path */}
        <ACS1SubPanel title="Signal Path">
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: 'acs1-bypass', label: 'Bypass', onLabel: 'Engaged', offLabel: 'Bypassed', onColor: 'var(--accent-cyan)', onBg: 'var(--accent-cyan-dim)' },
              { id: 'acs1-amp-bypass', label: 'Amp Bypass', onLabel: 'Bypassed', offLabel: 'Active', onColor: 'var(--accent-coral)', onBg: 'var(--accent-coral-dim)' },
              { id: 'acs1-ir-bypass', label: 'IR Bypass', onLabel: 'Bypassed', offLabel: 'Active', onColor: 'var(--accent-coral)', onBg: 'var(--accent-coral-dim)' },
            ] as const).map(({ id, label, onLabel, offLabel, onColor, onBg }) => {
              const isOn = v(id) >= 64;
              return (
                <ACS1Cell key={id} label={label} cc={p(id).cc} valueDisplay={isOn ? onLabel : offLabel}>
                  <button
                    onClick={() => set(id, isOn ? 0 : 127)}
                    className="w-full px-3 py-1.5 rounded text-xs font-semibold transition-led"
                    style={{
                      background: isOn ? onBg : 'var(--surface-raised)',
                      border: `1px solid ${isOn ? onColor : 'var(--border)'}`,
                      color: isOn ? onColor : 'var(--text-secondary)',
                    }}
                  >
                    {isOn ? onLabel : offLabel}
                  </button>
                </ACS1Cell>
              );
            })}
          </div>
        </ACS1SubPanel>

        {/* Boost */}
        <ACS1SubPanel title="Boost">
          <div className="grid grid-cols-3 gap-3 justify-items-center">
            {(() => {
              const on = v('acs1-boost-engage') >= 64;
              return (
                <ACS1Cell label="Boost" cc={p('acs1-boost-engage').cc} valueDisplay={on ? 'On' : 'Off'}>
                  <button
                    onClick={() => set('acs1-boost-engage', on ? 0 : 127)}
                    className="w-full px-4 py-1.5 rounded text-xs font-semibold transition-led"
                    style={{
                      background: on ? 'var(--accent-yellow-dim)' : 'var(--surface-raised)',
                      border: `1px solid ${on ? 'var(--accent-yellow)' : 'var(--border)'}`,
                      color: on ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                    }}
                  >
                    {on ? 'On' : 'Off'}
                  </button>
                </ACS1Cell>
              );
            })()}
            <ACS1Cell label="Boost Gain" cc={p('acs1-boost-gain').cc} valueDisplay={v('acs1-boost-gain')}>
              <Knob value={v('acs1-boost-gain')} min={p('acs1-boost-gain').min} max={p('acs1-boost-gain').max} label="" hideLabel onChange={(n) => set('acs1-boost-gain', n)} size={52} />
            </ACS1Cell>
            <ACS1Cell label="Boost Vol" cc={p('acs1-boost-volume').cc} valueDisplay={v('acs1-boost-volume')}>
              <Knob value={v('acs1-boost-volume')} min={p('acs1-boost-volume').min} max={p('acs1-boost-volume').max} label="" hideLabel onChange={(n) => set('acs1-boost-volume', n)} size={52} />
            </ACS1Cell>
          </div>
        </ACS1SubPanel>

        {/* Tonestack & Gate */}
        <ACS1SubPanel title="Tonestack & Gate">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-3 justify-items-center">
              <ACS1Cell label="Presence" cc={p('acs1-presence').cc} valueDisplay={v('acs1-presence')}>
                <Knob value={v('acs1-presence')} min={p('acs1-presence').min} max={p('acs1-presence').max} label="" hideLabel onChange={(n) => set('acs1-presence', n)} size={52} />
              </ACS1Cell>
              <ACS1Cell label="Resonance" cc={p('acs1-resonance').cc} valueDisplay={v('acs1-resonance')}>
                <Knob value={v('acs1-resonance')} min={p('acs1-resonance').min} max={p('acs1-resonance').max} label="" hideLabel onChange={(n) => set('acs1-resonance', n)} size={52} />
              </ACS1Cell>
              <ACS1Cell label="Gate Thres" cc={p('acs1-gate-threshold').cc} valueDisplay={v('acs1-gate-threshold') === 0 ? 'Off' : v('acs1-gate-threshold')}>
                <Knob value={v('acs1-gate-threshold')} min={p('acs1-gate-threshold').min} max={p('acs1-gate-threshold').max} label="" hideLabel onChange={(n) => set('acs1-gate-threshold', n)} size={52} />
              </ACS1Cell>
              <ACS1Cell label="Gate Rel" cc={p('acs1-gate-release').cc} valueDisplay={v('acs1-gate-release')}>
                <Knob value={v('acs1-gate-release')} min={p('acs1-gate-release').min} max={p('acs1-gate-release').max} label="" hideLabel onChange={(n) => set('acs1-gate-release', n)} size={52} />
              </ACS1Cell>
            </div>
            <FilterEQDisplay
              hpfValue={v('acs1-hpf')}
              lpfValue={v('acs1-lpf')}
              presenceValue={v('acs1-presence')}
              resonanceValue={v('acs1-resonance')}
              onHpfChange={(val) => set('acs1-hpf', val)}
              onLpfChange={(val) => set('acs1-lpf', val)}
            />
          </div>
        </ACS1SubPanel>

        {/* Room / Reverb */}
        <ACS1SubPanel title="Room / Reverb">
          <div className="grid grid-cols-3 gap-3 items-start justify-items-center">
            {(() => {
              const rtParam = p('acs1-room-type');
              const rtVal = v('acs1-room-type');
              const rtLabel = rtParam.options?.find((o) => o.value === rtVal)?.label ?? String(rtVal);
              return (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  <span className="text-[9px] font-semibold uppercase tracking-wider leading-none text-center" style={{ color: 'var(--text-muted)' }}>Room Type</span>
                  <span className="text-[8px] font-mono leading-none" style={{ color: 'var(--border)' }}>CC{rtParam.cc}</span>
                  <Selector value={rtVal} options={rtParam.options!} label="" hideLabel fullWidth onChange={(n) => set('acs1-room-type', n)} />
                  <span className="text-[9px] font-mono text-center mt-0.5" style={{ color: 'var(--accent-peach)' }}>{rtLabel}</span>
                </div>
              );
            })()}
            <ACS1Cell label="Room Lvl" cc={p('acs1-room-level').cc} valueDisplay={v('acs1-room-level')}>
              <Knob value={v('acs1-room-level')} min={p('acs1-room-level').min} max={p('acs1-room-level').max} label="" hideLabel onChange={(n) => set('acs1-room-level', n)} size={52} />
            </ACS1Cell>
            <ACS1Cell label="Room Decay" cc={p('acs1-room-decay').cc} valueDisplay={v('acs1-room-decay')}>
              <Knob value={v('acs1-room-decay')} min={p('acs1-room-decay').min} max={p('acs1-room-decay').max} label="" hideLabel onChange={(n) => set('acs1-room-decay', n)} size={52} />
            </ACS1Cell>
          </div>
        </ACS1SubPanel>

      </div>
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
