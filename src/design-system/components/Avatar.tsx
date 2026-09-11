import React from 'react';
import { Image, View } from 'react-native';

import { AppText } from './AppText';
import { useTheme } from '../ThemeProvider';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  emoji?: string | null;
}

const AVATAR_COLORS = ['#818CF8', '#34D399', '#FB923C', '#38BDF8', '#F472B6', '#FBBF24'];

function colorForName(name: string) {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function Avatar({ uri, name, size = 48, emoji }: AvatarProps) {
  const theme = useTheme();
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.surfaceMuted }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorForName(name || 'x'),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText style={{ color: '#fff', fontSize: size * 0.42 }} weight="bold">
        {emoji ?? initial}
      </AppText>
    </View>
  );
}
