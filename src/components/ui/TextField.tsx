import { forwardRef, useState, type ReactNode } from 'react';
import {
  Platform,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  left?: ReactNode;
  right?: ReactNode;
}

export const TextField = forwardRef<TextInputInstance, Props>(function TextField(
  { containerStyle, left, right, style, onFocus, onBlur, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 52,
          paddingHorizontal: 16,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.border,
        },
        containerStyle,
      ]}
    >
      {left}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          {
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            fontFamily: fonts.medium,
            color: colors.text,
            paddingVertical: 12,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
          style,
        ]}
      />
      {right}
    </View>
  );
});
