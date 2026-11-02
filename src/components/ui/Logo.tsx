import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { LuckyCat } from './LuckyCat';

/** The header mark: the lucky cat on a soft pink disc, matching the rest of the theme. */
export function Logo({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel="Fair Paws"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.pinkSoft,
        borderWidth: 1.5,
        borderColor: colors.border,
      }}
    >
      <View style={{ marginTop: size * 0.03 }}>
        <LuckyCat size={size * 0.74} animated={false} />
      </View>
    </View>
  );
}
