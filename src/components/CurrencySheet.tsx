import { View } from 'react-native';
import { CURRENCIES } from '@/domain/currency';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from './ui/Icon';
import { PressableScale } from './ui/PressableScale';
import { Sheet } from './ui/Sheet';
import { Text } from './ui/Text';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function CurrencySheet({ visible, selected, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="Currency">
      <View style={{ gap: 4 }}>
        {CURRENCIES.map((c) => {
          const active = c.code === selected;
          return (
            <PressableScale
              key={c.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${c.name}, ${c.code}`}
              pressedScale={0.99}
              onPress={() => {
                haptics.select();
                onSelect(c.code);
                onClose();
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: active ? colors.accentSoft : 'transparent',
                }}
              >
                <View style={{ width: 52 }}>
                  <Text variant="bodyStrong" tone={active ? 'accent' : 'primary'}>
                    {c.symbol}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text>{c.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {c.code}
                  </Text>
                </View>
                {active ? <Icon name="check" size={20} color={colors.accent} /> : null}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </Sheet>
  );
}
