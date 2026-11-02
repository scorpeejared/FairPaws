// One import per weight: the package's top-level entry would bundle all 18 font files.
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { LoadingView, MessageView } from '@/components/ui/States';
import { getDb } from '@/db/database';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

/**
 * Shortest time the opening cat stays up, so the wave is seen even when startup is
 * instant. This only holds the screen: the bar itself follows the real steps below.
 */
const MIN_SPLASH_MS = 900;
/** Time the bar takes to glide to each newly reached step. */
const STEP_GLIDE_MS = 450;

const STEP_LABELS = ['Waking the cat…', 'Counting the treats…', 'Polishing the bell…', 'Ready!'];

function describeStartupError(error: unknown): string {
  const detail = error instanceof Error ? error.message : 'Could not open the database.';
  if (Platform.OS === 'web') {
    // On the web the likeliest causes are a private tab or an old browser (no file storage), or a
    // deploy that lost its files, so the real error is shown too instead of guessing.
    return `Fair Paws couldn't open its database in this browser. If you're in a private tab, try a normal tab, then add it to your Home Screen.\n\nDetails: ${detail}`;
  }
  return detail;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Boot />
    </ThemeProvider>
  );
}

/**
 * Loads fonts, opens the database and reads settings before any screen renders.
 * Progress is the number of those three steps that have finished.
 */
function Boot() {
  const { colors, isDark } = useTheme();
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const loadSettings = useSettingsStore((s) => s.load);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [dbReady, setDbReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [heldLongEnough, setHeldLongEnough] = useState(false);
  const [barFull, setBarFull] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));

  const start = useCallback(() => {
    getDb()
      .then(() => {
        setDbReady(true);
        return loadSettings();
      })
      .catch((e: unknown) => setFailed(describeStartupError(e)));
  }, [loadSettings]);
  const retry = () => {
    setFailed(null);
    start();
  };

  useEffect(start, [start]);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);
  useEffect(() => {
    const timer = setTimeout(() => setHeldLongEnough(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // A font failure falls back to system fonts, so it still counts as a finished step.
  const steps = [fontsLoaded || !!fontError, dbReady, settingsLoaded];
  const finished = steps.filter(Boolean).length;

  useEffect(() => {
    const glide = Animated.timing(progress, {
      toValue: finished / steps.length,
      duration: STEP_GLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    glide.start(({ finished: arrived }) => {
      if (arrived && finished === steps.length) setBarFull(true);
    });
    return () => glide.stop();
    // `steps.length` is a constant 3.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, progress]);

  const ready = barFull && heldLongEnough;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* On a wide browser window keep the app phone-shaped and centred; on devices it fills the screen. */}
      <View
        style={{
          flex: 1,
          width: '100%',
          alignSelf: 'center',
          maxWidth: Platform.OS === 'web' ? 560 : undefined,
        }}
      >
        {failed ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <MessageView
              tone="danger"
              title="The cat can't find your data"
              message={failed}
              actionLabel="Try again"
              onAction={retry}
            />
          </View>
        ) : !ready ? (
          <LoadingView label={STEP_LABELS[finished]} progress={progress} />
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="bill/[id]" options={{ gestureEnabled: true }} />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        )}
      </View>
    </View>
  );
}
