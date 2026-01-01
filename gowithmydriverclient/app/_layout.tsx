import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="ride/vehicle-selection" />
        <Stack.Screen name="ride/available-drivers" />
        <Stack.Screen name="ride/tracking" />
        <Stack.Screen name="ride/rate" />
        <Stack.Screen name="payment/add" />
        <Stack.Screen name="payment/methods" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
