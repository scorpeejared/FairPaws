import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/store/settingsStore';

function run(fn: () => Promise<void>) {
  if (!useSettingsStore.getState().settings.haptics) return;
  // Haptics are decoration; devices without a motor must never surface an error.
  fn().catch(() => {});
}

export const haptics = {
  /** Toggles, chips, segmented controls. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Taps on primary actions, adding things. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
