import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { CatPeek, PEEK_RISE } from '@/components/cat/CatPeek';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { MessageView } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { formatMoney, formatPercent } from '@/domain/money';
import type { Adjustment, Bill, BillResult, PersonBreakdown } from '@/domain/types';
import type { BillIssue } from '@/domain/validation';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { row } from '@/theme/layout';

interface Props {
  bill: Bill;
  result: BillResult;
  issues: BillIssue[];
  bottomInset: number;
}

export function SplitTab({ bill, result, issues, bottomInset }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const m = (v: number) => formatMoney(v, bill.currency);
  const blocking = issues.find((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  if (blocking) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: bottomInset }}>
        <MessageView mood="sleepy" title="Nothing to split yet" message={blocking.message} />
      </ScrollView>
    );
  }

  const label = (name: string, adj: Adjustment) =>
    adj.kind === 'percent' && adj.value > 0 ? `${name} · ${formatPercent(adj.value)}` : name;

  const lines: { label: string; value: string; accent?: boolean }[] = [
    { label: 'Subtotal', value: m(result.subtotal) },
  ];
  if (result.discount > 0)
    lines.push({ label: label('Discount', bill.discount), value: `−${m(result.discount)}`, accent: true });
  if (result.service > 0) lines.push({ label: label('Service', bill.service), value: m(result.service) });
  if (result.tax > 0) lines.push({ label: label('Tax', bill.tax), value: m(result.tax) });
  if (result.tip > 0) lines.push({ label: label('Tip', bill.tip), value: m(result.tip) });
  if (result.rounding !== 0)
    lines.push({ label: 'Rounding', value: formatMoney(result.rounding, bill.currency, { signed: true }) });

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(300)} style={{ paddingTop: PEEK_RISE }}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 1 }}
        >
          <CatPeek />
        </View>
        <Card style={{ gap: 16, paddingTop: 28, paddingBottom: 24 }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="label" tone="tertiary">
              Total bill
            </Text>
            <Text variant="display" numeric accessibilityLabel={`Total ${m(result.total)}`}>
              {m(result.total)}
            </Text>
            <Text tone="secondary">
              {bill.participants.length} {bill.participants.length === 1 ? 'person' : 'people'}
            </Text>
          </View>
          {lines.length > 1 ? (
            <View style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
              {lines.map((l) => (
                <View key={l.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text tone="secondary">{l.label}</Text>
                  <Text numeric tone={l.accent ? 'accent' : 'primary'}>
                    {l.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      </Animated.View>

      {warnings.map((w) => (
        <View
          key={w.code}
          accessibilityRole="alert"
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.warningSoft,
          }}
        >
          <Icon name="alert" size={18} color={colors.warning} />
          <Text variant="caption" tone="warning" style={{ flex: 1 }}>
            {w.message}
          </Text>
        </View>
      ))}

      <Text variant="label" tone="tertiary" style={{ paddingLeft: 4 }}>
        Who owes what
      </Text>

      {result.people.map((p, index) => (
        <Animated.View
          key={p.participantId}
          entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(300)}
          layout={LinearTransition}
        >
          <PersonCard
            person={p}
            bill={bill}
            expanded={!!open[p.participantId]}
            onToggle={() => {
              haptics.select();
              setOpen((o) => ({ ...o, [p.participantId]: !o[p.participantId] }));
            }}
          />
        </Animated.View>
      ))}

      <View style={{ ...row, justifyContent: 'center', gap: 6, paddingTop: 4 }}>
        <Icon name="paw" size={14} color={colors.pink} />
        <Text variant="caption" tone="secondary" numeric>
          Purr-fect: shares add up to {m(result.people.reduce((sum, p) => sum + p.total, 0))}
        </Text>
      </View>
    </ScrollView>
  );
}

function PersonCard({
  person,
  bill,
  expanded,
  onToggle,
}: {
  person: PersonBreakdown;
  bill: Bill;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const m = (v: number) => formatMoney(v, bill.currency);
  const extras: { label: string; value: number; signed?: boolean }[] = [
    { label: 'Discount', value: -person.discount },
    { label: 'Service', value: person.service },
    { label: 'Tax', value: person.tax },
    { label: 'Tip', value: person.tip },
    { label: 'Rounding', value: person.rounding, signed: true },
  ].filter((e) => e.value !== 0);

  return (
    <Card padded={false}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${person.name} pays ${m(person.total)}`}
        accessibilityState={{ expanded }}
        accessibilityHint="Shows the breakdown"
        pressedScale={0.99}
        onPress={onToggle}
      >
        <View style={{ ...row, gap: 12, padding: 16 }}>
          <Avatar name={person.name} colorIndex={person.colorIndex} size={44} />
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {person.name}
          </Text>
          <Text variant="headline" numeric>
            {m(person.total)}
          </Text>
          <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
            <Icon name="chevron-down" size={18} color={colors.textTertiary} />
          </View>
        </View>
      </PressableScale>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 14,
          }}
        >
          {person.lines.length === 0 ? (
            <Text tone="secondary" variant="caption">
              No items assigned.
            </Text>
          ) : (
            person.lines.map((line) => (
              <View
                key={line.itemId}
                style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
              >
                <Text style={{ flex: 1 }} numberOfLines={2}>
                  {line.name.trim() || 'Item'}
                  {line.sharedBy > 1 && bill.mode === 'items' ? (
                    <Text variant="caption" tone="tertiary">{`  ÷${line.sharedBy}`}</Text>
                  ) : null}
                </Text>
                <Text numeric>{m(line.amount)}</Text>
              </View>
            ))
          )}
          {extras.length > 0 ? (
            <View
              style={{
                gap: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              {extras.map((e) => (
                <View key={e.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text tone="secondary">{e.label}</Text>
                  <Text numeric tone={e.value < 0 ? 'accent' : 'secondary'}>
                    {formatMoney(e.value, bill.currency, { signed: e.signed })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </Card>
  );
}
