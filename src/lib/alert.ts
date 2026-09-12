import { Alert as RNAlert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * react-native-web's Alert.alert is a no-op (see react-native-web/src/exports/Alert),
 * so every confirmation/error dialog in the app silently did nothing on web. This
 * wraps the same signature, falling back to window.confirm/alert on web.
 */
function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join('\n\n');
  const actionable = (buttons ?? []).filter((b) => b.style !== 'cancel');

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  if (window.confirm(text)) {
    (actionable[actionable.length - 1] ?? buttons[buttons.length - 1])?.onPress?.();
  } else {
    buttons.find((b) => b.style === 'cancel')?.onPress?.();
  }
}

function prompt(title: string, message?: string, onSubmit?: (value: string) => void): void {
  if (Platform.OS === 'web') {
    const value = window.prompt([title, message].filter(Boolean).join('\n\n'));
    if (value !== null) onSubmit?.(value);
    return;
  }
  if (Platform.OS === 'ios') {
    RNAlert.prompt(title, message, onSubmit);
  }
}

export const Alert = { alert, prompt };
