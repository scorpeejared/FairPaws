import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { CAT } from './palette';

const INK = CAT.ink;
const PINK = CAT.pink;

/** Height of the artwork above the card edge (the paws straddle it). */
export const PEEK_RISE = 60;

/**
 * A cat peeking over the top edge of a card, paws hooked on the rim.
 * Its bottom edge (y = PEEK_RISE of the artwork) should sit on the card's top edge.
 */
export function CatPeek({ width = 132, fur = CAT.fur }: { width?: number; fur?: string }) {
  const scale = width / 132;
  return (
    <Svg width={width} height={67 * scale} viewBox="0 0 132 67">
      {/* ears */}
      <Path
        d="M28 48 C23 32 24 14 30 4 C46 9 58 20 64 32 Z"
        fill={fur}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path
        d="M104 48 C109 32 108 14 102 4 C86 9 74 20 68 32 Z"
        fill={fur}
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M34 38 C32 27 33 18 36 12 C44 15 50 20 53 27 Z" fill={PINK} />
      <Path d="M98 38 C100 27 99 18 96 12 C88 15 82 20 79 27 Z" fill={PINK} />
      {/* head: a half-ellipse resting on the card edge */}
      <Path d="M20 60 A46 31 0 0 1 112 60 Z" fill={fur} />
      <Path d="M20 60 A46 31 0 0 1 112 60" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* happy eyes, blush, nose */}
      <Path d="M43 47 Q49 39 55 47" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <Path d="M77 47 Q83 39 89 47" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <Ellipse cx={36} cy={53} rx={7} ry={4.5} fill={PINK} opacity={0.85} />
      <Ellipse cx={96} cy={53} rx={7} ry={4.5} fill={PINK} opacity={0.85} />
      <Ellipse cx={66} cy={51} rx={3.6} ry={2.6} fill={CAT.nose} />
      {/* paws on the rim */}
      <Ellipse cx={32} cy={60} rx={13} ry={7} fill={fur} stroke={INK} strokeWidth={3} />
      <Ellipse cx={100} cy={60} rx={13} ry={7} fill={fur} stroke={INK} strokeWidth={3} />
      {[27, 32, 37].map((x) => (
        <Circle key={x} cx={x} cy={60} r={1.6} fill={PINK} />
      ))}
      {[95, 100, 105].map((x) => (
        <Circle key={x} cx={x} cy={60} r={1.6} fill={PINK} />
      ))}
    </Svg>
  );
}
