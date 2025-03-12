import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';

export default function TravelLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Editar Viagem',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="details/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 