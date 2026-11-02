import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Text } from './Text';

interface Props {
  name: string;
  colorIndex: number;
  size?: number;
  /** Render as an outline (not selected) rather than filled. */
  muted?: boolean;
}

// Cat-head silhouette: two pointed ears and a round face, one closed path.
const HEAD =
  'M12 52 L10 10 L40 26 Q50 23 60 26 L90 10 L88 52 Q96 70 80 86 Q65 98 50 98 Q35 98 20 86 Q4 70 12 52 Z';
const EAR_LEFT = 'M18 40 L17 21 L33 30 Z';
const EAR_RIGHT = 'M82 40 L83 21 L67 30 Z';

/** A participant: a little cat in their colour, with their initial on its face. */
export function Avatar({ name, colorIndex, size = 40, muted }: Props) {
  const { colors } = useTheme();
  const color = colors.people[colorIndex % colors.people.length];
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? '?';
  const fontSize = size * 0.4;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Path
          d={HEAD}
          fill={muted ? 'none' : color}
          stroke={color}
          strokeWidth={muted ? 5 : 6}
          strokeLinejoin="round"
        />
        {muted ? null : (
          <>
            <Path d={EAR_LEFT} fill="#FFFFFF" fillOpacity={0.45} />
            <Path d={EAR_RIGHT} fill="#FFFFFF" fillOpacity={0.45} />
          </>
        )}
      </Svg>
      <Text
        style={{
          position: 'absolute',
          top: size * 0.58 - fontSize * 0.62,
          fontFamily: fonts.heavy,
          fontSize,
          lineHeight: fontSize * 1.25,
          color: muted ? color : '#FFFFFF',
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
