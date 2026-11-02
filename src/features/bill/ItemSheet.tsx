import { useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MoneyInput } from '@/components/ui/AmountInput';
import { PressableScale } from '@/components/ui/PressableScale';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { Icon } from '@/components/ui/Icon';
import { itemTotal } from '@/domain/calculate';
import { formatMoney } from '@/domain/money';
import type { Item, Participant } from '@/domain/types';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { row } from '@/theme/layout';

interface Props {
  visible: boolean;
  /** Stays set while the sheet animates out so its content doesn't vanish. */
  item: Item | null;
  /** Bumps on every open so the form restarts from the item's saved state. */
  openCount: number;
  isNew: boolean;
  currency: string;
  participants: Participant[];
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ItemSheet({
  visible,
  item,
  openCount,
  isNew,
  currency,
  participants,
  onSave,
  onDelete,
  onClose,
}: Props) {
  return (
    <Sheet visible={visible} onClose={onClose} title={isNew ? 'Add item' : 'Edit item'}>
      {item ? (
        <ItemForm
          key={`${item.id}-${openCount}`}
          initial={item}
          isNew={isNew}
          currency={currency}
          participants={participants}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </Sheet>
  );
}

function ItemForm({
  initial,
  isNew,
  currency,
  participants,
  onSave,
  onDelete,
}: Pick<Props, 'currency' | 'participants' | 'onSave' | 'onDelete' | 'isNew'> & { initial: Item }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<Item>(initial);
  const canSave = draft.unitPrice > 0;

  const setShare = (id: string, portions: number) =>
    setDraft((d) => {
      const { [id]: _old, ...rest } = d.shares;
      return { ...d, shares: portions > 0 ? { ...rest, [id]: portions } : rest };
    });

  const allSelected = participants.length > 0 && participants.every((p) => (draft.shares[p.id] ?? 0) > 0);
  const toggleAll = () => {
    haptics.select();
    setDraft((d) => ({
      ...d,
      shares: allSelected ? {} : Object.fromEntries(participants.map((p) => [p.id, d.shares[p.id] ?? 1])),
    }));
  };

  return (
    <>
      <View style={{ gap: 8 }}>
        <Text variant="label" tone="tertiary">
          Name
        </Text>
        <TextField
          accessibilityLabel="Item name"
          placeholder="e.g. Sinigang"
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          autoFocus={isNew}
          autoCapitalize="sentences"
          maxLength={80}
          returnKeyType="next"
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="label" tone="tertiary">
            Price each
          </Text>
          <MoneyInput
            accessibilityLabel="Price each"
            currency={currency}
            value={draft.unitPrice}
            onChange={(unitPrice) => setDraft((d) => ({ ...d, unitPrice }))}
          />
        </View>
        <View style={{ gap: 8, alignItems: 'flex-end' }}>
          <Text variant="label" tone="tertiary">
            Quantity
          </Text>
          <View style={{ minHeight: 52, justifyContent: 'center' }}>
            <Stepper
              label="Quantity"
              value={draft.quantity}
              min={1}
              max={99}
              onChange={(quantity) => setDraft((d) => ({ ...d, quantity }))}
            />
          </View>
        </View>
      </View>

      {draft.quantity > 1 && draft.unitPrice > 0 ? (
        <Text tone="secondary" numeric>
          {draft.quantity} × {formatMoney(draft.unitPrice, currency)} ={' '}
          <Text variant="bodyStrong" numeric>
            {formatMoney(itemTotal(draft.unitPrice, draft.quantity), currency)}
          </Text>
        </Text>
      ) : null}

      <View style={{ gap: 8 }}>
        <View style={{ ...row }}>
          <Text variant="label" tone="tertiary" style={{ flex: 1 }}>
            Shared by
          </Text>
          {participants.length > 1 ? (
            <PressableScale accessibilityRole="button" onPress={toggleAll} hitSlop={8}>
              <Text variant="bodyStrong" tone="accent" style={{ fontSize: 14 }}>
                {allSelected ? 'Clear' : 'Everyone'}
              </Text>
            </PressableScale>
          ) : null}
        </View>
        {participants.length === 0 ? (
          <Text tone="secondary">Add people first, then assign this item to them.</Text>
        ) : (
          <View style={{ gap: 4 }}>
            {participants.map((p) => {
              const portions = draft.shares[p.id] ?? 0;
              const on = portions > 0;
              return (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 14,
                    backgroundColor: on ? colors.accentSoft : 'transparent',
                  }}
                >
                  <PressableScale
                    accessibilityRole="checkbox"
                    accessibilityLabel={p.name}
                    accessibilityState={{ checked: on }}
                    pressedScale={0.99}
                    style={{ flex: 1 }}
                    onPress={() => {
                      haptics.select();
                      setShare(p.id, on ? 0 : 1);
                    }}
                  >
                    <View style={{ ...row, gap: 12, minHeight: 40 }}>
                      <Avatar name={p.name} colorIndex={p.colorIndex} size={32} muted={!on} />
                      <Text style={{ flex: 1 }} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {on && draft.quantity === 1 ? (
                        <Icon name="check" size={18} color={colors.accent} />
                      ) : null}
                    </View>
                  </PressableScale>
                  {on && draft.quantity > 1 ? (
                    <Stepper
                      compact
                      label={`${p.name} portions`}
                      value={portions}
                      min={0}
                      max={99}
                      onChange={(n) => setShare(p.id, n)}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
        {draft.quantity > 1 && participants.length > 0 ? (
          <Text variant="caption" tone="secondary">
            Portions split the total by how much each person had, e.g. 2 and 1 of 3 beers.
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 8 }}>
        {!isNew ? (
          <Button label="Delete" icon="trash" variant="danger" onPress={() => onDelete(initial.id)} />
        ) : null}
        <Button
          label={isNew ? 'Add item' : 'Save'}
          style={{ flex: 1 }}
          disabled={!canSave}
          onPress={() => onSave(draft)}
        />
      </View>
    </>
  );
}
