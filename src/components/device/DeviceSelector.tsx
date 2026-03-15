import { useMidiStore } from '@/stores/midi-store';

export function DeviceSelector() {
  const { inputs, outputs, selectedInputId, selectedOutputId, selectInput, selectOutput } =
    useMidiStore();

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          MIDI Input
        </label>
        <select
          value={selectedInputId ?? ''}
          onChange={(e) => e.target.value && selectInput(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select input…</option>
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name ?? input.id}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          MIDI Output
        </label>
        <select
          value={selectedOutputId ?? ''}
          onChange={(e) => e.target.value && selectOutput(e.target.value)}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select output…</option>
          {outputs.map((output) => (
            <option key={output.id} value={output.id}>
              {output.name ?? output.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
