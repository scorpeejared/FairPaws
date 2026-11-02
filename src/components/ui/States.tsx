import type { Animated } from 'react-native';
import { View } from 'react-native';
import ReAnimated, { FadeInDown } from 'react-native-reanimated';
import { CatFace, type CatMood } from '@/components/cat/CatFace';
import { CatProgress } from '@/components/cat/CatProgress';
import { Button } from './Button';
import { LUCKY_CAT_ASPECT, LuckyCat } from './LuckyCat';
import { Text } from './Text';

/** Width of the cat on loading screens. Keep in sync with `imageWidth` of expo-splash-screen in app.json so the native splash hands over seamlessly. */
const LOADING_CAT_SIZE = 180;

interface LoadingProps {
  /** Caption under the bar. */
  label?: string;
  /** Determinate 0..1 progress; omit for an endless loop. */
  progress?: Animated.Value;
}

export function LoadingView({ label = 'Fetching…', progress }: LoadingProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={label}>
      <LuckyCat size={LOADING_CAT_SIZE} />
      {/* Absolutely placed so the cat stays dead-centre, exactly where the splash image sits. */}
      <View
        style={{
          position: 'absolute',
          top: '50%',
          marginTop: (LOADING_CAT_SIZE * LUCKY_CAT_ASPECT) / 2 + 22,
          alignItems: 'center',
          gap: 10,
        }}
      >
        <CatProgress progress={progress} width={220} catSize={50} />
        <Text tone="secondary" variant="caption">
          {label}
        </Text>
      </View>
    </View>
  );
}

interface MessageProps {
  title: string;
  message: string;
  mood?: CatMood;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'danger';
}

/** Used for empty lists and error screens alike: a cat with something to say. */
export function MessageView({ title, message, mood, actionLabel, onAction, tone = 'neutral' }: MessageProps) {
  const face: CatMood = mood ?? (tone === 'danger' ? 'oops' : 'curious');
  return (
    <ReAnimated.View
      entering={FadeInDown.duration(350)}
      style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 32, gap: 8 }}
    >
      <CatFace size={104} mood={face} />
      <Text variant="headline" style={{ textAlign: 'center', marginTop: 8 }}>
        {title}
      </Text>
      <Text tone="secondary" style={{ textAlign: 'center', maxWidth: 300 }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View style={{ marginTop: 16 }}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant={tone === 'danger' ? 'secondary' : 'primary'}
          />
        </View>
      ) : null}
    </ReAnimated.View>
  );
}
