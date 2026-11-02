import { useEffect, useState } from 'react';
import { Animated, Easing, View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { CatRunner, RUNNER_ASPECT } from './CatRunner';

interface Props {
  /** 0..1. Omit for an endless "working on it" loop. */
  progress?: Animated.Value;
  width?: number;
  catSize?: number;
}

/**
 * A progress bar with a cat trotting along its leading edge.
 * Determinate when `progress` is given, otherwise the cat runs the bar on a loop.
 */
export function CatProgress({ progress, width = 240, catSize = 52 }: Props) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(width);
  const [loop] = useState(() => new Animated.Value(0));
  const value = progress ?? loop;

  useEffect(() => {
    if (progress) return;
    const run = Animated.loop(
      Animated.timing(loop, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    );
    run.start();
    return () => run.stop();
  }, [progress, loop]);

  const fill = value.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth], extrapolate: 'clamp' });
  // The cat's head (right side of the sprite) leads the fill edge.
  const catLeft = value.interpolate({
    inputRange: [0, 1],
    outputRange: [-catSize * 0.82, trackWidth - catSize * 0.82],
    extrapolate: 'clamp',
  });
  const catHeight = catSize * RUNNER_ASPECT;

  return (
    <View
      style={{ width, height: catHeight + 10 }}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={{ position: 'absolute', left: catLeft, top: 0 }}>
        <CatRunner size={catSize} />
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.pinkSoft,
          borderWidth: 1.5,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{ width: fill, height: '100%', borderRadius: 6, backgroundColor: colors.pink }}
        />
      </View>
    </View>
  );
}
