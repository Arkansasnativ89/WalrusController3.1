import type { MidiPortInfo } from '../../src/types/midi';

/**
 * Mock MIDI device for CI testing without hardware.
 */
export class MockMIDIInput {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly type = 'input' as const;
  readonly state = 'connected' as const;
  readonly connection = 'open' as const;
  onmidimessage: ((event: { data: Uint8Array }) => void) | null = null;

  constructor(id: string, name: string, manufacturer = 'Walrus Audio') {
    this.id = id;
    this.name = name;
    this.manufacturer = manufacturer;
  }

  /** Simulate receiving a MIDI message */
  simulateMessage(data: Uint8Array): void {
    if (this.onmidimessage) {
      this.onmidimessage({ data });
    }
  }

  toPortInfo(): MidiPortInfo {
    return {
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      type: this.type,
      state: this.state,
      connection: this.connection,
    };
  }
}

export class MockMIDIOutput {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string;
  readonly type = 'output' as const;
  readonly state = 'connected' as const;
  readonly connection = 'open' as const;
  sentMessages: number[][] = [];

  constructor(id: string, name: string, manufacturer = 'Walrus Audio') {
    this.id = id;
    this.name = name;
    this.manufacturer = manufacturer;
  }

  send(data: number[]): void {
    this.sentMessages.push([...data]);
  }

  clear(): void {
    this.sentMessages = [];
  }

  toPortInfo(): MidiPortInfo {
    return {
      id: this.id,
      name: this.name,
      manufacturer: this.manufacturer,
      type: this.type,
      state: this.state,
      connection: this.connection,
    };
  }
}
