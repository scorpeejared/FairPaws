import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  LUCKY_CAT_BODY_SVG,
  LUCKY_CAT_PAW_SVG,
  LUCKY_CAT_PIVOT,
  LUCKY_CAT_VIEWBOX,
} from '@/components/cat/luckyCatArt';

const { x: VIEW_X, width: VIEW_W, height: VIEW_H } = LUCKY_CAT_VIEWBOX;

export const LUCKY_CAT_ASPECT = VIEW_H / VIEW_W;

interface Props {
  /** Width in dp; height follows the artwork's aspect ratio. */
  size?: number;
  /** Wave the paw. Disabled automatically when the OS asks for reduced motion. */
  animated?: boolean;
}

/** A waving maneki-neko. The paw sits on its own layer behind the body so it can swing from the shoulder. */
export function LuckyCat({ size = 180, animated = true }: Props) {
  const height = size * LUCKY_CAT_ASPECT;
  const [angle] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduceMotion(v));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!animated || reduceMotion) {
      angle.setValue(0);
      return;
    }
    const swing = (to: number, duration: number) =>
      Animated.timing(angle, {
        toValue: to,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    // Three friendly waves, then a short rest.
    const loop = Animated.loop(
      Animated.sequence([
        swing(-1, 380),
        swing(0.35, 380),
        swing(-1, 380),
        swing(0.35, 380),
        swing(-1, 380),
        swing(0, 420),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, reduceMotion, angle]);

  const rotate = angle.interpolate({ inputRange: [-1, 1], outputRange: ['-13deg', '13deg'] });
  const origin = `${((LUCKY_CAT_PIVOT.x - VIEW_X) / VIEW_W) * size}px ${(LUCKY_CAT_PIVOT.y / VIEW_H) * height}px`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="A waving lucky cat"
      style={{ width: size, height }}
    >
      {/* Back layer: the waving paw */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size,
          height,
          transform: [{ rotate }],
          transformOrigin: origin,
        }}
      >
        <SvgXml xml={LUCKY_CAT_PAW_SVG} width={size} height={height} />
      </Animated.View>

      {/* Front layer: everything else */}
      <View style={{ position: 'absolute' }} pointerEvents="none">
        <SvgXml xml={LUCKY_CAT_BODY_SVG} width={size} height={height} />
      </View>
    </View>
  );
}
