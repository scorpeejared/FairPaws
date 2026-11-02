import { create } from 'zustand';
import { loadSettings, saveSetting } from '@/db/billRepo';
import { getDb } from '@/db/database';
import { settingsSchema, type Settings } from '@/domain/validation';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: settingsSchema.parse({}),
  loaded: false,
  async load() {
    const settings = await loadSettings(await getDb());
    set({ settings, loaded: true });
  },
  async set(key, value) {
    // Optimistic: the UI reacts immediately, persistence follows.
    set({ settings: { ...get().settings, [key]: value } });
    await saveSetting(await getDb(), key, value);
  },
}));
