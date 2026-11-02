import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

interface Props extends ViewProps {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Soft, rounded card with a faint warm shadow. */
export function Card({ padded = true, style, ...rest }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
        },
        style,
      ]}
    />
  );
}
