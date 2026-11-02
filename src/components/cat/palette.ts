/**
 * Colours of the cat artwork. One place, so every cat (lucky cat, faces, runner,
 * peeking cat) and the generated icons stay in step. Plain data: no React imports,
 * because the brand build script reads it under Node.
 */
export const CAT = {
  fur: '#FFFFFF',
  ink: '#4A3433',
  pink: '#FFB3C1',
  nose: '#F28BA0',
  blush: '#FFA7B6',
  belly: '#FFF3E6',
  collar: '#E85D5D',
  gold: '#FFD36B',
  goldDark: '#E0A02B',
  orange: '#F6B26B',
  brown: '#8A6F6A',
  water: '#9AD5F5',
} as const;

/** Icon and logo background: a soft pink gradient (top-left, bottom-right). */
export const ICON_GRADIENT = ['#FFE0E7', '#FFB3C4'] as const;
