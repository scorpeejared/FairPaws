import { View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  name: string;
  colorIndex: number;
  selected: boolean;
  /** Portions, shown as "×2" when above 1. */
  portions?: number;
  onPress: () => void;
}

/** Tap-to-assign chip: filled in the person's color when they share the item. */
export function ParticipantPill({ name, colorIndex, selected, portions = 1, onPress }: Props) {
  const { colors } = useTheme();
  const color = colors.people[colorIndex % colors.people.length];
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityLabel={name}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 36,
          paddingHorizontal: 12,
          borderRadius: 18,
          backgroundColor: selected ? color : 'transparent',
          borderWidth: 1.5,
          borderColor: color,
        }}
      >
        {selected ? <Icon name="paw" size={13} color="#FFFFFF" /> : null}
        <Text
          variant="bodyStrong"
          numberOfLines={1}
          style={{ fontSize: 14, color: selected ? '#FFFFFF' : color, maxWidth: 110 }}
        >
          {name}
        </Text>
        {selected && portions > 1 ? (
          <Text variant="caption" numeric style={{ color: '#FFFFFF' }}>
            ×{portions}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}
