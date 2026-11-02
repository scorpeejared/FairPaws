import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BillSummary } from '@/db/billRepo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CatFace } from '@/components/cat/CatFace';
import { PawTrail } from '@/components/cat/PawTrail';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingView, MessageView } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { formatMoney } from '@/domain/money';
import { haptics } from '@/lib/haptics';
import { formatBillDate } from '@/lib/date';
import { confirm, notify } from '@/lib/dialogs';
import { useEditorStore } from '@/store/editorStore';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { row } from '@/theme/layout';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { bills, status, error, refresh, remove, duplicate } = useHistoryStore();
  const currency = useSettingsStore((s) => s.settings.currency);
  const [selected, setSelected] = useState<BillSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const openBill = (id: string) => router.push({ pathname: '/bill/[id]', params: { id } });

  const startNew = () => {
    const id = useEditorStore.getState().startNew(currency);
    openBill(id);
  };

  const confirmDelete = async (bill: BillSummary) => {
    setSelected(null);
    haptics.warning();
    const confirmed = await confirm({
      title: 'Delete this bill?',
      message: `“${bill.title.trim() || 'Untitled bill'}” will be removed from your history. This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    remove(bill.id).catch(() => notify('Could not delete', 'Please try again.'));
  };

  const onDuplicate = async (bill: BillSummary) => {
    setSelected(null);
    try {
      const id = await duplicate(bill.id);
      haptics.success();
      if (id) openBill(id);
    } catch {
      notify('Could not duplicate', 'Please try again.');
    }
  };

  const showList = status === 'ready' && bills.length > 0;

  return (
    <Screen>
      <View style={{ ...row, paddingLeft: 20, paddingRight: 8, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1, ...row, gap: 12 }}>
          <Logo size={46} />
          <View style={{ flex: 1 }}>
            <Text variant="title" accessibilityRole="header">
              Fair Paws
            </Text>
            <Text tone="secondary">
              {showList
                ? `${bills.length} ${bills.length === 1 ? 'bill' : 'bills'} saved`
                : 'Split bills, purr-fectly.'}
            </Text>
          </View>
        </View>
        <IconButton icon="sliders" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      {status === 'loading' ? (
        <LoadingView label="Fetching your bills…" />
      ) : status === 'error' ? (
        <MessageView
          tone="danger"
          title="Oops, the cat dropped your bills"
          message={error ?? 'Something went wrong.'}
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : bills.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <PawTrail />
          <MessageView
            mood="sleepy"
            title="Nap time, no bills yet"
            message="Start a bill, add who's at the table, and see exactly who owes what."
          />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 110, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}
              layout={LinearTransition}
            >
              <BillRow bill={item} onPress={() => openBill(item.id)} onMore={() => setSelected(item)} />
            </Animated.View>
          )}
        />
      )}

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}
      >
        <Button label="New bill" icon="paw" onPress={startNew} />
      </View>

      <Sheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title.trim() || 'Untitled bill'}
      >
        <View style={{ gap: 8 }}>
          <Button
            label="Open"
            icon="chevron-right"
            variant="secondary"
            onPress={() => selected && (setSelected(null), openBill(selected.id))}
          />
          <Button
            label="Duplicate"
            icon="copy"
            variant="secondary"
            onPress={() => selected && onDuplicate(selected)}
          />
          <Button
            label="Delete"
            icon="trash"
            variant="danger"
            onPress={() => selected && confirmDelete(selected)}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

function BillRow({ bill, onPress, onMore }: { bill: BillSummary; onPress: () => void; onMore: () => void }) {
  const { colors } = useTheme();
  const title = bill.title.trim() || 'Untitled bill';
  const people = `${bill.participantCount} ${bill.participantCount === 1 ? 'person' : 'people'}`;
  return (
    <Card padded={false} style={{ ...row, paddingRight: 4 }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${formatMoney(bill.total, bill.currency)}, ${people}`}
        accessibilityHint="Opens the bill. Long press for more actions."
        pressedScale={0.99}
        style={{ flex: 1 }}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        onLongPress={() => {
          haptics.select();
          onMore();
        }}
      >
        <View style={{ ...row, gap: 12, paddingVertical: 12, paddingLeft: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.pinkSoft,
            }}
          >
            <CatFace size={38} mood="happy" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {title}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {formatBillDate(bill.updatedAt)} · {people} · {bill.mode === 'equal' ? 'Equal' : 'Items'}
            </Text>
          </View>
          <Text variant="headline" numeric>
            {formatMoney(bill.total, bill.currency)}
          </Text>
        </View>
      </PressableScale>
      <IconButton icon="more" label={`More actions for ${title}`} onPress={onMore} size={20} />
    </Card>
  );
}
