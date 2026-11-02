export interface Colors {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** The cat's pink: cheeks, ears, paw pads. Decoration and gentle highlights. */
  pink: string;
  pinkSoft: string;
  /** The cat's outline brown. */
  ink: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  overlay: string;
  shadow: string;
  /** Participant colors, same order in both themes. */
  people: string[];
}

const people = [
  '#F2766B', // coral
  '#F0A83C', // amber
  '#8CC152', // lime
  '#3DB7A4', // teal
  '#5AA7E8', // sky
  '#8C80EA', // indigo
  '#C27BE0', // violet
  '#EE7FA9', // rose
];

export const lightColors: Colors = {
  background: '#FFF7EF',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#F3E4D6',
  text: '#3A2A28',
  textSecondary: '#7D6764',
  textTertiary: '#B3A09B',
  accent: '#1E8A6E',
  accentSoft: '#E1F3EB',
  onAccent: '#FFFFFF',
  pink: '#F28BA0',
  pinkSoft: '#FFE6EB',
  ink: '#4A3433',
  danger: '#D14B40',
  dangerSoft: '#FDE9E6',
  warning: '#A8660A',
  warningSoft: '#FDF1D8',
  success: '#1E8A6E',
  overlay: 'rgba(58,42,40,0.45)',
  shadow: '#A8704A',
  people,
};

export const darkColors: Colors = {
  background: '#171213',
  surface: '#221B1C',
  surfaceRaised: '#2C2324',
  border: '#382C2D',
  text: '#FBEFE6',
  textSecondary: '#C2ADA6',
  textTertiary: '#7D6B66',
  accent: '#7FDDB8',
  accentSoft: '#1E3A31',
  onAccent: '#0B2A20',
  pink: '#F7A3B5',
  pinkSoft: '#3B2229',
  ink: '#4A3433',
  danger: '#FF8A7E',
  dangerSoft: '#3E1F1C',
  warning: '#F0B050',
  warningSoft: '#33260F',
  success: '#7FDDB8',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  people,
};

export const radius = { md: 18, lg: 24, pill: 999 } as const;

/** Nunito: a rounded typeface that suits the cat theme. Loaded in the root layout. */
export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
} as const;

export type TextVariant = 'display' | 'title' | 'headline' | 'body' | 'bodyStrong' | 'caption' | 'label';

export const typography: Record<
  TextVariant,
  { fontSize: number; lineHeight: number; fontFamily: string; letterSpacing?: number }
> = {
  display: { fontSize: 46, lineHeight: 52, fontFamily: fonts.heavy, letterSpacing: -1 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.heavy, letterSpacing: -0.4 },
  headline: { fontSize: 18, lineHeight: 24, fontFamily: fonts.bold },
  body: { fontSize: 16, lineHeight: 22, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },
  label: { fontSize: 12, lineHeight: 16, fontFamily: fonts.bold, letterSpacing: 0.8 },
};
