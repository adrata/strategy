/**
 * Sign In Screen
 * Mobile authentication screen
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../../lib/api-client';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{ token: string; user: any }>('/api/v1/auth/sign-in', {
        email,
        password,
      });

      if (response.token) {
        await apiClient.setAuthToken(response.token);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl font-bold mb-2 text-center text-black">Adrata</Text>
      <Text className="text-base text-gray-600 mb-8 text-center">Sign in to continue</Text>

      <TextInput
        className="border border-gray-300 rounded-lg p-4 mb-4 text-base"
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        className="border border-gray-300 rounded-lg p-4 mb-4 text-base"
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        className={`bg-black rounded-lg p-4 items-center mt-2 ${loading ? 'opacity-60' : ''}`}
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text className="text-white text-base font-semibold">
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

