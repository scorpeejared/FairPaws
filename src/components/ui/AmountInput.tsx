import { useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { getCurrency } from '@/domain/currency';
import { moneyToInputText, parseMoney, parsePercent, percentToInputText } from '@/domain/money';
import { fonts } from '@/theme/tokens';
import { Text } from './Text';
import { TextField } from './TextField';

interface BaseProps {
  value: number;
  onChange: (value: number) => void;
  large?: boolean;
  placeholder?: string;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

interface Codec {
  parse: (text: string) => number | null;
  format: (value: number) => string;
}

interface AmountInputProps extends BaseProps, Codec {
  prefix?: string;
  suffix?: string;
}

/**
 * Text input bound to an integer value. Keystrokes that wouldn't parse are
 * rejected, so the field can never hold an invalid amount.
 */
function AmountInput({
  value,
  onChange,
  parse,
  format,
  prefix,
  suffix,
  large,
  placeholder = '0',
  accessibilityLabel,
  style,
  autoFocus,
}: AmountInputProps) {
  const [text, setText] = useState(() => format(value));

  // Follow external changes (e.g. switching % / fixed) without fighting the user's typing:
  // text like "12." still parses to the current value, so it is left alone.
  if (parse(text) !== value) setText(format(value));

  const affix = (symbol: string) => (
    <Text
      tone="secondary"
      style={{ fontSize: large ? 30 : 16, fontFamily: large ? fonts.heavy : fonts.bold }}
    >
      {symbol}
    </Text>
  );

  return (
    <TextField
      accessibilityLabel={accessibilityLabel}
      containerStyle={[large && { minHeight: 80, paddingHorizontal: 20 }, style]}
      left={prefix ? affix(prefix) : undefined}
      right={suffix ? affix(suffix) : undefined}
      keyboardType="decimal-pad"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      autoFocus={autoFocus}
      selectTextOnFocus
      maxLength={14}
      onChangeText={(raw) => {
        // Some locales' decimal pads type a comma.
        const normalized = raw.replace(',', '.');
        const parsed = parse(normalized);
        if (parsed === null) return;
        setText(normalized);
        onChange(parsed);
      }}
      style={[
        { fontVariant: ['tabular-nums'] },
        prefix ? { marginLeft: 6 } : null,
        suffix ? { marginRight: 6 } : null,
        large ? { fontSize: 34, fontFamily: fonts.heavy, letterSpacing: -0.6 } : null,
      ]}
    />
  );
}

export function MoneyInput({ currency, placeholder, ...rest }: BaseProps & { currency: string }) {
  const { decimals, symbol } = getCurrency(currency);
  const codec = useMemo<Codec>(
    () => ({
      parse: (t) => parseMoney(t, decimals),
      format: (v) => moneyToInputText(v, decimals),
    }),
    [decimals],
  );
  return (
    <AmountInput
      {...rest}
      {...codec}
      prefix={symbol}
      placeholder={placeholder ?? (decimals > 0 ? '0.00' : '0')}
    />
  );
}

const percentCodec: Codec = { parse: parsePercent, format: percentToInputText };

export function PercentInput(props: BaseProps) {
  return <AmountInput {...props} {...percentCodec} suffix="%" />;
}
