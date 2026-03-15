/// <reference types="vite/client" />

interface Navigator {
  requestMIDIAccess(options?: MIDIOptions): Promise<MIDIAccess>;
}

interface MIDIOptions {
  sysex?: boolean;
  software?: boolean;
}

interface MIDIAccess extends EventTarget {
  readonly inputs: MIDIInputMap;
  readonly outputs: MIDIOutputMap;
  readonly sysexEnabled: boolean;
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

interface MIDIInputMap extends ReadonlyMap<string, MIDIInput> {}
interface MIDIOutputMap extends ReadonlyMap<string, MIDIOutput> {}

interface MIDIPort extends EventTarget {
  readonly id: string;
  readonly manufacturer: string | null;
  readonly name: string | null;
  readonly type: 'input' | 'output';
  readonly version: string | null;
  readonly state: 'connected' | 'disconnected';
  readonly connection: 'open' | 'closed' | 'pending';
  onstatechange: ((event: MIDIConnectionEvent) => void) | null;
  open(): Promise<MIDIPort>;
  close(): Promise<MIDIPort>;
}

interface MIDIInput extends MIDIPort {
  readonly type: 'input';
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIOutput extends MIDIPort {
  readonly type: 'output';
  send(data: number[] | Uint8Array, timestamp?: number): void;
  clear(): void;
}

interface MIDIMessageEvent extends Event {
  readonly data: Uint8Array;
}

interface MIDIConnectionEvent extends Event {
  readonly port: MIDIPort;
}
