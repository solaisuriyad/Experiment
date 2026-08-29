import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/context/app-context';
import { palette } from '@/components/ui';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.ink,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'VyaparQuotes' }} />
        <Stack.Screen name="new-quote" options={{ title: 'New quotation' }} />
        <Stack.Screen name="quote/[id]" options={{ title: 'Edit quotation' }} />
        <Stack.Screen name="preview" options={{ title: 'Preview' }} />
        <Stack.Screen name="products" options={{ title: 'Products' }} />
        <Stack.Screen name="settings" options={{ title: 'Business profile' }} />
      </Stack>
    </AppProvider>
  );
}
