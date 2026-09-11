import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useTheme } from '../ThemeProvider';

interface ProgressBarProps {
  progress: number; // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ progress, height = 10, color, trackColor }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clamped, width]);

  return (
    <View
      style={{
        height,
        borderRadius: theme.radius.pill,
        backgroundColor: trackColor ?? theme.colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: theme.radius.pill,
          backgroundColor: color ?? theme.colors.primary,
          width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
