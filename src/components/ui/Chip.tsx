import { View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Small selectable pill, used for presets (tip %, rounding steps). */
export function Chip({ label, selected, onPress, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
    >
      <View
        style={{
          minHeight: 36,
          paddingHorizontal: 14,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.accent : colors.surface,
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.border,
        }}
      >
        <Text variant="bodyStrong" tone={selected ? 'onAccent' : 'secondary'} style={{ fontSize: 14 }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
