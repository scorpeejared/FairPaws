import { View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';

// x, y as fractions of the container; rotation in degrees; size in dp.
const PRINTS = [
  { x: 0.1, y: 0.06, r: -18, s: 26 },
  { x: 0.3, y: 0.2, r: 14, s: 22 },
  { x: 0.12, y: 0.4, r: -12, s: 24 },
  { x: 0.34, y: 0.58, r: 20, s: 20 },
  { x: 0.16, y: 0.78, r: -8, s: 24 },
] as const;

/** A faint trail of paw prints, purely decorative. Fill its parent with it. */
export function PawTrail({ side = 'right' }: { side?: 'left' | 'right' }) {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, bottom: 0, [side]: 0, width: '45%' }}
    >
      {PRINTS.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            [side === 'right' ? 'right' : 'left']: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            transform: [{ rotate: `${side === 'right' ? p.r : -p.r}deg` }],
            opacity: 0.55,
          }}
        >
          <Icon name="paw" size={p.s} color={colors.pinkSoft} />
        </View>
      ))}
    </View>
  );
}
