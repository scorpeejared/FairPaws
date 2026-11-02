import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Keyboard, KeyboardAvoidingView, Platform, Share, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { LoadingView, MessageView } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { calculateBill } from '@/domain/calculate';
import { formatMoney } from '@/domain/money';
import { buildShareText } from '@/domain/summary';
import { getBillIssues } from '@/domain/validation';
import { BillTab } from '@/features/bill/BillTab';
import { ExtrasTab } from '@/features/bill/ExtrasTab';
import { PeopleTab } from '@/features/bill/PeopleTab';
import { SplitTab } from '@/features/bill/SplitTab';
import { notify } from '@/lib/dialogs';
import { haptics } from '@/lib/haptics';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type TabKey = 'people' | 'bill' | 'extras' | 'split';
const TABS: TabKey[] = ['people', 'bill', 'extras', 'split'];
const NEXT_LABEL: Record<TabKey, string> = {
  people: 'Add items',
  bill: 'Extras',
  extras: 'See split',
  split: 'Share',
};

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bill = useEditorStore((s) => s.bill);
  const status = useEditorStore((s) => s.status);
  const error = useEditorStore((s) => s.error);
  const saveError = useEditorStore((s) => s.saveError);
  // `chosenTab` is what the user tapped; `startTab` is decided once, when the bill first loads.
  const [chosenTab, setTab] = useState<TabKey | null>(null);
  const [startTab, setStartTab] = useState<TabKey | null>(null);
  const keyboardVisible = useKeyboardVisible();

  useEffect(() => {
    void useEditorStore.getState().open(id);
    return () => {
      void useEditorStore.getState().close();
    };
  }, [id]);

  // Autosave is debounced; make sure the last edit lands if the app is backgrounded or killed.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void useEditorStore.getState().flush();
    });
    return () => subscription.remove();
  }, []);

  // Reopened bills land on the split; fresh ones start by adding people.
  if (bill && startTab === null) setStartTab(bill.participants.length > 0 ? 'split' : 'people');
  const tab: TabKey = chosenTab ?? startTab ?? 'people';

  const result = useMemo(() => (bill ? calculateBill(bill) : null), [bill]);
  const issues = useMemo(
    () => (bill && result ? getBillIssues(bill, result.unassignedItemIds.length) : []),
    [bill, result],
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <Screen>
        <Header />
        <LoadingView label="Opening the bill…" />
      </Screen>
    );
  }
  if (status === 'missing' || status === 'error' || !bill || !result) {
    return (
      <Screen>
        <Header />
        <MessageView
          tone="danger"
          title={status === 'missing' ? "The cat can't find that bill" : "Couldn't open this bill"}
          message={status === 'missing' ? 'It may have been deleted.' : (error ?? 'Something went wrong.')}
          actionLabel="Back to bills"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const bottomBar = 88 + Math.max(insets.bottom, 12);
  const tabIndex = TABS.indexOf(tab);
  const peopleCount = bill.participants.length;

  const goNext = () => {
    if (tab === 'split') {
      void shareSummary();
      return;
    }
    Keyboard.dismiss();
    setTab(TABS[tabIndex + 1]);
  };

  const shareSummary = async () => {
    const message = buildShareText(bill, result);
    try {
      // Browsers without the Web Share API (most desktops) get the text on the clipboard instead.
      if (Platform.OS === 'web' && typeof navigator.share !== 'function') {
        await navigator.clipboard.writeText(message);
        notify('Copied', 'The breakdown is on your clipboard.');
        return;
      }
      await Share.share({ message, title: bill.title.trim() || 'Bill split' });
      haptics.success();
    } catch {
      // The user dismissing the share sheet isn't an error.
    }
  };

  return (
    <Screen>
      <Header
        trailing={
          tab === 'split' ? (
            <IconButton icon="share" label="Share breakdown" onPress={shareSummary} />
          ) : undefined
        }
      >
        <TextInput
          accessibilityLabel="Bill title"
          value={bill.title}
          onChangeText={useEditorStore.getState().setTitle}
          placeholder="Untitled bill"
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          maxLength={80}
          returnKeyType="done"
          style={{ fontSize: 20, fontFamily: fonts.heavy, color: colors.text, paddingVertical: 8 }}
        />
      </Header>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Segmented<TabKey>
          small
          value={tab}
          onChange={(t) => {
            Keyboard.dismiss();
            setTab(t);
          }}
          options={[
            { value: 'people', label: peopleCount > 0 ? `People · ${peopleCount}` : 'People' },
            { value: 'bill', label: 'Bill' },
            { value: 'extras', label: 'Extras' },
            { value: 'split', label: 'Split' },
          ]}
        />
      </View>

      {saveError ? (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.dangerSoft,
          }}
        >
          <Text variant="caption" tone="danger">
            {`Couldn't save your changes: ${saveError}`}
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.View key={tab} entering={FadeIn.duration(180)} style={{ flex: 1 }}>
          {tab === 'people' && <PeopleTab bottomInset={bottomBar} />}
          {tab === 'bill' && (
            <BillTab
              bill={bill}
              unassignedIds={result.unassignedItemIds}
              subtotal={result.subtotal}
              bottomInset={bottomBar}
              onGoToPeople={() => setTab('people')}
            />
          )}
          {tab === 'extras' && <ExtrasTab bill={bill} result={result} bottomInset={bottomBar} />}
          {tab === 'split' && (
            <SplitTab bill={bill} result={result} issues={issues} bottomInset={bottomBar} />
          )}
        </Animated.View>

        {keyboardVisible ? null : (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="label" tone="tertiary">
                Total
              </Text>
              <Text variant="headline" numeric numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(result.total, bill.currency)}
              </Text>
            </View>
            <Button
              label={NEXT_LABEL[tab]}
              icon={tab === 'split' ? 'share' : undefined}
              onPress={goNext}
              style={{ minWidth: 150 }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
