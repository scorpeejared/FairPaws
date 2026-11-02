import { useEffect, useState } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Text } from './Text';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PADDING = 3;

export function Segmented<T extends string>({ options, value, onChange, small, style }: Props<T>) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segment = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const [x] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(x, { toValue: index * segment, useNativeDriver: true, speed: 28, bounciness: 3 }).start();
  }, [index, segment, x]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        {
          flexDirection: 'row',
          padding: PADDING,
          borderRadius: radius.pill,
          backgroundColor: colors.border,
          opacity: 1,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {segment > 0 ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: PADDING,
            bottom: PADDING,
            left: PADDING,
            width: segment,
            borderRadius: radius.pill,
            backgroundColor: colors.surfaceRaised,
            transform: [{ translateX: x }],
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptics.select();
                onChange(option.value);
              }
            }}
            style={{ flex: 1, minHeight: small ? 34 : 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              variant="bodyStrong"
              tone={selected ? 'primary' : 'secondary'}
              style={{ fontSize: small ? 14 : 15 }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
