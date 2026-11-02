import { View, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger' | 'accent';
  size?: number;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 44pt tap target regardless of visual size. */
export function IconButton({
  icon,
  label,
  onPress,
  tone = 'default',
  size = 22,
  filled,
  disabled,
  style,
}: Props) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : tone === 'accent' ? colors.accent : colors.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={style}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? colors.surface : 'transparent',
          borderWidth: filled ? 1 : 0,
          borderColor: colors.border,
        }}
      >
        <Icon name={icon} size={size} color={color} />
      </View>
    </PressableScale>
  );
}
