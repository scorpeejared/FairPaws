import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { row } from '@/theme/layout';

interface Props {
  title?: string;
  /** 'back' pops the stack; 'close' is used for modals. */
  leading?: 'back' | 'close';
  onLeading?: () => void;
  children?: ReactNode;
  trailing?: ReactNode;
}

export function Header({ title, leading = 'back', onLeading, children, trailing }: Props) {
  return (
    <View style={{ ...row, paddingHorizontal: 8, paddingVertical: 4, minHeight: 56 }}>
      <IconButton
        icon={leading === 'back' ? 'chevron-left' : 'x'}
        label={leading === 'back' ? 'Back' : 'Close'}
        onPress={onLeading ?? (() => router.back())}
      />
      <View style={{ flex: 1, paddingHorizontal: 4 }}>
        {children ?? (
          <Text variant="headline" numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}
