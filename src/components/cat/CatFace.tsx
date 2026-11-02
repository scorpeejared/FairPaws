import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { CAT } from './palette';

export type CatMood = 'happy' | 'sleepy' | 'curious' | 'oops';

const INK = CAT.ink;
const PINK = CAT.pink;

interface Props {
  size?: number;
  mood?: CatMood;
  /** Fur colour; white by default. */
  fur?: string;
}

/** A cat's face for empty states, errors and list rows. */
export function CatFace({ size = 96, mood = 'happy', fur = CAT.fur }: Props) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="-6 0 112 90" accessibilityLabel="Cat">
      <Path
        d="M14 42 C10 24 12 12 16 4 C28 8 38 16 44 25 Z"
        fill={fur}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M86 42 C90 24 88 12 84 4 C72 8 62 16 56 25 Z"
        fill={fur}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M20 34 C18 24 19 17 21 12 C28 15 33 19 36 24 Z" fill={PINK} />
      <Path d="M80 34 C82 24 81 17 79 12 C72 15 67 19 64 24 Z" fill={PINK} />
      <Ellipse cx={50} cy={54} rx={42} ry={33} fill={fur} stroke={INK} strokeWidth={3} />

      {mood === 'happy' && (
        <>
          <Path d="M28 54 Q35 44 42 54" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M58 54 Q65 44 72 54" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
      {mood === 'sleepy' && (
        <>
          <Path d="M28 52 Q35 60 42 52" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M58 52 Q65 60 72 52" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <Path
            d="M80 14 h9 l-9 9 h9 M92 2 h6 l-6 6 h6"
            fill="none"
            stroke={INK}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {mood === 'curious' && (
        <>
          <Circle cx={35} cy={52} r={5.5} fill={INK} />
          <Circle cx={65} cy={52} r={5.5} fill={INK} />
          <Circle cx={37} cy={50} r={1.8} fill={CAT.fur} />
          <Circle cx={67} cy={50} r={1.8} fill={CAT.fur} />
        </>
      )}
      {mood === 'oops' && (
        <>
          <Path
            d="M29 47 L40 53 L29 59"
            fill="none"
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M71 47 L60 53 L71 59"
            fill="none"
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M84 30 C80 36 80 40 84 40 C88 40 88 36 84 30 Z"
            fill={CAT.water}
            stroke={INK}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </>
      )}

      <Ellipse cx={24} cy={66} rx={9} ry={6} fill={PINK} opacity={0.75} />
      <Ellipse cx={76} cy={66} rx={9} ry={6} fill={PINK} opacity={0.75} />
      <Ellipse cx={50} cy={62} rx={4.5} ry={3.3} fill={CAT.nose} />
      {mood === 'oops' ? (
        <Path d="M43 73 Q50 66 57 73" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ) : mood === 'sleepy' ? (
        <Ellipse cx={50} cy={72} rx={3} ry={2.4} fill={INK} />
      ) : (
        <Path
          d="M50 65 Q50 72 44 72 M50 65 Q50 72 56 72"
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
      <Path
        d="M10 58 L-2 55 M10 66 L-3 68 M90 58 L102 55 M90 66 L103 68"
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
