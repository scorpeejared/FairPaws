import Constants from 'expo-constants';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { CurrencySheet } from '@/components/CurrencySheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { LuckyCat } from '@/components/ui/LuckyCat';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { getCurrency } from '@/domain/currency';
import { confirm, notify } from '@/lib/dialogs';
import { haptics } from '@/lib/haptics';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { row } from '@/theme/layout';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" tone="tertiary" style={{ paddingLeft: 4 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, set } = useSettingsStore();
  const billCount = useHistoryStore((s) => s.bills.length);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const refreshHistory = useHistoryStore((s) => s.refresh);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  // The count drives the delete-all button, so don't rely on the list having been visited.
  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);
  const currency = getCurrency(settings.currency);

  const save = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    set(key, value).catch(() => notify('Could not save', 'Your change was not stored. Please try again.'));
  };

  const confirmClear = async () => {
    haptics.warning();
    const confirmed = await confirm({
      title: 'Delete all bills?',
      message: `All ${billCount} saved ${billCount === 1 ? 'bill' : 'bills'} will be permanently removed.`,
      confirmLabel: 'Delete all',
    });
    if (!confirmed) return;
    clearAll().catch(() => notify('Could not delete', 'Please try again.'));
  };

  return (
    <Screen>
      <Header title="Settings" leading="close" />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Appearance">
          <Segmented
            value={settings.theme}
            onChange={(v) => save('theme', v)}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Section>

        <Section title="New bills">
          <Card padded={false}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Default currency, ${currency.name}`}
              pressedScale={0.99}
              onPress={() => setCurrencyOpen(true)}
            >
              <View style={{ ...row, padding: 16, gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text>Default currency</Text>
                  <Text variant="caption" tone="secondary">
                    {currency.name}
                  </Text>
                </View>
                <Text variant="bodyStrong" tone="accent">
                  {currency.code}
                </Text>
                <Icon name="chevron-right" size={18} color={colors.textTertiary} />
              </View>
            </PressableScale>
          </Card>
        </Section>

        <Section title="Feedback">
          <Card>
            <View style={{ ...row, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text>Haptic feedback</Text>
                <Text variant="caption" tone="secondary">
                  Tiny purrs when you tap and toggle.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Haptic feedback"
                value={settings.haptics}
                onValueChange={(v) => {
                  save('haptics', v);
                  if (v) haptics.select();
                }}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={colors.border}
              />
            </View>
          </Card>
        </Section>

        <Section title="Data">
          <Card style={{ gap: 12 }}>
            <Text variant="caption" tone="secondary">
              Bills are stored only on this device. There is no account and nothing is uploaded.
            </Text>
            <Button
              label="Delete all bills"
              icon="trash"
              variant="danger"
              disabled={billCount === 0}
              onPress={confirmClear}
            />
          </Card>
        </Section>

        <View style={{ alignItems: 'center', gap: 8, paddingTop: 8 }}>
          <LuckyCat size={96} animated={false} />
          <Text variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
            Fair Paws {Constants.expoConfig?.version ?? ''} · made with treats
          </Text>
        </View>
      </ScrollView>

      <CurrencySheet
        visible={currencyOpen}
        selected={settings.currency}
        onSelect={(code) => save('currency', code)}
        onClose={() => setCurrencyOpen(false)}
      />
    </Screen>
  );
}
