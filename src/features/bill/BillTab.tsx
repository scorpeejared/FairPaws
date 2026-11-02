import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MoneyInput } from '@/components/ui/AmountInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Segmented } from '@/components/ui/Segmented';
import { MessageView } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { itemTotal } from '@/domain/calculate';
import { createItem } from '@/domain/bill';
import { formatMoney } from '@/domain/money';
import type { Bill, Item, SplitMode } from '@/domain/types';
import { MAX_ITEMS } from '@/domain/validation';
import { confirm } from '@/lib/dialogs';
import { haptics } from '@/lib/haptics';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/theme/ThemeProvider';
import { ItemSheet } from './ItemSheet';
import { ParticipantPill } from './ParticipantPill';
import { row } from '@/theme/layout';

interface Props {
  bill: Bill;
  unassignedIds: string[];
  subtotal: number;
  bottomInset: number;
  onGoToPeople: () => void;
}

export function BillTab({ bill, unassignedIds, subtotal, bottomInset, onGoToPeople }: Props) {
  const { setMode, setEqualAmount, saveItem, removeItem, toggleShare } = useEditorStore.getState();
  const [sheet, setSheet] = useState<{ item: Item | null; open: boolean; isNew: boolean; count: number }>({
    item: null,
    open: false,
    isNew: false,
    count: 0,
  });

  const openSheet = (item: Item, isNew: boolean) =>
    setSheet((s) => ({ item, open: true, isNew, count: s.count + 1 }));
  const closeSheet = () => setSheet((s) => ({ ...s, open: false }));

  const noPeople = bill.participants.length === 0;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Segmented<SplitMode>
        value={bill.mode}
        onChange={setMode}
        options={[
          { value: 'items', label: 'By item' },
          { value: 'equal', label: 'Split equally' },
        ]}
      />

      {noPeople ? (
        <Card style={{ gap: 12 }}>
          <Text tone="secondary">
            Add the people at the table first, then you can split the bill between them.
          </Text>
          <Button
            label="Add people"
            icon="users"
            variant="secondary"
            small
            onPress={onGoToPeople}
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      ) : null}

      {bill.mode === 'equal' ? (
        <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 12 }}>
          <Text variant="label" tone="tertiary">
            Bill amount
          </Text>
          <MoneyInput
            large
            accessibilityLabel="Bill amount"
            currency={bill.currency}
            value={bill.equalAmount}
            onChange={setEqualAmount}
          />
          <Text variant="caption" tone="secondary">
            {bill.participants.length > 0
              ? `Shared equally by ${bill.participants.length} ${bill.participants.length === 1 ? 'person' : 'people'}. Tax, service and tip come next.`
              : 'Shared equally. Tax, service and tip come next.'}
          </Text>
        </Animated.View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text variant="label" tone="tertiary" style={{ flex: 1 }}>
              Items{bill.items.length > 0 ? ` · ${bill.items.length}` : ''}
            </Text>
            {bill.items.length > 0 ? (
              <Text variant="bodyStrong" numeric>
                {formatMoney(subtotal, bill.currency)}
              </Text>
            ) : null}
          </View>

          {bill.items.length === 0 ? (
            <MessageView
              mood="curious"
              title="What did everyone order?"
              message="Enter each dish or drink, then tap who shared it."
              actionLabel="Add first item"
              onAction={() => openSheet(createItem(), true)}
            />
          ) : (
            <>
              {bill.items.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOut.duration(150)}
                  layout={LinearTransition}
                >
                  <ItemCard
                    item={item}
                    index={index}
                    bill={bill}
                    unassigned={unassignedIds.includes(item.id)}
                    onEdit={() => openSheet(item, false)}
                    onToggle={(pid) => toggleShare(item.id, pid)}
                  />
                </Animated.View>
              ))}
              <Button
                label="Add item"
                icon="plus"
                variant="secondary"
                disabled={bill.items.length >= MAX_ITEMS}
                onPress={() => openSheet(createItem(), true)}
              />
            </>
          )}
        </>
      )}

      <ItemSheet
        visible={sheet.open}
        item={sheet.item}
        openCount={sheet.count}
        isNew={sheet.isNew}
        currency={bill.currency}
        participants={bill.participants}
        onClose={closeSheet}
        onSave={(item) => {
          saveItem(item);
          closeSheet();
        }}
        onDelete={async (id) => {
          closeSheet();
          haptics.warning();
          if (await confirm({ title: 'Delete this item?', confirmLabel: 'Delete' })) removeItem(id);
        }}
      />
    </ScrollView>
  );
}

function ItemCard({
  item,
  index,
  bill,
  unassigned,
  onEdit,
  onToggle,
}: {
  item: Item;
  index: number;
  bill: Bill;
  unassigned: boolean;
  onEdit: () => void;
  onToggle: (participantId: string) => void;
}) {
  const { colors } = useTheme();
  const name = item.name.trim() || `Item ${index + 1}`;
  const total = itemTotal(item.unitPrice, item.quantity);

  return (
    <Card padded={false}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${formatMoney(total, bill.currency)}. Edit`}
        pressedScale={0.99}
        onPress={() => {
          haptics.tap();
          onEdit();
        }}
      >
        <View style={{ ...row, gap: 12, padding: 16, paddingBottom: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            {item.quantity > 1 ? (
              <Text variant="caption" tone="secondary" numeric>
                {item.quantity} × {formatMoney(item.unitPrice, bill.currency)}
              </Text>
            ) : null}
          </View>
          <Text variant="bodyStrong" numeric>
            {formatMoney(total, bill.currency)}
          </Text>
          <Icon name="edit" size={16} color={colors.textTertiary} />
        </View>
      </PressableScale>

      {bill.participants.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {bill.participants.map((p) => (
              <ParticipantPill
                key={p.id}
                name={p.name}
                colorIndex={p.colorIndex}
                selected={(item.shares[p.id] ?? 0) > 0}
                portions={item.shares[p.id]}
                onPress={() => onToggle(p.id)}
              />
            ))}
          </View>
          {unassigned ? (
            <View style={{ ...row, gap: 6 }}>
              <Icon name="alert" size={14} color={colors.warning} />
              <Text variant="caption" tone="warning">
                Nobody picked yet · split evenly for now
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
