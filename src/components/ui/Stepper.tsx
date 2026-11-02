import { View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { row } from '@/theme/layout';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  compact?: boolean;
}

export function Stepper({ value, onChange, min = 1, max = 99, label, compact }: Props) {
  const { colors } = useTheme();
  const size = compact ? 32 : 40;
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      haptics.select();
      onChange(next);
    }
  };
  const button = (delta: 1 | -1, disabled: boolean) => (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} ${label}`}
      disabled={disabled}
      hitSlop={6}
      onPress={() => step(delta)}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.border,
        }}
      >
        <Icon name={delta > 0 ? 'plus' : 'minus'} size={compact ? 16 : 18} color={colors.text} />
      </View>
    </PressableScale>
  );

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={{ ...row, gap: compact ? 8 : 12, borderRadius: radius.pill }}
    >
      {button(-1, value <= min)}
      <Text variant="bodyStrong" numeric style={{ minWidth: compact ? 22 : 28, textAlign: 'center' }}>
        {value}
      </Text>
      {button(1, value >= max)}
    </View>
  );
}
