import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography, type Colors, type TextVariant } from '@/theme/tokens';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'warning' | 'onAccent';

const toneKey: Record<Tone, keyof Colors> = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accent',
  danger: 'danger',
  warning: 'warning',
  onAccent: 'onAccent',
};

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: Tone;
  /** Fixed-width digits so amounts line up and don't jitter while editing. */
  numeric?: boolean;
}

export function Text({ variant = 'body', tone = 'primary', numeric, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: colors[toneKey[tone]] as string },
        numeric && { fontVariant: ['tabular-nums'] },
        variant === 'label' && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
