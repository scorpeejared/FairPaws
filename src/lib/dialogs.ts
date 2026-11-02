import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  /** Styles the confirm button as destructive on iOS. Defaults to true. */
  destructive?: boolean;
}

const asText = (title: string, message?: string) => [title, message].filter(Boolean).join('\n\n');

/**
 * Asks the user to confirm something. Resolves true only if they confirm.
 *
 * React Native's `Alert.alert` does nothing on web, so the web build falls back to the
 * browser's own dialog; native keeps the platform alert.
 */
export function confirm({
  title,
  message,
  confirmLabel,
  destructive = true,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm(asText(title, message)));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Tells the user something (an error, usually). Same web fallback as `confirm`. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    globalThis.alert(asText(title, message));
    return;
  }
  Alert.alert(title, message);
}
