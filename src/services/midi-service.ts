import type { MidiPortInfo } from '@/types/midi';
import { parseMidiMessage } from '@/utils/midi-utils';
import type { MidiMessage } from '@/types/midi';

type MidiMessageCallback = (message: MidiMessage) => void;
type ConnectionCallback = (inputs: MidiPortInfo[], outputs: MidiPortInfo[]) => void;

class MidiService {
  private access: MIDIAccess | null = null;
  private selectedInput: MIDIInput | null = null;
  private selectedOutput: MIDIOutput | null = null;
  private messageListeners: Set<MidiMessageCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();
  private boundOnMessage = this.handleMessage.bind(this);

  /** Check if the browser supports Web MIDI */
  get isSupported(): boolean {
    return 'requestMIDIAccess' in navigator;
  }

  /** Request MIDI access and start listening for device changes */
  async connect(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Web MIDI API is not supported in this browser.');
    }

    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.access.onstatechange = () => this.notifyConnectionChange();
    this.notifyConnectionChange();
  }

  /** Disconnect and clean up */
  disconnect(): void {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
      this.selectedInput = null;
    }
    this.selectedOutput = null;
    if (this.access) {
      this.access.onstatechange = null;
      this.access = null;
    }
  }

  /** Get all available input ports */
  getInputs(): MidiPortInfo[] {
    if (!this.access) return [];
    return Array.from(this.access.inputs.values()).map(this.portToInfo);
  }

  /** Get all available output ports */
  getOutputs(): MidiPortInfo[] {
    if (!this.access) return [];
    return Array.from(this.access.outputs.values()).map(this.portToInfo);
  }

  /** Select an input port by ID */
  selectInput(id: string): void {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
    }

    if (!this.access) return;

    const input = this.access.inputs.get(id);
    if (!input) {
      throw new Error(`MIDI input "${id}" not found.`);
    }

    this.selectedInput = input;
    this.selectedInput.onmidimessage = this.boundOnMessage;
  }

  /** Select an output port by ID */
  selectOutput(id: string): void {
    if (!this.access) return;

    const output = this.access.outputs.get(id);
    if (!output) {
      throw new Error(`MIDI output "${id}" not found.`);
    }

    this.selectedOutput = output;
  }

  /** Send raw MIDI data to the selected output */
  send(data: Uint8Array | number[]): void {
    if (!this.selectedOutput) {
      throw new Error('No MIDI output selected.');
    }
    this.selectedOutput.send(Array.from(data));
  }

  /** Subscribe to incoming MIDI messages */
  onMessage(callback: MidiMessageCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /** Subscribe to connection state changes */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  /** Notify outgoing messages to listeners (for the monitor) */
  notifyOutgoing(data: Uint8Array): void {
    const msg = parseMidiMessage(data, 'out');
    this.messageListeners.forEach((cb) => cb(msg));
  }

  private handleMessage(event: Event): void {
    const midiEvent = event as MIDIMessageEvent;
    if (!midiEvent.data) return;
    const msg = parseMidiMessage(midiEvent.data, 'in');
    this.messageListeners.forEach((cb) => cb(msg));
  }

  private notifyConnectionChange(): void {
    const inputs = this.getInputs();
    const outputs = this.getOutputs();
    this.connectionListeners.forEach((cb) => cb(inputs, outputs));
  }

  private portToInfo(port: MIDIPort): MidiPortInfo {
    return {
      id: port.id,
      name: port.name,
      manufacturer: port.manufacturer,
      type: port.type,
      state: port.state,
      connection: port.connection,
    };
  }
}

/** Singleton MIDI service instance */
export const midiService = new MidiService();
