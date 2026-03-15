import { Knob } from './Knob';
import { Selector } from './Selector';
import type { DeviceParameter } from '@/types/device-profile';

interface LinkedPairControlProps {
  leftParam: DeviceParameter;
  rightParam: DeviceParameter;
  leftValue: number;
  rightValue: number;
  isLinked: boolean;
  onChangeLeft: (value: number) => void;
  onChangeRight: (value: number) => void;
  onToggleLink: () => void;
}

export function LinkedPairControl({
  leftParam,
  rightParam,
  leftValue,
  rightValue,
  isLinked,
  onChangeLeft,
  onChangeRight,
  onToggleLink,
}: LinkedPairControlProps) {
  const hasOptions = leftParam.options && leftParam.options.length > 0;
  const combinedLabel = leftParam.label.replace(/ L$/, '');

  const renderControl = (
    param: DeviceParameter,
    value: number,
    onChange: (v: number) => void,
    label: string,
  ) => {
    if (hasOptions && param.options) {
      return (
        <Selector
          value={value}
          options={param.options}
          label={label}
          onChange={onChange}
        />
      );
    }
    return (
      <Knob
        value={value}
        min={param.min}
        max={param.max}
        label={label}
        onChange={onChange}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-2">
        {/* Left / Combined control */}
        <div className="flex flex-col items-center">
          {renderControl(
            leftParam,
            leftValue,
            onChangeLeft,
            isLinked ? combinedLabel : leftParam.label,
          )}
        </div>

        {/* Link toggle */}
        <button
          onClick={onToggleLink}
          className="mb-5 p-1.5 rounded transition-led"
          title={isLinked ? 'Unlink L/R' : 'Link L/R'}
          style={{
            color: isLinked ? 'var(--accent-cyan)' : 'var(--text-muted)',
            background: isLinked ? 'var(--accent-cyan-dim)' : 'transparent',
            border: `1px solid ${isLinked ? 'var(--accent-cyan)' : 'var(--border)'}`,
          }}
          onMouseEnter={(e) => {
            if (!isLinked) e.currentTarget.style.borderColor = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            if (!isLinked) e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            {isLinked ? (
              <path
                d="M6 4H4a4 4 0 000 8h2m4-8h2a4 4 0 010 8h-2m-5-4h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M6 4H4a4 4 0 000 8h2m4-8h2a4 4 0 010 8h-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        {/* Right control (shown when unlinked) */}
        {!isLinked && (
          <div className="flex flex-col items-center">
            {renderControl(rightParam, rightValue, onChangeRight, rightParam.label)}
          </div>
        )}
      </div>
    </div>
  );
}
