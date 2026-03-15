import Dexie, { type EntityTable } from 'dexie';
import type { Preset } from '@/types/preset';

interface AppSettings {
  key: string;
  value: unknown;
}

const db = new Dexie('WalrusControllerDB') as Dexie & {
  presets: EntityTable<Preset, 'id'>;
  settings: EntityTable<AppSettings, 'key'>;
};

db.version(1).stores({
  presets: 'id, deviceId, name, *tags, createdAt, modifiedAt',
  settings: 'key',
});

export { db };
