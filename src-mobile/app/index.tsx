/**
 * Entry point for the mobile app
 * Handles initial routing and authentication checks
 */

import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../lib/api-client';

export default function Index() {
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check if user is authenticated
      // For now, redirect to auth screen
      // TODO: Implement actual auth check
      setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 1000);
    } catch (error) {
      // Not authenticated, go to sign-in
      router.replace('/auth/sign-in');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Loading Adrata...</Text>
    </View>
  );
}

