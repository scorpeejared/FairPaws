import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { CAT } from './palette';

const INK = CAT.ink;
const PINK = CAT.pink;

/** Width / height of the artwork. */
export const RUNNER_ASPECT = 80 / 110;

/** A little side-on cat, trotting right. Legs swap every beat and the body bobs. */
export function CatRunner({ size = 56 }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  const [bob] = useState(() => new Animated.Value(0));
  const [still, setStill] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setStill(v));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (still) return;
    const legs = setInterval(() => setFrame((f) => 1 - f), 150);
    const hop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    hop.start();
    return () => {
      clearInterval(legs);
      hop.stop();
    };
  }, [still, bob]);

  const stride = frame === 0 ? { back: [20, 38], front: [60, 78] } : { back: [28, 32], front: [66, 70] };
  const height = size * RUNNER_ASPECT;

  return (
    <Animated.View
      style={{
        width: size,
        height,
        transform: [{ translateY: bob.interpolate({ inputRange: [-1, 0], outputRange: [-size * 0.07, 0] }) }],
      }}
    >
      <Svg width={size} height={height} viewBox="0 0 110 80">
        {/* tail */}
        <Path d="M22 48 C4 48 0 24 14 17" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <Path
          d="M22 48 C4 48 0 24 14 17"
          fill="none"
          stroke={CAT.fur}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* legs */}
        {[...stride.back, ...stride.front].map((x, i) => (
          <Rect
            key={i}
            x={x}
            y={54}
            width={11}
            height={19}
            rx={5.5}
            fill={CAT.fur}
            stroke={INK}
            strokeWidth={3}
          />
        ))}
        {/* body */}
        <Ellipse cx={50} cy={46} rx={31} ry={19} fill={CAT.fur} stroke={INK} strokeWidth={3} />
        <Ellipse cx={40} cy={38} rx={13} ry={8} fill={CAT.orange} transform="rotate(-12 40 38)" />
        {/* ears + head */}
        <Path d="M68 26 L69 7 L83 18 Z" fill={CAT.fur} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <Path
          d="M89 18 L102 7 L102 26 Z"
          fill={CAT.fur}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Path d="M72 21 L72.5 13 L78 17.5 Z" fill={PINK} />
        <Path d="M93 17.5 L98.5 13 L98.5 21 Z" fill={PINK} />
        <Ellipse cx={85} cy={36} rx={21} ry={18} fill={CAT.fur} stroke={INK} strokeWidth={3} />
        {/* collar */}
        <Path d="M69 47 Q77 56 88 53" fill="none" stroke={CAT.collar} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={78} cy={56} r={3.6} fill={CAT.gold} stroke={INK} strokeWidth={1.6} />
        {/* face */}
        <Path d="M76 35 Q80 30 84 35" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <Path d="M90 35 Q94 30 98 35" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        <Ellipse cx={72} cy={42} rx={5} ry={3.4} fill={PINK} opacity={0.8} />
        <Ellipse cx={101} cy={42} rx={5} ry={3.4} fill={PINK} opacity={0.8} />
        <Ellipse cx={87} cy={41} rx={2.8} ry={2} fill={CAT.nose} />
        <Path
          d="M87 43 Q87 47 83.5 47 M87 43 Q87 47 90.5 47"
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
