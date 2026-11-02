import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CurrencySheet } from '@/components/CurrencySheet';
import { MoneyInput, PercentInput } from '@/components/ui/AmountInput';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { getCurrency } from '@/domain/currency';
import { formatMoney, formatPercent } from '@/domain/money';
import type { Adjustment, AdjustmentKind, Bill, BillResult, RoundingDirection } from '@/domain/types';
import { useEditorStore, type AdjustmentKey } from '@/store/editorStore';
import { useTheme } from '@/theme/ThemeProvider';
import { row } from '@/theme/layout';

interface Props {
  bill: Bill;
  result: BillResult;
  bottomInset: number;
}

const ROWS: { key: AdjustmentKey; title: string; hint: string; presets: number[]; sign: 1 | -1 }[] = [
  {
    key: 'discount',
    title: 'Discount',
    hint: 'Taken off the subtotal first',
    presets: [5, 10, 20],
    sign: -1,
  },
  { key: 'service', title: 'Service charge', hint: 'On the discounted subtotal', presets: [5, 10], sign: 1 },
  { key: 'tax', title: 'Tax', hint: 'On subtotal and service charge', presets: [5, 8, 12], sign: 1 },
  { key: 'tip', title: 'Tip', hint: 'On the discounted subtotal', presets: [10, 15, 20], sign: 1 },
];

export function ExtrasTab({ bill, result, bottomInset }: Props) {
  const { colors } = useTheme();
  const { setCurrency, setAdjustment, setRounding } = useEditorStore.getState();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currency = getCurrency(bill.currency);
  const amounts: Record<AdjustmentKey, number> = {
    discount: result.discount,
    service: result.service,
    tax: result.tax,
    tip: result.tip,
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Card padded={false}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Currency, ${currency.name}`}
          pressedScale={0.99}
          onPress={() => setCurrencyOpen(true)}
        >
          <View style={{ ...row, gap: 12, padding: 16 }}>
            <Text style={{ flex: 1 }}>Currency</Text>
            <Text variant="bodyStrong" tone="accent">
              {currency.symbol} {currency.code}
            </Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </View>
        </PressableScale>
      </Card>

      {ROWS.map((row) => (
        <AdjustmentCard
          key={row.key}
          title={row.title}
          hint={row.hint}
          presets={row.presets}
          adjustment={bill[row.key]}
          currency={bill.currency}
          computed={amounts[row.key]}
          negative={row.sign < 0}
          onChange={(a) => setAdjustment(row.key, a)}
        />
      ))}

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Rounding
          </Text>
          {bill.rounding.step > 0 ? (
            <Text variant="bodyStrong" numeric tone={result.rounding === 0 ? 'secondary' : 'primary'}>
              {formatMoney(result.rounding, bill.currency, { signed: true })}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip
            label="Off"
            selected={bill.rounding.step === 0}
            onPress={() => setRounding({ ...bill.rounding, step: 0 })}
          />
          {[1, 5, 10, 50].map((step) => (
            <Chip
              key={step}
              label={`${currency.symbol}${step}`}
              accessibilityLabel={`Round to ${step} ${currency.code}`}
              selected={bill.rounding.step === step}
              onPress={() => setRounding({ ...bill.rounding, step })}
            />
          ))}
        </View>
        {bill.rounding.step > 0 ? (
          <Segmented<RoundingDirection>
            small
            value={bill.rounding.direction}
            onChange={(direction) => setRounding({ ...bill.rounding, direction })}
            options={[
              { value: 'nearest', label: 'Nearest' },
              { value: 'up', label: 'Round up' },
            ]}
          />
        ) : null}
        <Text variant="caption" tone="secondary">
          {bill.rounding.step > 0
            ? "Each person's share is rounded. The difference is shown as its own line, so the shares still add up exactly."
            : 'Round each person to a friendlier amount, like the nearest 5 pesos.'}
        </Text>
      </Card>

      <CurrencySheet
        visible={currencyOpen}
        selected={bill.currency}
        onSelect={setCurrency}
        onClose={() => setCurrencyOpen(false)}
      />
    </ScrollView>
  );
}

function AdjustmentCard({
  title,
  hint,
  presets,
  adjustment,
  currency,
  computed,
  negative,
  onChange,
}: {
  title: string;
  hint: string;
  presets: number[];
  adjustment: Adjustment;
  currency: string;
  computed: number;
  negative: boolean;
  onChange: (a: Adjustment) => void;
}) {
  const symbol = getCurrency(currency).symbol;
  const active = adjustment.value > 0;
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ ...row, gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="caption" tone="secondary">
            {hint}
          </Text>
        </View>
        {active ? (
          <Text variant="bodyStrong" numeric tone={negative ? 'accent' : 'primary'}>
            {negative ? '−' : ''}
            {formatMoney(computed, currency)}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Segmented<AdjustmentKind>
          small
          style={{ width: 112 }}
          value={adjustment.kind}
          onChange={(kind) => onChange({ kind, value: 0 })}
          options={[
            { value: 'percent', label: '%' },
            { value: 'fixed', label: symbol },
          ]}
        />
        <View style={{ flex: 1 }}>
          {adjustment.kind === 'percent' ? (
            <PercentInput
              accessibilityLabel={`${title} percent`}
              value={adjustment.value}
              onChange={(value) => onChange({ kind: 'percent', value })}
            />
          ) : (
            <MoneyInput
              accessibilityLabel={`${title} amount`}
              currency={currency}
              value={adjustment.value}
              onChange={(value) => onChange({ kind: 'fixed', value })}
            />
          )}
        </View>
      </View>

      {adjustment.kind === 'percent' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((p) => (
            <Chip
              key={p}
              label={formatPercent(p * 100)}
              selected={adjustment.value === p * 100}
              onPress={() => onChange({ kind: 'percent', value: adjustment.value === p * 100 ? 0 : p * 100 })}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}
